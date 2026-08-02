import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { writeAuditLog } from "@/lib/audit/service";
import { assertOwnershipOrPermission, requireActiveUser } from "@/lib/auth/guards";
import { type Role } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { attemptAnswers, attemptQuestionSnapshots, attemptTopicPerformance, examAttempts, exams } from "@/lib/db/schema";
import { getExamQuestionsForSnapshot, toPublicQuestionSnapshot } from "@/lib/exams/queries";
import type { PublicAttemptDto, PublicQuestionDto } from "@/lib/exams/types";
import { deterministicResultMessage, gradeAttempt } from "@/lib/grading/grade-attempt";
import type { GradingSnapshot } from "@/lib/grading/types";
import { createPersonalizedRecommendations, getRecommendationsForAttempt, type TopicWeakness } from "@/lib/recommendations/service";
import { assertAttemptTransition } from "./status";

function shuffle<T>(items: readonly T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

function isAnswerShapeValid(question: PublicQuestionDto, value: unknown) {
  if (value === null || value === undefined || value === "") return true;
  if (question.settings.responseMode === "AUDIO") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const recording = value as { kind?: unknown; url?: unknown; durationSeconds?: unknown };
    if (recording.kind !== "AUDIO_RECORDING" || typeof recording.url !== "string" || typeof recording.durationSeconds !== "number" || !Number.isFinite(recording.durationSeconds) || recording.durationSeconds <= 0) return false;
    try {
      return new URL(recording.url).pathname.includes(`/attempt-recordings/${question.id}/`);
    } catch {
      return false;
    }
  }
  if (["SINGLE_CHOICE", "DROPDOWN"].includes(question.type)) return typeof value === "string" && question.options.some((option) => option.id === value);
  if (question.type === "TRUE_FALSE") return typeof value === "boolean" || value === "true" || value === "false";
  if (question.type === "MULTIPLE_CHOICE" || question.type === "ORDERING") return Array.isArray(value) && value.every((item) => typeof item === "string" && question.options.some((option) => option.id === item));
  if (question.type === "MATCHING") return Array.isArray(value) && value.every((pair) => pair && typeof pair === "object" && typeof (pair as { leftId?: unknown }).leftId === "string" && typeof (pair as { rightId?: unknown }).rightId === "string");
  return typeof value === "string" || typeof value === "number";
}

function asPublicQuestion(snapshot: typeof attemptQuestionSnapshots.$inferSelect): PublicQuestionDto {
  return { ...(snapshot.publicSnapshot as PublicQuestionDto), id: snapshot.id };
}

function collectTopicWeaknesses(snapshots: Array<typeof attemptQuestionSnapshots.$inferSelect>, grade: ReturnType<typeof gradeAttempt>): TopicWeakness[] {
  const performance = new Map<string, TopicWeakness>();
  for (const item of grade.items) {
    const snapshot = snapshots.find((candidate) => candidate.id === item.snapshotId);
    const topicIds = snapshot ? (snapshot.gradingSnapshot as unknown as GradingSnapshot).topicIds ?? [] : [];
    for (const topicId of topicIds) {
      const current = performance.get(topicId) ?? { topicId, availablePoints: 0, awardedPoints: 0, incorrectCount: 0, unansweredCount: 0 };
      current.availablePoints += item.maxPoints;
      current.awardedPoints += item.pointsAwarded;
      if (item.status === "INCORRECT") current.incorrectCount += 1;
      if (item.status === "UNANSWERED") current.unansweredCount += 1;
      performance.set(topicId, current);
    }
  }
  return [...performance.values()];
}

function collectStoredTopicWeaknesses(snapshots: Array<typeof attemptQuestionSnapshots.$inferSelect>, answers: Array<typeof attemptAnswers.$inferSelect>): TopicWeakness[] {
  const performance = new Map<string, TopicWeakness>();
  const answersBySnapshot = new Map(answers.map((answer) => [answer.snapshotId, answer]));
  for (const snapshot of snapshots) {
    const topicIds = (snapshot.gradingSnapshot as unknown as GradingSnapshot).topicIds ?? [];
    const answer = answersBySnapshot.get(snapshot.id);
    for (const topicId of topicIds) {
      const current = performance.get(topicId) ?? { topicId, availablePoints: 0, awardedPoints: 0, incorrectCount: 0, unansweredCount: 0 };
      current.availablePoints += snapshot.maxPoints;
      current.awardedPoints += answer?.pointsAwarded ?? 0;
      if (answer?.status === "INCORRECT") current.incorrectCount += 1;
      if (!answer || answer.status === "UNANSWERED") current.unansweredCount += 1;
      performance.set(topicId, current);
    }
  }
  return [...performance.values()];
}

function asDto(input: {
  attempt: typeof examAttempts.$inferSelect;
  exam: typeof exams.$inferSelect;
  snapshots: Array<typeof attemptQuestionSnapshots.$inferSelect>;
  answers: Array<typeof attemptAnswers.$inferSelect>;
}): PublicAttemptDto {
  return {
    id: input.attempt.id,
    exam: {
      id: input.exam.id,
      title: input.exam.title,
      locale: input.exam.locale,
      direction: input.snapshots[0] ? asPublicQuestion(input.snapshots[0]).direction : input.exam.direction === "RTL" ? "rtl" : "ltr",
      antiCheatMode: input.exam.antiCheatMode
    },
    status: input.attempt.status,
    startedAt: input.attempt.startedAt.toISOString(),
    expiresAt: input.attempt.expiresAt.toISOString(),
    warningCount: input.attempt.warningCount,
    questions: input.snapshots.sort((left, right) => left.position - right.position).map(asPublicQuestion),
    answers: input.answers.map((answer) => ({ snapshotId: answer.snapshotId, value: answer.answer, clientRevision: answer.clientRevision }))
  };
}

async function expireIfNeeded(attempt: typeof examAttempts.$inferSelect) {
  if (attempt.status === "IN_PROGRESS" && attempt.expiresAt <= new Date()) {
    assertAttemptTransition(attempt.status, "EXPIRED");
    await getDb().update(examAttempts).set({ status: "EXPIRED", updatedAt: new Date() }).where(eq(examAttempts.id, attempt.id));
    return { ...attempt, status: "EXPIRED" as const };
  }
  return attempt;
}

export async function startAttempt(examId: string): Promise<PublicAttemptDto> {
  const user = await requireActiveUser();
  const db = getDb();
  const exam = await db.select().from(exams).where(and(eq(exams.id, examId), eq(exams.status, "PUBLISHED"), isNull(exams.deletedAt))).limit(1).then((rows) => rows[0]);
  if (!exam) throw new Error("NOT_FOUND");
  const active = await db.select().from(examAttempts).where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, user.id), eq(examAttempts.status, "IN_PROGRESS"))).orderBy(desc(examAttempts.createdAt)).limit(1).then((rows) => rows[0]);
  if (active) return getAttemptForUser(active.id, user.id, user.role as Role);

  const previousAttempts = await db.select({ id: examAttempts.id, createdAt: examAttempts.createdAt }).from(examAttempts).where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, user.id))).orderBy(desc(examAttempts.createdAt));
  if (exam.maxAttempts && previousAttempts.length >= exam.maxAttempts) throw new Error("MAX_ATTEMPTS_REACHED");
  if (exam.retryCooldownMinutes && previousAttempts[0] && previousAttempts[0].createdAt.getTime() + exam.retryCooldownMinutes * 60_000 > Date.now()) throw new Error("RETRY_COOLDOWN");

  const questions = await getExamQuestionsForSnapshot(exam.id);
  if (!questions.length) throw new Error("EXAM_NOT_READY");
  const orderedQuestions = exam.randomizeQuestionOrder ? shuffle(questions) : questions;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + exam.durationSeconds * 1_000);
  const attemptId = randomUUID();
  const snapshots = orderedQuestions.map((item, index) => {
    const optionIds = exam.randomizeOptionOrder ? shuffle(item.options.map((option) => option.id)) : item.options.map((option) => option.id);
    const publicSnapshot = toPublicQuestionSnapshot(item, exam.locale, exam.direction, index + 1, optionIds);
    const gradingSnapshot: GradingSnapshot = {
      version: 1, type: item.question.type, points: item.question.points, negativePoints: item.question.negativePoints,
      gradingMode: item.question.gradingMode, settings: item.question.settings,
      correctOptionIds: item.options.filter((option) => option.isCorrect).map((option) => option.id),
      correctBoolean: item.question.type === "TRUE_FALSE" ? item.options.find((option) => option.isCorrect)?.value === "true" : undefined,
      acceptedAnswers: item.acceptedAnswers.map((answer) => answer.answer),
      numericTarget: typeof item.question.settings.target === "number" ? item.question.settings.target : undefined,
      ordering: Array.isArray(item.question.settings.ordering) ? item.question.settings.ordering.filter((id): id is string => typeof id === "string") : undefined,
      matchingPairs: Array.isArray(item.question.settings.pairs) ? item.question.settings.pairs.filter((pair): pair is { leftId: string; rightId: string } => Boolean(pair) && typeof pair === "object" && typeof (pair as { leftId?: unknown }).leftId === "string" && typeof (pair as { rightId?: unknown }).rightId === "string") : undefined,
      explanation: item.question.explanation, modelAnswer: item.question.modelAnswer, topicIds: item.topicIds
    };
    return { attemptId, sourceQuestionId: item.question.id, position: index + 1, publicSnapshot, gradingSnapshot, maxPoints: item.question.points };
  });
  // neon-http supports atomic batches, but not interactive db.transaction callbacks.
  await db.batch([
    db.insert(examAttempts).values({
      id: attemptId, userId: user.id, examId: exam.id, status: "IN_PROGRESS", startedAt, expiresAt, lastActivityAt: startedAt,
      maxPoints: orderedQuestions.reduce((total, item) => total + item.question.points, 0),
      questionOrder: orderedQuestions.map((item) => item.question.id), optionOrder: {}
    }),
    db.insert(attemptQuestionSnapshots).values(snapshots)
  ]);
  try {
    await writeAuditLog({ actorUserId: user.id, action: "START_ATTEMPT", entityType: "attempt", entityId: attemptId });
  } catch (error) {
    // Audit failures must never discard an already-created, immutable attempt.
    console.error("Could not write start-attempt audit log", error);
  }
  return getAttemptForUser(attemptId, user.id, user.role as Role);
}

export async function getExamEntryState(examId: string, userId: string) {
  const latest = await getDb().select({
    id: examAttempts.id,
    status: examAttempts.status,
    lastActivityAt: examAttempts.lastActivityAt,
    scorePercent: examAttempts.scorePercent
  }).from(examAttempts).where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, userId))).orderBy(desc(examAttempts.createdAt)).limit(1).then((rows) => rows[0]);
  if (!latest) return { kind: "START" as const };
  if (latest.status === "IN_PROGRESS") return { kind: "CONTINUE" as const, attemptId: latest.id, lastSavedAt: latest.lastActivityAt.toISOString() };
  if (["COMPLETED", "PENDING_REVIEW", "SUBMITTED"].includes(latest.status)) return { kind: latest.status === "PENDING_REVIEW" ? "REVIEW" as const : "RESULT" as const, attemptId: latest.id, scorePercent: latest.scorePercent };
  return { kind: "START" as const };
}

export async function getAttemptForUser(attemptId: string, actorId?: string, actorRole?: Role): Promise<PublicAttemptDto> {
  const actor = actorId && actorRole ? { id: actorId, role: actorRole } : await requireActiveUser();
  const db = getDb();
  const attempt = await db.select().from(examAttempts).where(eq(examAttempts.id, attemptId)).limit(1).then((rows) => rows[0]);
  if (!attempt) throw new Error("NOT_FOUND");
  assertOwnershipOrPermission({ ownerId: attempt.userId, actorId: actor.id, actorRole: actor.role as Role, permission: "attempt:read:any" });
  const current = await expireIfNeeded(attempt);
  const [exam, snapshots, answers] = await Promise.all([
    db.select().from(exams).where(eq(exams.id, current.examId)).limit(1).then((rows) => rows[0]),
    db.select().from(attemptQuestionSnapshots).where(eq(attemptQuestionSnapshots.attemptId, current.id)).orderBy(asc(attemptQuestionSnapshots.position)),
    db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, current.id))
  ]);
  if (!exam) throw new Error("NOT_FOUND");
  return asDto({ attempt: current, exam, snapshots, answers });
}

export async function saveAnswers(attemptId: string, updates: Array<{ snapshotId: string; value: unknown; clientRevision: number }>) {
  const user = await requireActiveUser();
  const db = getDb();
  const attempt = await db.select().from(examAttempts).where(eq(examAttempts.id, attemptId)).limit(1).then((rows) => rows[0]);
  if (!attempt || attempt.userId !== user.id) throw new Error("NOT_FOUND");
  const current = await expireIfNeeded(attempt);
  if (current.status !== "IN_PROGRESS") throw new Error(current.status === "EXPIRED" ? "ATTEMPT_EXPIRED" : "ATTEMPT_NOT_ACTIVE");
  const snapshots = await db.select().from(attemptQuestionSnapshots).where(and(eq(attemptQuestionSnapshots.attemptId, attemptId), inArray(attemptQuestionSnapshots.id, updates.map((update) => update.snapshotId))));
  if (snapshots.length !== updates.length) throw new Error("VALIDATION_ERROR");
  const acknowledgement: Array<{ snapshotId: string; clientRevision: number }> = [];
  for (const update of updates) {
    const snapshot = snapshots.find((item) => item.id === update.snapshotId);
    if (!snapshot || !isAnswerShapeValid(asPublicQuestion(snapshot), update.value)) throw new Error("VALIDATION_ERROR");
    const previous = await db.select().from(attemptAnswers).where(and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.snapshotId, update.snapshotId))).limit(1).then((rows) => rows[0]);
    if (previous && previous.clientRevision > update.clientRevision) {
      acknowledgement.push({ snapshotId: update.snapshotId, clientRevision: previous.clientRevision });
      continue;
    }
    if (previous) await db.update(attemptAnswers).set({ answer: update.value, clientRevision: update.clientRevision, answeredAt: new Date(), updatedAt: new Date() }).where(eq(attemptAnswers.id, previous.id));
    else await db.insert(attemptAnswers).values({ attemptId, snapshotId: update.snapshotId, answer: update.value, clientRevision: update.clientRevision, answeredAt: new Date() });
    acknowledgement.push({ snapshotId: update.snapshotId, clientRevision: update.clientRevision });
  }
  await db.update(examAttempts).set({ lastActivityAt: new Date(), updatedAt: new Date() }).where(eq(examAttempts.id, attemptId));
  return { answers: acknowledgement, serverTime: new Date().toISOString() };
}

export async function submitAttempt(attemptId: string, finalAnswers: Array<{ snapshotId: string; value: unknown; clientRevision: number }> = []) {
  const user = await requireActiveUser();
  const db = getDb();
  const attempt = await db.select().from(examAttempts).where(eq(examAttempts.id, attemptId)).limit(1).then((rows) => rows[0]);
  if (!attempt || attempt.userId !== user.id) throw new Error("NOT_FOUND");
  if (["COMPLETED", "PENDING_REVIEW", "SUBMITTED"].includes(attempt.status)) return getAttemptResult(attemptId, user.id, user.role as Role);
  const expired = attempt.expiresAt <= new Date() || attempt.status === "EXPIRED";
  // Once time expires, grade only server-confirmed answers. Client-only pending
  // data is intentionally not trusted after the authoritative deadline.
  if (!expired && finalAnswers.length) await saveAnswers(attemptId, finalAnswers);
  const [snapshots, answers, exam] = await Promise.all([
    db.select().from(attemptQuestionSnapshots).where(eq(attemptQuestionSnapshots.attemptId, attemptId)).orderBy(asc(attemptQuestionSnapshots.position)),
    db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId)),
    db.select().from(exams).where(eq(exams.id, attempt.examId)).limit(1).then((rows) => rows[0])
  ]);
  if (!exam) throw new Error("NOT_FOUND");
  const bySnapshot = new Map(answers.map((answer) => [answer.snapshotId, answer.answer]));
  const result = gradeAttempt(snapshots.map((snapshot) => ({ snapshotId: snapshot.id, snapshot: snapshot.gradingSnapshot as unknown as GradingSnapshot, value: bySnapshot.get(snapshot.id) ?? null })));
  const topicWeaknesses = collectTopicWeaknesses(snapshots, result);
  const finalStatus = result.pendingReviewCount ? "PENDING_REVIEW" : "COMPLETED";
  const finalizedAt = new Date();
  // The Neon HTTP driver provides atomic batches, but does not support
  // interactive transaction callbacks. Keep every final grading write together.
  await db.batch([
    db.update(examAttempts).set({ status: finalStatus, submittedAt: finalizedAt, completedAt: finalStatus === "COMPLETED" ? finalizedAt : null, scorePoints: result.awardedPoints, scorePercent: Math.round(result.scorePercent), correctCount: result.correctCount, incorrectCount: result.incorrectCount, partialCount: result.partialCount, unansweredCount: result.unansweredCount, pendingReviewCount: result.pendingReviewCount, resultMessage: deterministicResultMessage(result.scorePercent, exam.locale), durationUsedSeconds: Math.max(0, Math.min(exam.durationSeconds, Math.round((Date.now() - attempt.startedAt.getTime()) / 1_000))), updatedAt: finalizedAt }).where(eq(examAttempts.id, attemptId)),
    ...result.items.map((item) => db.update(attemptAnswers).set({ status: item.status, pointsAwarded: item.pointsAwarded, gradedAt: finalizedAt, updatedAt: finalizedAt }).where(and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.snapshotId, item.snapshotId)))),
    ...(topicWeaknesses.length ? [db.insert(attemptTopicPerformance).values(topicWeaknesses.map((topic) => ({
      attemptId,
      topicId: topic.topicId,
      availablePoints: topic.availablePoints,
      awardedPoints: topic.awardedPoints,
      incorrectCount: topic.incorrectCount,
      unansweredCount: topic.unansweredCount
    })))] : [])
  ]);
  // A completed attempt must stay completed even if non-critical follow-up work
  // (AI recommendations or audit persistence) is temporarily unavailable.
  try {
    await createPersonalizedRecommendations({
      attemptId,
      locale: exam.locale,
      examTitle: exam.title,
      examDifficulty: exam.difficulty,
      scorePercent: Math.round(result.scorePercent),
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      partialCount: result.partialCount,
      unansweredCount: result.unansweredCount,
      pendingReviewCount: result.pendingReviewCount,
      weaknesses: topicWeaknesses
    });
  } catch (error) {
    console.error("Could not create attempt recommendations", error);
  }
  try {
    await writeAuditLog({ actorUserId: user.id, action: "SUBMIT_ATTEMPT", entityType: "attempt", entityId: attemptId });
  } catch (error) {
    console.error("Could not write submit-attempt audit log", error);
  }
  return getAttemptResult(attemptId, user.id, user.role as Role);
}

export async function abandonAttempt(attemptId: string) {
  const user = await requireActiveUser();
  const attempt = await getDb().select().from(examAttempts).where(eq(examAttempts.id, attemptId)).limit(1).then((rows) => rows[0]);
  if (!attempt || attempt.userId !== user.id) throw new Error("NOT_FOUND");
  if (attempt.status === "IN_PROGRESS") {
    assertAttemptTransition(attempt.status, "ABANDONED");
    await getDb().update(examAttempts).set({ status: "ABANDONED", abandonedAt: new Date(), updatedAt: new Date() }).where(eq(examAttempts.id, attemptId));
    await writeAuditLog({ actorUserId: user.id, action: "ABANDON_ATTEMPT", entityType: "attempt", entityId: attemptId });
  }
  return { ok: true };
}

export async function getAttemptResult(attemptId: string, actorId?: string, actorRole?: Role) {
  const actor = actorId && actorRole ? { id: actorId, role: actorRole } : await requireActiveUser();
  const db = getDb();
  const attempt = await db.select().from(examAttempts).where(eq(examAttempts.id, attemptId)).limit(1).then((rows) => rows[0]);
  if (!attempt) throw new Error("NOT_FOUND");
  assertOwnershipOrPermission({ ownerId: attempt.userId, actorId: actor.id, actorRole: actor.role as Role, permission: "attempt:read:any" });
  if (!["COMPLETED", "PENDING_REVIEW"].includes(attempt.status)) throw new Error("RESULT_NOT_READY");
  const [exam, snapshots, answers, storedRecommendation] = await Promise.all([
    db.select().from(exams).where(eq(exams.id, attempt.examId)).limit(1).then((rows) => rows[0]),
    db.select().from(attemptQuestionSnapshots).where(eq(attemptQuestionSnapshots.attemptId, attemptId)).orderBy(asc(attemptQuestionSnapshots.position)),
    db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId)),
    getRecommendationsForAttempt(attemptId)
  ]);
  // Older recommendation snapshots are intentionally ignored after a relevance
  // policy update. Rebuild them once from immutable answers instead of showing
  // unrelated resources from the old global-catalog fallback.
  let recommendation = storedRecommendation;
  if (!recommendation && exam) {
    try {
      await createPersonalizedRecommendations({
        attemptId,
        locale: exam.locale,
        examTitle: exam.title,
        examDifficulty: exam.difficulty,
        scorePercent: attempt.scorePercent ?? 0,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        partialCount: attempt.partialCount,
        unansweredCount: attempt.unansweredCount,
        pendingReviewCount: attempt.pendingReviewCount,
        weaknesses: collectStoredTopicWeaknesses(snapshots, answers)
      });
      recommendation = await getRecommendationsForAttempt(attemptId);
    } catch (error) {
      console.error("Could not refresh stale attempt recommendations", error);
    }
  }
  const answerBySnapshot = new Map(answers.map((answer) => [answer.snapshotId, answer]));
  return {
    attempt: { id: attempt.id, status: attempt.status, scorePercent: attempt.scorePercent, scorePoints: attempt.scorePoints, maxPoints: attempt.maxPoints, passingScorePercent: exam?.passingScorePercent ?? 60, message: attempt.resultMessage, locale: exam?.locale ?? "fa", direction: exam?.direction ?? "AUTO" },
    recommendation,
    items: snapshots.map((snapshot) => {
      const publicSnapshot = asPublicQuestion(snapshot);
      const grading = snapshot.gradingSnapshot as unknown as GradingSnapshot;
      const answer = answerBySnapshot.get(snapshot.id);
      return { snapshotId: snapshot.id, position: snapshot.position, question: publicSnapshot, answer: answer?.answer ?? null, status: answer?.status ?? "UNANSWERED", pointsAwarded: answer?.pointsAwarded ?? 0, explanation: grading.explanation ?? null, modelAnswer: grading.modelAnswer ?? null, correctOptionIds: grading.correctOptionIds ?? [], acceptedAnswers: grading.acceptedAnswers ?? [] };
    })
  };
}
