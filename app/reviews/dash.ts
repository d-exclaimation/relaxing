import type { GetCommand } from "https://deno.land/x/upstash_redis@v1.22.0/pkg/commands/get.ts";
import type { Pipeline } from "https://deno.land/x/upstash_redis@v1.22.0/pkg/pipeline.ts";
import { kv } from "../../lib/kv.ts";
import { members } from "../team/members.ts";
import { reviewed, reviewing } from "./odds.ts";

export const allReviews = async () => {
  try {
    const res = await members
      .reduce(
        (pipeline, member) => pipeline.get<number>(`reviews:${member.id}`),
        kv.pipeline() as Pipeline<[...GetCommand<number>[]]>
      )
      .exec<(number | undefined | null)[]>();

    const reviewsByMembers = res
      .map((n) => n ?? 0)
      .map((n) => (isNaN(n) ? 0 : n))
      .map((review, i) => ({ ...members[i], review }));

    const baseSum = reviewsByMembers.reduce(
      (sum, { review }) => sum + review,
      0
    );

    return {
      sum: baseSum,
      members: reviewsByMembers,
    };
  } catch (_) {
    return {
      sum: 0,
      members: members.map(({ id, name }) => ({ id, name, review: 0 })),
    };
  }
};

export const dashboard = async () => {
  const reviews = await allReviews();
  const reviewers = reviews.members.map(({ id, ...rest }) => ({
    id,
    ...rest,
    reviewings: reviewing(id, reviews),
  }));

  const dash = reviewers.map(({ id, ...rest }) => ({
    id,
    ...rest,
    reviewees: reviewed(id, { members: reviewers }),
  }));

  return {
    dash,
    max: Math.max(
      ...dash.flatMap(({ reviewings }) =>
        reviewings.map(({ reviewee }) => reviewee)
      )
    ),
  };
};
