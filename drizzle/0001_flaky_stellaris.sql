CREATE TYPE "public"."exam_request_status" AS ENUM('PENDING', 'REVIEWED', 'REJECTED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "exam_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"subject" varchar(160) NOT NULL,
	"level" varchar(80),
	"description" text NOT NULL,
	"status" "exam_request_status" DEFAULT 'PENDING' NOT NULL,
	"admin_note" text,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_requests_user_created_idx" ON "exam_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "exam_requests_status_created_idx" ON "exam_requests" USING btree ("status","created_at");