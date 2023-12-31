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

    const max = reviewsByMembers.reduce(
      (max, { review }) => Math.max(max, review),
      0
    );

    return {
      max,
      members: reviewsByMembers,
    };
  } catch (_) {
    return {
      max: 0,
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
    dash: dash.map(({ reviewings, reviewees, ...rest }) => {
      const includedReviewings = reviewings
        .filter(({ id }) => id !== rest.id)
        .map(({ reviewee }) => reviewee);

      const includedReviewed = reviewees
        .filter(({ id }) => id !== rest.id)
        .map(({ reviewer }) => reviewer);
      return {
        ...rest,
        reviewings,
        reviewees,
        avg: {
          reviewing:
            includedReviewings.reduce((acc, x) => acc + x, 0) /
            includedReviewings.length,
          reviewed:
            includedReviewed.reduce((acc, x) => acc + x, 0) /
            includedReviewed.length,
        },
      };
    }),
    max: Math.max(
      ...dash.flatMap(({ reviewings }) =>
        reviewings.map(({ reviewee }) => reviewee)
      )
    ),
  };
};
