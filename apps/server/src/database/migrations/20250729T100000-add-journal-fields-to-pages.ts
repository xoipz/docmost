import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 添加新字段，使用默认值填充现有数据
  await db.schema
    .alterTable('pages')
    .addColumn('is_journal', 'boolean', (col) => col.defaultTo(false).notNull())
    .execute();

  await db.schema
    .alterTable('pages')
    .addColumn('journal_date', 'date', (col) => col)
    .execute();

  // 为现有数据填充默认值（确保所有现有页面都不是日记）
  await db
    .updateTable('pages')
    .set({
      is_journal: false,
      journal_date: null
    })
    .execute();

  // 添加索引
  await db.schema
    .createIndex('pages_journal_date_idx')
    .on('pages')
    .column('journal_date')
    .execute();

  // 添加索引：日记查询优化
  await db.schema
    .createIndex('pages_space_journal_date_idx')
    .on('pages')
    .columns(['space_id', 'journal_date'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // 删除索引
  await db.schema
    .dropIndex('pages_space_journal_date_idx')
    .execute();
    
  await db.schema
    .dropIndex('pages_journal_date_idx')
    .execute();
    
  // 删除字段
  await db.schema
    .alterTable('pages')
    .dropColumn('journal_date')
    .execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('is_journal')
    .execute();
}