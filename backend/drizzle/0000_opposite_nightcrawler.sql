CREATE TYPE "public"."attachment_type" AS ENUM('AUDIO', 'IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."idea_type" AS ENUM('TEXT', 'VOICE', 'IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"type" "idea_type" DEFAULT 'TEXT' NOT NULL,
	"user_id" text NOT NULL,
	"attachment_url" text,
	"attachment_type" "attachment_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas_tags" (
	"idea_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" text PRIMARY KEY NOT NULL,
	"from_idea_id" text NOT NULL,
	"to_idea_id" text NOT NULL,
	"strength" real DEFAULT 0.5 NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(32) DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas_tags" ADD CONSTRAINT "ideas_tags_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas_tags" ADD CONSTRAINT "ideas_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_from_idea_id_ideas_id_fk" FOREIGN KEY ("from_idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_to_idea_id_ideas_id_fk" FOREIGN KEY ("to_idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ideas_user_idx" ON "ideas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ideas_created_idx" ON "ideas" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ideas_tags_uk" ON "ideas_tags" USING btree ("idea_id","tag_id");--> statement-breakpoint
CREATE INDEX "ideas_tags_idea_idx" ON "ideas_tags" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "ideas_tags_tag_idx" ON "ideas_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "links_from_idx" ON "links" USING btree ("from_idea_id");--> statement-breakpoint
CREATE INDEX "links_to_idx" ON "links" USING btree ("to_idea_id");--> statement-breakpoint
CREATE UNIQUE INDEX "links_uniq_from_to" ON "links" USING btree ("from_idea_id","to_idea_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_uk" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uk" ON "users" USING btree ("email");