import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["USER", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"]);
export const userStatus = pgEnum("user_status", ["ACTIVE", "SUSPENDED", "DELETED"]);
export const categoryStatus = pgEnum("category_status", ["ACTIVE", "HIDDEN", "ARCHIVED"]);
export const examStatus = pgEnum("exam_status", ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]);
export const examDirection = pgEnum("exam_direction", ["AUTO", "LTR", "RTL"]);
export const examDifficulty = pgEnum("exam_difficulty", ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED", "EXPERT"]);
export const questionType = pgEnum("question_type", ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "DROPDOWN", "SHORT_TEXT", "LONG_TEXT", "NUMERIC", "ORDERING", "MATCHING"]);
export const gradingMode = pgEnum("grading_mode", ["AUTOMATIC", "MANUAL", "AI_ASSISTED"]);
export const attemptStatus = pgEnum("attempt_status", ["IN_PROGRESS", "SUBMITTED", "COMPLETED", "EXPIRED", "ABANDONED", "PENDING_REVIEW", "CANCELLED"]);
export const answerStatus = pgEnum("answer_status", ["CORRECT", "INCORRECT", "PARTIALLY_CORRECT", "UNANSWERED", "PENDING_REVIEW"]);
export const resourceType = pgEnum("resource_type", ["ARTICLE", "DOCUMENTATION", "BOOK", "COURSE", "VIDEO", "FILM", "SERIES", "PODCAST", "EXERCISE", "OTHER"]);
export const assetKind = pgEnum("asset_kind", ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"]);
export const auditAction = pgEnum("audit_action", ["CREATE", "UPDATE", "DELETE", "ARCHIVE", "RESTORE", "PUBLISH", "UNPUBLISH", "ROLE_CHANGE", "STATUS_CHANGE", "LOGIN", "LOGOUT", "START_ATTEMPT", "SUBMIT_ATTEMPT", "ABANDON_ATTEMPT", "MANUAL_GRADE"]);
export const antiCheatMode = pgEnum("anti_cheat_mode", ["OFF", "WARN", "STRICT"]);
export const recommendationSource = pgEnum("recommendation_source", ["DETERMINISTIC", "AI"]);
export const examRequestStatus = pgEnum("exam_request_status", ["PENDING", "REVIEWED", "REJECTED", "COMPLETED"]);
