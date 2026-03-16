import {
  pgTable, uuid, text, bigint, integer, jsonb, boolean, timestamp,
} from 'drizzle-orm/pg-core'

export const papers = pgTable('papers', {
  id:             uuid('id').primaryKey().defaultRandom(),
  paper_number:   text('paper_number').unique(),
  title:          text('title').notNull(),
  author:         text('author').notNull().default(''),
  affiliation:    text('affiliation').notNull().default(''),
  category:       text('category').notNull().default('기타'),
  file_name:      text('file_name'),
  file_size:      bigint('file_size', { mode: 'number' }),
  mime_type:      text('mime_type'),
  page_count:     integer('page_count'),
  extracted_text: text('extracted_text'),
  analysis:       jsonb('analysis'),
  status:         text('status').notNull().default('pending'),
  submitted_at:   timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const evaluations = pgTable('evaluations', {
  id:             uuid('id').primaryKey().defaultRandom(),
  paper_id:       uuid('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  result:         jsonb('result').notNull(),
  total_score:    integer('total_score'),
  recommendation: text('recommendation'),
  model_used:     text('model_used'),
  is_demo:        boolean('is_demo').default(false),
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PaperInsert = typeof papers.$inferInsert
export type PaperSelect = typeof papers.$inferSelect
export type EvaluationInsert = typeof evaluations.$inferInsert
export type EvaluationSelect = typeof evaluations.$inferSelect
