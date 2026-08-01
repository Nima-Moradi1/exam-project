import "server-only";

import { generateText, Output } from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getConfiguredAiModel } from "@/lib/ai/provider";
import { aiRecommendationSchema } from "@/lib/ai/schemas";
import { getServerEnvironment } from "@/lib/env/server";
import { getDb } from "@/lib/db";
import { attemptRecommendations, learningResources, resourceTopics, topics } from "@/lib/db/schema";
import { selectDeterministicResources, type RecommendationCandidate, type TopicWeakness } from "./deterministic";

export type { TopicWeakness } from "./deterministic";

const resourceDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["ARTICLE", "DOCUMENTATION", "BOOK", "COURSE", "VIDEO", "FILM", "SERIES", "PODCAST", "EXERCISE", "OTHER"]),
  url: z.string().url(),
  locale: z.string()
});

const recommendationPayloadSchema = z.object({
  summary: z.string().max(1_000),
  strengths: z.array(z.string().max(240)).max(8),
  weaknesses: z.array(z.string().max(240)).max(8),
  studyPlan: z.array(z.object({ title: z.string().max(240), reason: z.string().max(500), estimatedMinutes: z.number().int().positive().max(600).optional() })).max(8),
  resources: z.array(resourceDtoSchema).max(6)
});

export type PublicRecommendationDto = z.infer<typeof recommendationPayloadSchema> & {
  source: "AI" | "DETERMINISTIC";
  provider: string | null;
  model: string | null;
};

type RecommendationInput = {
  attemptId: string;
  locale: string;
  examTitle: string;
  examDifficulty: string;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  unansweredCount: number;
  pendingReviewCount: number;
  weaknesses: TopicWeakness[];
};

function deterministicPayload(locale: string, resources: Array<z.infer<typeof resourceDtoSchema>>) {
  const persian = locale.startsWith("fa");
  return {
    summary: persian ? "این منابع بر اساس سطح آزمون و مباحثی که بیشترین نیاز به مرور دارند انتخاب شده‌اند." : "These resources were selected for the exam level and the topics that need the most review.",
    strengths: [],
    weaknesses: [],
    studyPlan: [],
    resources
  };
}

function candidateForPrompt(candidate: RecommendationCandidate, topicNames: Map<string, string>) {
  return {
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    type: candidate.type,
    locale: candidate.locale,
    topics: candidate.topicIds.map((topicId) => topicNames.get(topicId) ?? topicId)
  };
}

export async function createPersonalizedRecommendations(input: RecommendationInput) {
  const db = getDb();
  const resources = await db.select().from(learningResources).where(and(eq(learningResources.isActive, true)));
  const resourceIds = resources.map((resource) => resource.id);
  const links = resourceIds.length ? await db.select().from(resourceTopics).where(inArray(resourceTopics.resourceId, resourceIds)) : [];
  const topicIds = [...new Set([...input.weaknesses.map((topic) => topic.topicId), ...links.map((link) => link.topicId)])];
  const topicRows = topicIds.length ? await db.select({ id: topics.id, name: topics.name }).from(topics).where(inArray(topics.id, topicIds)) : [];
  const topicNames = new Map(topicRows.map((topic) => [topic.id, topic.name]));
  const candidates: RecommendationCandidate[] = resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    url: resource.url,
    locale: resource.locale,
    topicIds: links.filter((link) => link.resourceId === resource.id).map((link) => link.topicId)
  }));
  const deterministic = selectDeterministicResources(candidates, input.weaknesses, input.locale);
  const fallback = deterministic.map(({ id, title, description, type, url, locale }) => ({ id, title, description, type, url, locale }));
  const eligibleResources = candidates
    .filter((candidate) => candidate.locale === input.locale || candidate.locale === "en")
    .slice(0, 60)
    .map(({ id, title, description, type, url, locale }) => ({ id, title, description, type, url, locale }));
  const model = getConfiguredAiModel();
  const environment = getServerEnvironment();

  if (!model || !fallback.length) {
    await db.insert(attemptRecommendations).values({ attemptId: input.attemptId, source: "DETERMINISTIC", recommendationJson: deterministicPayload(input.locale, fallback) });
    return;
  }

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: aiRecommendationSchema, name: "exam_recommendations" }),
      system: "You are a learning coach. Recommend only IDs from the supplied catalog. Never invent resources, URLs, titles, providers, or facts. Personalize the summary and plan to the supplied score, exam level, and topic performance. Return the text in the requested locale.",
      prompt: JSON.stringify({
        requestedLocale: input.locale,
        exam: { title: input.examTitle, difficulty: input.examDifficulty },
        performance: {
          scorePercent: input.scorePercent,
          correctCount: input.correctCount,
          incorrectCount: input.incorrectCount,
          partialCount: input.partialCount,
          unansweredCount: input.unansweredCount,
          pendingReviewCount: input.pendingReviewCount,
          weakTopics: input.weaknesses.map((topic) => ({ ...topic, name: topicNames.get(topic.topicId) ?? topic.topicId }))
        },
        catalog: candidates.filter((candidate) => candidate.locale === input.locale || candidate.locale === "en").slice(0, 60).map((candidate) => candidateForPrompt(candidate, topicNames)),
        constraints: { maximumResources: 6, onlyCatalogIds: true }
      })
    });
    const byId = new Map(eligibleResources.map((resource) => [resource.id, resource]));
    const selected = [...new Set(output.recommendedResourceIds)].map((id) => byId.get(id)).filter((resource): resource is z.infer<typeof resourceDtoSchema> => Boolean(resource)).slice(0, 6);
    const payload = recommendationPayloadSchema.parse({ ...output, resources: selected.length ? selected : fallback });
    await db.insert(attemptRecommendations).values({
      attemptId: input.attemptId,
      source: "AI",
      provider: environment.AI_PROVIDER,
      model: environment.AI_MODEL || null,
      recommendationJson: payload
    });
  } catch {
    await db.insert(attemptRecommendations).values({ attemptId: input.attemptId, source: "DETERMINISTIC", recommendationJson: deterministicPayload(input.locale, fallback) });
  }
}

export async function getRecommendationsForAttempt(attemptId: string): Promise<PublicRecommendationDto | null> {
  const record = await getDb().select().from(attemptRecommendations).where(eq(attemptRecommendations.attemptId, attemptId)).orderBy(desc(attemptRecommendations.createdAt)).limit(1).then((rows) => rows[0]);
  if (!record) return null;
  const payload = recommendationPayloadSchema.safeParse(record.recommendationJson);
  if (!payload.success) return null;
  return { ...payload.data, source: record.source, provider: record.provider, model: record.model };
}
