import { learningResources } from "@/lib/db/schema";

type ResourceType = typeof learningResources.$inferSelect["type"];

export type RecommendationCandidate = { id: string; title: string; description: string; type: ResourceType; url: string; topicIds: string[]; locale: string };
export type TopicWeakness = { topicId: string; incorrectCount: number; unansweredCount: number; availablePoints: number; awardedPoints: number };

export function rankWeakTopics(topics: TopicWeakness[]) {
  return [...topics].sort((left, right) => {
    const leftScore = left.incorrectCount * 3 + left.unansweredCount * 2 + Math.max(0, left.availablePoints - left.awardedPoints);
    const rightScore = right.incorrectCount * 3 + right.unansweredCount * 2 + Math.max(0, right.availablePoints - right.awardedPoints);
    return rightScore - leftScore;
  });
}

export function selectDeterministicResources(candidates: RecommendationCandidate[], weakTopics: TopicWeakness[], locale: string, limit = 6) {
  const preferredTopics = rankWeakTopics(weakTopics).map((topic) => topic.topicId);
  const types = new Set<ResourceType>();
  const selected: RecommendationCandidate[] = [];
  for (const topicId of preferredTopics) {
    for (const candidate of candidates) {
      if (selected.length >= limit || selected.some((item) => item.id === candidate.id) || !candidate.topicIds.includes(topicId)) continue;
      if (candidate.locale !== locale && candidate.locale !== "en") continue;
      const varietyBonus = types.has(candidate.type) ? 0 : 1;
      if (varietyBonus || selected.length < 3) {
        selected.push(candidate);
        types.add(candidate.type);
      }
    }
  }
  return selected.slice(0, limit);
}
