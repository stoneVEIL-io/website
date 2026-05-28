CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"phone" text,
	"trade" text NOT NULL,
	"service_area" text NOT NULL,
	"current_lead_source" text NOT NULL,
	"est_monthly_searches" integer,
	"est_close_rate" integer,
	"est_ticket" integer,
	"monthly_jobs" integer,
	"gbp_url" text,
	"qualification_score" integer,
	"qualification_tier" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
