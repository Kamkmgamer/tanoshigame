import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  rateLimitedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { scores } from "~/server/db/schema";
import { desc } from "drizzle-orm";

export const scoreRouter = createTRPCRouter({
  submit: rateLimitedProcedure
    .input(
      z.object({
        playerName: z.string().min(1).max(256),
        score: z.number().int().nonnegative(),
      }),
    )
    .mutation(async ({ input }) => {
      const [inserted] = await db
        .insert(scores)
        .values({ playerName: input.playerName, score: input.score })
        .returning();
      return inserted;
    }),

  top: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(50).default(10) }))
    .query(async ({ input }) => {
      const { limit } = input;
      const result = await db
        .select()
        .from(scores)
        .orderBy(desc(scores.score))
        .limit(limit);
      return result;
    }),
});
