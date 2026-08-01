import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";

import { getServerEnvironment } from "@/lib/env/server";

export function getConfiguredAiModel() {
  const environment = getServerEnvironment();
  if (environment.AI_PROVIDER === "none" || !environment.AI_MODEL) return null;
  if (environment.AI_PROVIDER === "openai" && environment.OPENAI_API_KEY) return createOpenAI({ apiKey: environment.OPENAI_API_KEY })(environment.AI_MODEL);
  if (environment.AI_PROVIDER === "google" && environment.GOOGLE_GENERATIVE_AI_API_KEY) return createGoogleGenerativeAI({ apiKey: environment.GOOGLE_GENERATIVE_AI_API_KEY })(environment.AI_MODEL);
  if (environment.AI_PROVIDER === "xai" && environment.XAI_API_KEY) return createXai({ apiKey: environment.XAI_API_KEY })(environment.AI_MODEL);
  return null;
}
