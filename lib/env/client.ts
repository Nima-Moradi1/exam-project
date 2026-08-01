import { z } from "zod";

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional()
});

export type ClientEnvironment = z.infer<typeof clientEnvironmentSchema>;

export function getClientEnvironment(): ClientEnvironment {
  return clientEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  });
}
