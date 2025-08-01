import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PageRepo } from '@docmost/db/repos/page/page.repo';
import { InsertablePage, Page, User } from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import {
  executeWithPagination,
  PaginationResult,
} from '@docmost/db/pagination/pagination';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import { MovePageDto } from '../dto/move-page.dto';
import { ExpressionBuilder } from 'kysely';
import { DB } from '@docmost/db/types/db';
import { generateSlugId } from '../../../common/helpers';
import { executeTx } from '@docmost/db/utils';
import { AttachmentRepo } from '@docmost/db/repos/attachment/attachment.repo';
import { v7 as uuid7 } from 'uuid';
import {
  createYdocFromJson,
  getAttachmentIds,
  getProsemirrorContent,
  isAttachmentNode,
  removeMarkTypeFromDoc,
} from '../../../common/helpers/prosemirror/utils';
import { jsonToNode, jsonToText } from 'src/collaboration/collaboration.util';
import { CopyPageMapEntry, ICopyPageAttachment } from '../dto/copy-page.dto';
import { Node as PMNode } from '@tiptap/pm/model';
import { StorageService } from '../../../integrations/storage/storage.service';

@Injectable()
export class PageService {
  private readonly logger = new Logger(PageService.name);

  constructor(
    private pageRepo: PageRepo,
    private attachmentRepo: AttachmentRepo,
    @InjectKysely() private readonly db: KyselyDB,
    private readonly storageService: StorageService,
  ) {}

  async findById(
    pageId: string,
    includeContent?: boolean,
    includeYdoc?: boolean,
    includeSpace?: boolean,
  ): Promise<Page> {
    const page = await this.pageRepo.findById(pageId, {
      includeContent,
      includeYdoc,
      includeSpace,
    });

    return page;
  }

  async create(
    userId: string,
    workspaceId: string,
    createPageDto: CreatePageDto,
  ): Promise<Page> {
    let parentPageId = undefined;

    // 如果是日记，处理日记文件夹逻辑
    if (createPageDto.isJournal && createPageDto.journalDate) {
      // 检查该日期是否已有日记
      const existingJournal = await this.db
        .selectFrom('pages')
        .select('id')
        .where('spaceId', '=', createPageDto.spaceId)
        .where('isJournal', '=', true)
        .where('journalDate', '=', new Date(createPageDto.journalDate))
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (existingJournal) {
        throw new BadRequestException('该日期已有日记');
      }

      const date = new Date(createPageDto.journalDate);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      // 查找或创建日记根文件夹
      let journalRootFolder = await this.db
        .selectFrom('pages')
        .select('id')
        .where('spaceId', '=', createPageDto.spaceId)
        .where('title', '=', '日记')
        .where('parentPageId', 'is', null)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (!journalRootFolder) {
        // 创建日记根文件夹
        const createdRootFolder = await this.pageRepo.insertPage({
          slugId: generateSlugId(),
          title: '日记',
          position: await this.nextPagePosition(createPageDto.spaceId),
          icon: '📔',
          parentPageId: null,
          spaceId: createPageDto.spaceId,
          creatorId: userId,
          workspaceId: workspaceId,
          lastUpdatedById: userId,
          isJournal: false,
          journalDate: null,
        });
        journalRootFolder = { id: createdRootFolder.id };
      }

      // 查找或创建年份文件夹
      let yearFolder = await this.db
        .selectFrom('pages')
        .select('id')
        .where('spaceId', '=', createPageDto.spaceId)
        .where('title', '=', `${year}年`)
        .where('parentPageId', '=', journalRootFolder.id)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (!yearFolder) {
        // 创建年份文件夹
        const createdYearFolder = await this.pageRepo.insertPage({
          slugId: generateSlugId(),
          title: `${year}年`,
          position: await this.nextPagePosition(createPageDto.spaceId, journalRootFolder.id),
          icon: '📅',
          parentPageId: journalRootFolder.id,
          spaceId: createPageDto.spaceId,
          creatorId: userId,
          workspaceId: workspaceId,
          lastUpdatedById: userId,
          isJournal: false,
          journalDate: null,
        });
        yearFolder = { id: createdYearFolder.id };
      }

      // 查找或创建月份文件夹
      let monthFolder = await this.db
        .selectFrom('pages')
        .select('id')
        .where('spaceId', '=', createPageDto.spaceId)
        .where('title', '=', `${month}月`)
        .where('parentPageId', '=', yearFolder.id)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();

      if (!monthFolder) {
        // 创建月份文件夹
        const createdMonthFolder = await this.pageRepo.insertPage({
          slugId: generateSlugId(),
          title: `${month}月`,
          position: await this.nextPagePosition(createPageDto.spaceId, yearFolder.id),
          icon: '📆',
          parentPageId: yearFolder.id,
          spaceId: createPageDto.spaceId,
          creatorId: userId,
          workspaceId: workspaceId,
          lastUpdatedById: userId,
          isJournal: false,
          journalDate: null,
        });
        monthFolder = { id: createdMonthFolder.id };
      }

      parentPageId = monthFolder.id;
    } else if (createPageDto.parentPageId) {
      // 非日记页面的父页面检查
      const parentPage = await this.pageRepo.findById(
        createPageDto.parentPageId,
      );

      if (!parentPage || parentPage.spaceId !== createPageDto.spaceId) {
        throw new NotFoundException('Parent page not found');
      }

      parentPageId = parentPage.id;
    }

    const createdPage = await this.pageRepo.insertPage({
      slugId: generateSlugId(),
      title: createPageDto.title,
      position: await this.nextPagePosition(
        createPageDto.spaceId,
        parentPageId,
      ),
      icon: createPageDto.icon,
      parentPageId: parentPageId,
      spaceId: createPageDto.spaceId,
      creatorId: userId,
      workspaceId: workspaceId,
      lastUpdatedById: userId,
      isJournal: createPageDto.isJournal || false,
      journalDate: createPageDto.journalDate ? new Date(createPageDto.journalDate) : null,
      content: null,
    });

    return createdPage;
  }

  async nextPagePosition(spaceId: string, parentPageId?: string) {
    let pagePosition: string;

    const lastPageQuery = this.db
      .selectFrom('pages')
      .select(['position'])
      .where('spaceId', '=', spaceId)
      .orderBy('position', 'desc')
      .limit(1);

    if (parentPageId) {
      // check for children of this page
      const lastPage = await lastPageQuery
        .where('parentPageId', '=', parentPageId)
        .executeTakeFirst();

      if (!lastPage) {
        pagePosition = generateJitteredKeyBetween(null, null);
      } else {
        // if there is an existing page, we should get a position below it
        pagePosition = generateJitteredKeyBetween(lastPage.position, null);
      }
    } else {
      // for root page
      const lastPage = await lastPageQuery
        .where('parentPageId', 'is', null)
        .executeTakeFirst();

      // if no existing page, make this the first
      if (!lastPage) {
        pagePosition = generateJitteredKeyBetween(null, null); // we expect "a0"
      } else {
        // if there is an existing page, we should get a position below it
        pagePosition = generateJitteredKeyBetween(lastPage.position, null);
      }
    }

    return pagePosition;
  }

  async update(
    page: Page,
    updatePageDto: UpdatePageDto,
    userId: string,
  ): Promise<Page> {
    const contributors = new Set<string>(page.contributorIds);
    contributors.add(userId);
    const contributorIds = Array.from(contributors);

    await this.pageRepo.updatePage(
      {
        title: updatePageDto.title,
        icon: updatePageDto.icon,
        lastUpdatedById: userId,
        updatedAt: new Date(),
        contributorIds: contributorIds,
      },
      page.id,
    );

    return await this.pageRepo.findById(page.id, {
      includeSpace: true,
      includeContent: true,
      includeCreator: true,
      includeLastUpdatedBy: true,
      includeContributors: true,
    });
  }

  withHasChildren(eb: ExpressionBuilder<DB, 'pages'>) {
    return eb
      .selectFrom('pages as child')
      .select((eb) =>
        eb
          .case()
          .when(eb.fn.countAll(), '>', 0)
          .then(true)
          .else(false)
          .end()
          .as('count'),
      )
      .whereRef('child.parentPageId', '=', 'pages.id')
      .limit(1)
      .as('hasChildren');
  }

  async getSidebarPages(
    spaceId: string,
    pagination: PaginationOptions,
    pageId?: string,
  ): Promise<any> {
    let query = this.db
      .selectFrom('pages')
      .select([
        'id',
        'slugId',
        'title',
        'icon',
        'position',
        'parentPageId',
        'spaceId',
        'creatorId',
      ])
      .select((eb) => this.withHasChildren(eb))
      .orderBy('position', 'asc')
      .where('spaceId', '=', spaceId);

    if (pageId) {
      query = query.where('parentPageId', '=', pageId);
    } else {
      query = query.where('parentPageId', 'is', null);
    }

    const result = executeWithPagination(query, {
      page: pagination.page,
      perPage: 250,
    });

    return result;
  }

  async movePageToSpace(rootPage: Page, spaceId: string) {
    await executeTx(this.db, async (trx) => {
      // Update root page
      const nextPosition = await this.nextPagePosition(spaceId);
      await this.pageRepo.updatePage(
        { spaceId, parentPageId: null, position: nextPosition },
        rootPage.id,
        trx,
      );
      const pageIds = await this.pageRepo
        .getPageAndDescendants(rootPage.id, { includeContent: false })
        .then((pages) => pages.map((page) => page.id));
      // The first id is the root page id
      if (pageIds.length > 1) {
        // Update sub pages
        await this.pageRepo.updatePages(
          { spaceId },
          pageIds.filter((id) => id !== rootPage.id),
          trx,
        );
      }

      // update spaceId in shares
      if (pageIds.length > 0) {
        await trx
          .updateTable('shares')
          .set({ spaceId: spaceId })
          .where('pageId', 'in', pageIds)
          .execute();
      }

      // Update attachments
      await this.attachmentRepo.updateAttachmentsByPageId(
        { spaceId },
        pageIds,
        trx,
      );
    });
  }

  async copyPageToSpace(rootPage: Page, spaceId: string, authUser: User) {

    const nextPosition = await this.nextPagePosition(spaceId);

    const pages = await this.pageRepo.getPageAndDescendants(rootPage.id, {
      includeContent: true,
    });

    const pageMap = new Map<string, CopyPageMapEntry>();
    pages.forEach((page) => {
      pageMap.set(page.id, {
        newPageId: uuid7(),
        newSlugId: generateSlugId(),
        oldSlugId: page.slugId,
      });
    });

    const attachmentMap = new Map<string, ICopyPageAttachment>();

    const insertablePages: InsertablePage[] = await Promise.all(
      pages.map(async (page) => {
        const pageContent = getProsemirrorContent(page.content);
        const pageFromMap = pageMap.get(page.id);

        const doc = jsonToNode(pageContent);
        const prosemirrorDoc = removeMarkTypeFromDoc(doc, 'comment');

        const attachmentIds = getAttachmentIds(prosemirrorDoc.toJSON());

        if (attachmentIds.length > 0) {
          attachmentIds.forEach((attachmentId: string) => {
            const newPageId = pageFromMap.newPageId;
            const newAttachmentId = uuid7();
            attachmentMap.set(attachmentId, {
              newPageId: newPageId,
              oldPageId: page.id,
              oldAttachmentId: attachmentId,
              newAttachmentId: newAttachmentId,
            });

            prosemirrorDoc.descendants((node: PMNode) => {
              if (isAttachmentNode(node.type.name)) {
                if (node.attrs.attachmentId === attachmentId) {
                  //@ts-ignore
                  node.attrs.attachmentId = newAttachmentId;

                  if (node.attrs.src) {
                    //@ts-ignore
                    node.attrs.src = node.attrs.src.replace(
                      attachmentId,
                      newAttachmentId,
                    );
                  }
                  if (node.attrs.src) {
                    //@ts-ignore
                    node.attrs.src = node.attrs.src.replace(
                      attachmentId,
                      newAttachmentId,
                    );
                  }
                }
              }
            });
          });
        }

        const prosemirrorJson = prosemirrorDoc.toJSON();

        return {
          id: pageFromMap.newPageId,
          slugId: pageFromMap.newSlugId,
          title: page.title,
          icon: page.icon,
          content: prosemirrorJson,
          textContent: jsonToText(prosemirrorJson),
          ydoc: createYdocFromJson(prosemirrorJson),
          position: page.id === rootPage.id ? nextPosition : page.position,
          spaceId: spaceId,
          workspaceId: page.workspaceId,
          creatorId: authUser.id,
          lastUpdatedById: authUser.id,
          parentPageId: page.parentPageId
            ? pageMap.get(page.parentPageId)?.newPageId
            : null,
        };
      }),
    );

    await this.db.insertInto('pages').values(insertablePages).execute();

    const attachmentsIds = Array.from(attachmentMap.keys());
    if (attachmentsIds.length > 0) {
      const attachments = await this.db
        .selectFrom('attachments')
        .selectAll()
        .where('id', 'in', attachmentsIds)
        .where('workspaceId', '=', rootPage.workspaceId)
        .execute();

      for (const attachment of attachments) {
        try {
          const pageAttachment = attachmentMap.get(attachment.id);

          // make sure the copied attachment belongs to the page it was copied from
          if (attachment.pageId !== pageAttachment.oldPageId) {
            continue;
          }

          const newAttachmentId = pageAttachment.newAttachmentId;

          const newPageId = pageAttachment.newPageId;

          const newPathFile = attachment.filePath.replace(
            attachment.id,
            newAttachmentId,
          );
          await this.storageService.copy(attachment.filePath, newPathFile);
          await this.db
            .insertInto('attachments')
            .values({
              id: newAttachmentId,
              type: attachment.type,
              filePath: newPathFile,
              fileName: attachment.fileName,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              fileExt: attachment.fileExt,
              creatorId: attachment.creatorId,
              workspaceId: attachment.workspaceId,
              pageId: newPageId,
              spaceId: spaceId,
            })
            .execute();
        } catch (err) {
          this.logger.log(err);
        }
      }
    }

    const newPageId = pageMap.get(rootPage.id).newPageId;
    return await this.pageRepo.findById(newPageId, {
      includeSpace: true,
    });
  }

  async movePage(dto: MovePageDto, movedPage: Page) {
    // validate position value by attempting to generate a key
    try {
      generateJitteredKeyBetween(dto.position, null);
    } catch (err) {
      throw new BadRequestException('Invalid move position');
    }

    let parentPageId = null;
    if (movedPage.parentPageId === dto.parentPageId) {
      parentPageId = undefined;
    } else {
      // changing the page's parent
      if (dto.parentPageId) {
        const parentPage = await this.pageRepo.findById(dto.parentPageId);
        if (!parentPage || parentPage.spaceId !== movedPage.spaceId) {
          throw new NotFoundException('Parent page not found');
        }
        parentPageId = parentPage.id;
      }
    }

    await this.pageRepo.updatePage(
      {
        position: dto.position,
        parentPageId: parentPageId,
      },
      dto.pageId,
    );
  }

  async getPageBreadCrumbs(childPageId: string) {
    const ancestors = await this.db
      .withRecursive('page_ancestors', (db) =>
        db
          .selectFrom('pages')
          .select([
            'id',
            'slugId',
            'title',
            'icon',
            'position',
            'parentPageId',
            'spaceId',
          ])
          .select((eb) => this.withHasChildren(eb))
          .where('id', '=', childPageId)
          .unionAll((exp) =>
            exp
              .selectFrom('pages as p')
              .select([
                'p.id',
                'p.slugId',
                'p.title',
                'p.icon',
                'p.position',
                'p.parentPageId',
                'p.spaceId',
              ])
              .select(
                exp
                  .selectFrom('pages as child')
                  .select((eb) =>
                    eb
                      .case()
                      .when(eb.fn.countAll(), '>', 0)
                      .then(true)
                      .else(false)
                      .end()
                      .as('count'),
                  )
                  .whereRef('child.parentPageId', '=', 'id')
                  .limit(1)
                  .as('hasChildren'),
              )
              //.select((eb) => this.withHasChildren(eb))
              .innerJoin('page_ancestors as pa', 'pa.parentPageId', 'p.id'),
          ),
      )
      .selectFrom('page_ancestors')
      .selectAll()
      .execute();

    return ancestors.reverse();
  }

  async getRecentSpacePages(
    spaceId: string,
    pagination: PaginationOptions,
  ): Promise<PaginationResult<Page>> {
    return await this.pageRepo.getRecentPagesInSpace(spaceId, pagination);
  }

  async getRecentPages(
    userId: string,
    pagination: PaginationOptions,
  ): Promise<PaginationResult<Page>> {
    return await this.pageRepo.getRecentPages(userId, pagination);
  }

  async forceDelete(pageId: string): Promise<void> {
    await this.pageRepo.deletePage(pageId);
  }

  // 日记相关方法
  async createJournal(
    spaceId: string,
    journalDate: string,
    creatorId: string,
    title?: string,
    icon?: string,
  ): Promise<Page> {
    // 检查该日期是否已有日记
    const existingJournal = await this.db
      .selectFrom('pages')
      .selectAll()
      .where('spaceId', '=', spaceId)
      .where('isJournal', '=', true)
      .where('journalDate', '=', new Date(journalDate))
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (existingJournal) {
      throw new BadRequestException('该日期已有日记');
    }

    const insertableData: InsertablePage = {
      slugId: generateSlugId(),
      title: title || `${journalDate} 日记`,
      icon: icon || '📝',
      spaceId,
      workspaceId: (await this.db
        .selectFrom('spaces')
        .select('workspaceId')
        .where('id', '=', spaceId)
        .executeTakeFirstOrThrow()).workspaceId,
      creatorId,
      isJournal: true,
      journalDate,
      content: null,
    };

    const createdPage = await this.pageRepo.insertPage(insertableData);
    return await this.pageRepo.findById(createdPage.id, {
      includeContent: true,
      includeSpace: true,
      includeCreator: true
    });
  }

  async getJournalByDate(
    spaceId: string,
    journalDate: string,
    includeContent = false,
  ): Promise<Page | null> {
    const query = this.db
      .selectFrom('pages')
      .where('spaceId', '=', spaceId)
      .where('isJournal', '=', true)
      .where('journalDate', '=', new Date(journalDate))
      .where('deletedAt', 'is', null);

    if (includeContent) {
      return await query
        .selectAll()
        .executeTakeFirst() as Page | null;
    } else {
      return await query
        .select([
          'id',
          'slugId',
          'title',
          'icon',
          'journalDate',
          'createdAt',
          'updatedAt',
          'spaceId',
          'workspaceId',
          'creatorId',
        ])
        .executeTakeFirst() as Page | null;
    }
  }

  async getJournalList(
    spaceId: string,
    pagination: PaginationOptions,
    startDate?: string,
    endDate?: string,
    includeContent = false,
  ): Promise<PaginationResult<Page>> {
    let query = this.db
      .selectFrom('pages')
      .where('spaceId', '=', spaceId)
      .where('isJournal', '=', true)
      .where('deletedAt', 'is', null);

    if (startDate) {
      query = query.where('journalDate', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('journalDate', '<=', new Date(endDate));
    }

    if (includeContent) {
      query = query.selectAll();
    } else {
      query = query.select([
        'id',
        'slugId',
        'title',
        'icon',
        'journalDate',
        'isJournal',
        'createdAt',
        'updatedAt',
        'spaceId',
        'workspaceId',
        'creatorId',
      ]);
    }

    query = query.orderBy('journalDate', 'desc');

    return await executeWithPagination(query, {
      page: pagination.page,
      perPage: pagination.limit
    }) as PaginationResult<Page>;
  }

  async updateJournal(
    pageId: string,
    updateData: {
      title?: string;
      icon?: string;
      journalDate?: string;
    },
  ): Promise<Page> {
    // 验证页面是日记
    const page = await this.db
      .selectFrom('pages')
      .select(['id', 'isJournal', 'spaceId', 'journalDate'])
      .where('id', '=', pageId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!page) {
      throw new NotFoundException('页面不存在');
    }

    if (!page.isJournal) {
      throw new BadRequestException('该页面不是日记');
    }

    // 如果要更新日期，检查新日期是否冲突
    if (updateData.journalDate && new Date(updateData.journalDate).getTime() !== page.journalDate?.getTime()) {
      const existingJournal = await this.db
        .selectFrom('pages')
        .select('id')
        .where('spaceId', '=', page.spaceId)
        .where('isJournal', '=', true)
        .where('journalDate', '=', new Date(updateData.journalDate))
        .where('deletedAt', 'is', null)
        .where('id', '!=', pageId)
        .executeTakeFirst();

      if (existingJournal) {
        throw new BadRequestException('该日期已有日记');
      }
    }

    const updateFields: any = {};
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.icon !== undefined) updateFields.icon = updateData.icon;
    if (updateData.journalDate !== undefined) updateFields.journalDate = updateData.journalDate;

    if (Object.keys(updateFields).length > 0) {
      updateFields.updatedAt = new Date();
      await this.db
        .updateTable('pages')
        .set(updateFields)
        .where('id', '=', pageId)
        .execute();
    }

    return await this.pageRepo.findById(pageId, {
      includeContent: true,
      includeSpace: true,
      includeCreator: true
    });
  }
}

/*
  async delete(pageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const page = await manager
        .createQueryBuilder(Page, 'page')
        .where('page.id = :pageId', { pageId })
        .select(['page.id', 'page.workspaceId'])
        .getOne();

      if (!page) {
        throw new NotFoundException(`Page not found`);
      }
      await this.softDeleteChildrenRecursive(page.id, manager);
      await this.pageOrderingService.removePageFromHierarchy(page, manager);

      await manager.softDelete(Page, pageId);
    });
  }

  private async softDeleteChildrenRecursive(
    parentId: string,
    manager: EntityManager,
  ): Promise<void> {
    const childrenPage = await manager
      .createQueryBuilder(Page, 'page')
      .where('page.parentPageId = :parentId', { parentId })
      .select(['page.id', 'page.title', 'page.parentPageId'])
      .getMany();

    for (const child of childrenPage) {
      await this.softDeleteChildrenRecursive(child.id, manager);
      await manager.softDelete(Page, child.id);
    }
  }

  async restore(pageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const isDeleted = await manager
        .createQueryBuilder(Page, 'page')
        .where('page.id = :pageId', { pageId })
        .withDeleted()
        .getCount();

      if (!isDeleted) {
        return;
      }

      await manager.recover(Page, { id: pageId });

      await this.restoreChildrenRecursive(pageId, manager);

      // Fetch the page details to find out its parent and workspace
      const restoredPage = await manager
        .createQueryBuilder(Page, 'page')
        .where('page.id = :pageId', { pageId })
        .select(['page.id', 'page.title', 'page.spaceId', 'page.parentPageId'])
        .getOne();

      if (!restoredPage) {
        throw new NotFoundException(`Restored page not found.`);
      }

      // add page back to its hierarchy
      await this.pageOrderingService.addPageToOrder(
        restoredPage.spaceId,
        pageId,
        restoredPage.parentPageId,
      );
    });
  }

  private async restoreChildrenRecursive(
    parentId: string,
    manager: EntityManager,
  ): Promise<void> {
    const childrenPage = await manager
      .createQueryBuilder(Page, 'page')
      .setLock('pessimistic_write')
      .where('page.parentPageId = :parentId', { parentId })
      .select(['page.id', 'page.title', 'page.parentPageId'])
      .withDeleted()
      .getMany();

    for (const child of childrenPage) {
      await this.restoreChildrenRecursive(child.id, manager);
      await manager.recover(Page, { id: child.id });
    }
  }
*/
