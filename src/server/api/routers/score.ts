import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { scores } from "~/server/db/schema";
import { desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

export const scoreRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        score: z.number().int().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      const user = await currentUser();

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const playerName = user.username ?? `user_${user.id.slice(-4)}`;

      const [inserted] = await db
        .insert(scores)
        .values({ playerName, score: input.score })
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