CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"current_section" text DEFAULT 'Problem Statement' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"idea_status" text DEFAULT 'exploring' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"raw_idea" text NOT NULL,
	"start_mode" text DEFAULT 'idea' NOT NULL,
	"conversation_mode" text DEFAULT 'supportive' NOT NULL,
	"discovery_path" text DEFAULT 'idea_first',
	"idea_purpose" text DEFAULT 'monetize',
	"prd_content" text,
	"notes" text,
	"target_avatar" jsonb,
	"viability_score" integer,
	"viability_breakdown" jsonb,
	"competitors" jsonb,
	"key_insights" jsonb,
	"github_repo_url" text,
	"synergy_analysis" jsonb,
	"tech_stack" jsonb,
	"tech_stack_recommendation" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"password" text,
	"subscription_status" text DEFAULT 'free' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;