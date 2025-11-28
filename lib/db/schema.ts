import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, varchar, serial, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'), // free, pro, growth, scale
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('inactive'), // active, inactive, canceled
  leadsUsedThisMonth: integer('leads_used_this_month').default(0),
  leadsLimit: integer('leads_limit').default(20), // Based on tier
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lead batches (CSV uploads)
export const leadBatches = pgTable('lead_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productDescription: text('product_description').notNull(),
  outreachType: varchar('outreach_type', { length: 50 }).notNull(), // email, linkedin, followup, call_script
  status: varchar('status', { length: 50 }).default('pending'), // pending, processing, completed, failed
  totalLeads: integer('total_leads').default(0),
  processedLeads: integer('processed_leads').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Individual leads
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id').notNull().references(() => leadBatches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Input data
  name: text('name'),
  company: text('company'),
  website: text('website'),
  linkedinUrl: text('linkedin_url'),
  email: text('email'),

  // Research results
  fitScore: varchar('fit_score', { length: 1 }), // A, B, C
  fitRationale: text('fit_rationale'),
  painPoints: jsonb('pain_points').$type<string[]>(),
  valueProps: jsonb('value_props').$type<string[]>(),
  icpAlignment: text('icp_alignment'),

  // Generated outreach
  outreachEmail: text('outreach_email'),
  linkedinDm: text('linkedin_dm'),
  callScript: text('call_script'),

  // Qualification
  predictedObjections: jsonb('predicted_objections').$type<string[]>(),
  recommendedNextStep: text('recommended_next_step'),
  urgencyFraming: text('urgency_framing'),

  // Processing status
  status: varchar('status', { length: 50 }).default('pending'), // pending, researching, composing, completed, failed
  processingLog: jsonb('processing_log').$type<Array<{ step: string; status: string; timestamp: string }>>(),
  errorMessage: text('error_message'),

  // Metadata
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  batchIdx: index('batch_idx').on(table.batchId),
  userIdx: index('user_idx').on(table.userId),
  statusIdx: index('status_idx').on(table.status),
}));

// Processing jobs (for queue tracking)
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id').references(() => leadBatches.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // research, compose, qualify, send
  status: varchar('status', { length: 50 }).default('queued'), // queued, processing, completed, failed
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  result: jsonb('result'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Email sequences (for pro+ users)
export const sequences = pgTable('sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // email, linkedin
  status: varchar('status', { length: 50 }).default('scheduled'), // scheduled, sent, failed
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscription usage tracking
export const usageMetrics = pgTable('usage_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  leadsProcessed: integer('leads_processed').default(0),
  emailsSent: integer('emails_sent').default(0),
  linkedinDmsSent: integer('linkedin_dms_sent').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userMonthIdx: index('user_month_idx').on(table.userId, table.month),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  batches: many(leadBatches),
  leads: many(leads),
  sequences: many(sequences),
  usageMetrics: many(usageMetrics),
}));

export const leadBatchesRelations = relations(leadBatches, ({ one, many }) => ({
  user: one(users, {
    fields: [leadBatches.userId],
    references: [users.id],
  }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  batch: one(leadBatches, {
    fields: [leads.batchId],
    references: [leadBatches.id],
  }),
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  sequences: many(sequences),
}));
