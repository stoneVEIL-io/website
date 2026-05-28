import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  phone: text("phone"),

  trade: text("trade").notNull(),
  serviceArea: text("service_area").notNull(),
  currentLeadSource: text("current_lead_source").notNull(),

  estMonthlySearches: integer("est_monthly_searches"),
  estCloseRate: integer("est_close_rate"),
  estTicket: integer("est_ticket"),
  monthlyJobs: integer("monthly_jobs"),

  gbpUrl: text("gbp_url"),

  qualificationScore: integer("qualification_score"),
  qualificationTier: text("qualification_tier"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
