import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { attemptRecommendations, learningResources, resourceTopics } from "@/lib/db/schema";
import { selectDeterministicResources, type TopicWeakness } from "./deterministic";

export async function createDeterministicRecommendations(attemptId: string, locale: string, weaknesses: TopicWeakness[]) {
  const db = getDb();
  const resources = await db.select().from(learningResources).where(eq(learningResources.isActive, true));
  const resourceIds = resources.map((resource) => resource.id);
  const links = resourceIds.length ? await db.select().from(resourceTopics).where(inArray(resourceTopics.resourceId, resourceIds)) : [];
  const candidates = resources.map((resource) => ({
    id: resource.id, title: resource.title, description: resource.description, type: resource.type, url: resource.url, locale: resource.locale,
    topicIds: links.filter((link) => link.resourceId === resource.id).map((link) => link.topicId)
  }));
  const selected = selectDeterministicResources(candidates, weaknesses, locale);
  await db.insert(attemptRecommendations).values({ attemptId, source: "DETERMINISTIC", recommendationJson: { resources: selected.map(({ topicIds, ...resource }) => resource) } });
  return selected;
}
