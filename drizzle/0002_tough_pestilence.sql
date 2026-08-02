ALTER TYPE "public"."exam_status" ADD VALUE 'IN_REVIEW' BEFORE 'PUBLISHED';--> statement-breakpoint
ALTER TYPE "public"."exam_status" ADD VALUE 'APPROVED' BEFORE 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "learning_objectives" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "approved_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scheduled_publish_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;