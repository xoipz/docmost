import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  createPage,
  deletePage,
  getPageById,
  getSidebarPages,
  updatePage,
  movePage,
  getPageBreadcrumbs,
  getRecentChanges,
  getAllSidebarPages,
} from "@/features/page/services/page-service";
import {
  IMovePage,
  IPage,
  IPageInput,
  SidebarPagesParams,
} from "@/features/page/types/page.types";
import { notifications } from "@mantine/notifications";
import { IPagination } from "@/lib/types.ts";
import { queryClient } from "@/main.tsx";
import { buildTree } from "@/features/page/tree/utils";
import { useEffect } from "react";
import { validate as isValidUuid } from "uuid";
import { useTranslation } from "react-i18next";

export function usePageQuery(
  pageInput: Partial<IPageInput>,
): UseQueryResult<IPage, Error> {
  const query = useQuery({
    queryKey: ["pages", pageInput.pageId],
    queryFn: () => getPageById(pageInput),
    enabled: !!pageInput.pageId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      if (isValidUuid(pageInput.pageId)) {
        queryClient.setQueryData(["pages", query.data.slugId], query.data);
      } else {
        queryClient.setQueryData(["pages", query.data.id], query.data);
      }
    }
  }, [query.data]);

  return query;
}

export function useCreatePageMutation() {
  const { t } = useTranslation();
  return useMutation<IPage, Error, Partial<IPageInput>>({
    mutationFn: (data) => createPage(data),
    onSuccess: (data) => {
      invalidateOnCreatePage(data);
    },
    onError: (error) => {
      notifications.show({ message: t("Failed to create page"), color: "red" });
    },
  });
}

export function updatePageData(data: IPage) {
  const pageBySlug = queryClient.getQueryData<IPage>([
    "pages",
    data.slugId,
  ]);
  const pageById = queryClient.getQueryData<IPage>(["pages", data.id]);

  if (pageBySlug) {
    queryClient.setQueryData(["pages", data.slugId], {
      ...pageBySlug,
      ...data,
    });
  }

  if (pageById) {
    queryClient.setQueryData(["pages", data.id], { ...pageById, ...data });
  }

  // 如果是日记，也要直接更新日记缓存
  if (data.isJournal) {
    queryClient.setQueryData<IPage[]>(["journals", data.spaceId], (oldJournals = []) => {
      return oldJournals.map(journal => 
        journal.id === data.id 
          ? { ...journal, ...data }
          : journal
      );
    });
    
    // 失效最近更改查询
    queryClient.invalidateQueries({ queryKey: ["recent-changes", data.spaceId] });
  }

  invalidateOnUpdatePage(data.spaceId, data.parentPageId, data.id, data.title, data.icon, data.isJournal);
}

export function useUpdateTitlePageMutation() {
  return useMutation<IPage, Error, Partial<IPageInput>>({
    mutationFn: (data) => updatePage(data),
    onSuccess: (data) => {
      updatePageData(data);
      // 也需要调用invalidateOnUpdatePage来更新最近更改
      invalidateOnUpdatePage(data.spaceId, data.parentPageId, data.id, data.title, data.icon, data.isJournal);
    },
  });
}

export function useUpdatePageMutation() {
  return useMutation<IPage, Error, Partial<IPageInput>>({
    mutationFn: (data) => updatePage(data),
    onSuccess: (data) => {
      updatePage(data);

      invalidateOnUpdatePage(data.spaceId, data.parentPageId, data.id, data.title, data.icon, data.isJournal);
    },
  });
}

export function useDeletePageMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (pageId: string) => deletePage(pageId),
    onSuccess: (data, pageId) => {
      notifications.show({ message: t("Page deleted successfully") });
      invalidateOnDeletePage(pageId);
    },
    onError: (error) => {
      notifications.show({ message: t("Failed to delete page"), color: "red" });
    },
  });
}

export function useMovePageMutation() {
  return useMutation<void, Error, IMovePage>({
    mutationFn: (data) => movePage(data),
    onSuccess: () => {
      invalidateOnMovePage();
    },
  });
}

export function useGetSidebarPagesQuery(data: SidebarPagesParams|null): UseInfiniteQueryResult<InfiniteData<IPagination<IPage>, unknown>> {
  return useInfiniteQuery({
    queryKey: ["sidebar-pages", data],
    queryFn: ({ pageParam }) => getSidebarPages({ ...data, page: pageParam }),
    initialPageParam: 1,
    getPreviousPageParam: (firstPage) =>
      firstPage.meta.hasPrevPage ? firstPage.meta.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useGetRootSidebarPagesQuery(data: SidebarPagesParams) {
  return useInfiniteQuery({
    queryKey: ["root-sidebar-pages", data.spaceId],
    queryFn: async ({ pageParam }) => {
      return getSidebarPages({ spaceId: data.spaceId, page: pageParam });
    },
    initialPageParam: 1,
    getPreviousPageParam: (firstPage) =>
      firstPage.meta.hasPrevPage ? firstPage.meta.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function usePageBreadcrumbsQuery(
  pageId: string,
): UseQueryResult<Partial<IPage[]>, Error> {
  return useQuery({
    queryKey: ["breadcrumbs", pageId],
    queryFn: () => getPageBreadcrumbs(pageId),
    enabled: !!pageId,
  });
}

export async function fetchAllAncestorChildren(params: SidebarPagesParams) {
  // not using a hook here, so we can call it inside a useEffect hook
  const response = await queryClient.fetchQuery({
    queryKey: ["sidebar-pages", params],
    queryFn: () => getAllSidebarPages(params),
    staleTime: 30 * 60 * 1000,
  });

  const allItems = response.pages.flatMap((page) => page.items);
  return buildTree(allItems);
}

export function useRecentChangesQuery(
  spaceId?: string,
): UseQueryResult<IPagination<IPage>, Error> {
  return useQuery({
    queryKey: ["recent-changes", spaceId],
    queryFn: () => getRecentChanges(spaceId),
    refetchOnMount: true,
  });
}

export function invalidateOnCreatePage(data: Partial<IPage>) {
  console.log('invalidateOnCreatePage: 开始处理，接收到的data:', data);
  
  const newPage: Partial<IPage> = {
    creatorId: data.creatorId,
    hasChildren: data.hasChildren,
    icon: data.icon,
    id: data.id,
    parentPageId: data.parentPageId,
    position: data.position,
    slugId: data.slugId,
    spaceId: data.spaceId,
    title: data.title,
    isJournal: data.isJournal,
    journalDate: data.journalDate,
  };

  console.log('invalidateOnCreatePage: 构造的newPage:', newPage);
  console.log('invalidateOnCreatePage: data.isJournal 值:', data.isJournal, '类型:', typeof data.isJournal);
  console.log('invalidateOnCreatePage: 即将进行 if (data.isJournal) 判断');

  let queryKey: QueryKey = null;
  if (data.parentPageId===null) {
    queryKey = ['root-sidebar-pages', data.spaceId];
  }else{
    queryKey = ['sidebar-pages', {pageId: data.parentPageId, spaceId: data.spaceId}]
  }

  console.log('invalidateOnCreatePage: 执行 if (data.isJournal) 判断，结果:', !!data.isJournal);
  
  // 如果是日记，直接更新日记缓存而不是失效
  if (data.isJournal) {
    console.log('invalidateOnCreatePage: 处理日记创建，data:', data);
    
    // 直接将新日记添加到缓存中
    const queryKey = ["journals", data.spaceId];
    console.log('invalidateOnCreatePage: 使用查询键:', queryKey);
    
    queryClient.setQueryData<IPage[]>(queryKey, (oldJournals = []) => {
      console.log('invalidateOnCreatePage: 当前缓存的日记数量:', oldJournals.length);
      console.log('invalidateOnCreatePage: 要添加的新日记:', newPage);
      
      // 确保不重复添加
      const existingIndex = oldJournals.findIndex(j => j.id === data.id);
      if (existingIndex >= 0) {
        console.log('invalidateOnCreatePage: 更新现有日记');
        // 如果已存在，更新它
        const updatedJournals = [...oldJournals];
        updatedJournals[existingIndex] = { ...updatedJournals[existingIndex], ...newPage };
        return updatedJournals;
      } else {
        console.log('invalidateOnCreatePage: 添加新日记到缓存');
        // 添加新日记，按日期排序（最新的在前面）
        const updatedJournals = [newPage as IPage, ...oldJournals];
        const sortedJournals = updatedJournals.sort((a, b) => {
          if (!a.journalDate || !b.journalDate) return 0;
          return new Date(b.journalDate).getTime() - new Date(a.journalDate).getTime();
        });
        console.log('invalidateOnCreatePage: 更新后的日记数量:', sortedJournals.length);
        return sortedJournals;
      }
    });
    
    // 也更新特定日期的日记查询缓存
    if (data.journalDate) {
      queryClient.setQueryData(["journal", data.spaceId, data.journalDate], newPage);
    }
    
    // 失效最近更改查询，让它重新获取以包含新日记
    queryClient.invalidateQueries({ queryKey: ["recent-changes", data.spaceId] });
  }

  //update all sidebar pages
  queryClient.setQueryData<InfiniteData<IPagination<Partial<IPage>>>>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page,index) => {
        if (index === old.pages.length - 1) {
          return {
            ...page,
            items: [...page.items, newPage],
          };
        }
        return page;
      }),
    };
  });

  //update sidebar haschildren
  if (data.parentPageId!==null){
    //update sub sidebar pages haschildern
    const subSideBarMatches = queryClient.getQueriesData({
      queryKey: ['sidebar-pages'],
      exact: false,
    });

    subSideBarMatches.forEach(([key, d]) => {
      queryClient.setQueryData<InfiniteData<IPagination<IPage>>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((sidebarPage: IPage) =>
              sidebarPage.id === data.parentPageId ? { ...sidebarPage, hasChildren: true } : sidebarPage
            )
          })),
        };
      });
    });

    //update root sidebar pages haschildern
    const rootSideBarMatches = queryClient.getQueriesData({
      queryKey: ['root-sidebar-pages', data.spaceId],
      exact: false,
    });

    rootSideBarMatches.forEach(([key, d]) => {
      queryClient.setQueryData<InfiniteData<IPagination<IPage>>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((sidebarPage: IPage) =>
              sidebarPage.id === data.parentPageId ? { ...sidebarPage, hasChildren: true } : sidebarPage
            )
          })),
        };
      });
    });
  }

  //update recent changes
  queryClient.invalidateQueries({
    queryKey: ["recent-changes", data.spaceId],
  });
}

export function invalidateOnUpdatePage(spaceId: string, parentPageId: string, id: string, title: string, icon: string, isJournal?: boolean) {
  let queryKey: QueryKey = null;
  if(parentPageId===null){
    queryKey = ['root-sidebar-pages', spaceId];
  }else{
    queryKey = ['sidebar-pages', {pageId: parentPageId, spaceId: spaceId}]
  }

  // 如果是日记，直接更新日记缓存而不是失效
  if (isJournal) {
    // 直接更新日记缓存中的数据
    queryClient.setQueryData<IPage[]>(["journals", spaceId], (oldJournals = []) => {
      return oldJournals.map(journal => 
        journal.id === id 
          ? { ...journal, title, icon, updatedAt: new Date().toISOString() }
          : journal
      );
    });
    
    // 失效最近更改查询，让它重新获取以反映更新
    queryClient.invalidateQueries({ queryKey: ["recent-changes", spaceId] });
  }

  //update all sidebar pages
  queryClient.setQueryData<InfiniteData<IPagination<IPage>>>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((sidebarPage: IPage) =>
          sidebarPage.id === id ? { ...sidebarPage, title: title, icon: icon } : sidebarPage
        )
      })),
    };
  });
  
  //update recent changes (only if not journal, as journal already handled above)
  if (!isJournal) {
    queryClient.invalidateQueries({
      queryKey: ["recent-changes", spaceId],
    });
  }
}

export function invalidateOnMovePage() {
  //for move invalidate all sidebars for now (how to do???)
  //invalidate all root sidebar pages
  queryClient.invalidateQueries({
    queryKey: ["root-sidebar-pages"],
  });
  //invalidate all sub sidebar pages
  queryClient.invalidateQueries({
    queryKey: ['sidebar-pages'],
  });
  // ---
}

export function invalidateOnDeletePage(pageId: string) {
  //update all sidebar pages
  const allSideBarMatches = queryClient.getQueriesData({
    predicate: (query) =>
      query.queryKey[0] === 'root-sidebar-pages' || query.queryKey[0] === 'sidebar-pages',
  });

  allSideBarMatches.forEach(([key, d]) => {
    queryClient.setQueryData<InfiniteData<IPagination<IPage>>>(key, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((sidebarPage: IPage) => sidebarPage.id !== pageId),
        })),
      };
    });
  });
  
  //update recent changes
  queryClient.invalidateQueries({
    queryKey: ["recent-changes"],
  });
}