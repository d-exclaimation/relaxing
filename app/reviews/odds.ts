import { Member } from "../team/members.ts";

type Reviewing = {
  sum: number;
  members: (Member & { review: number })[];
};

export const reviewing = (id: string, { sum: base, members }: Reviewing) => {
  const member = members.find((m) => m.id === id);
  if (!member)
    return members.map(({ id, name }) => ({ id, name, reviewee: 0 }));

  return members.map(({ review, id, name }) => {
    if (id === member.id) return { id, name, reviewee: 0 };

    const sum = base - review;
    const totalWeight = members
      .filter((m) => m.id !== id)
      .reduce(
        (acc, { review }) =>
          acc +
          (review === 0
            ? sum * (members.length - 1)
            : Math.round(sum / review)),
        0
      );

    if (totalWeight === 0)
      return { id, name, reviewee: Math.round(100 / (members.length - 1)) };

    const weight =
      member.review === 0 ? sum * (members.length - 1) : sum / member.review;
    return {
      id,
      name,
      reviewee: Math.round((weight * 100) / totalWeight),
    };
  });
};

type Reviewed = {
  members: (Member & {
    reviewings: {
      id: string;
      name: string;
      reviewee: number;
    }[];
  })[];
};

export const reviewed = (id: string, { members }: Reviewed) => {
  const member = members.find((m) => m.id === id);
  if (!member)
    return members.map(({ id, name }) => ({ id, name, reviewer: 0 }));

  return members.map(({ id, name, reviewings }) => {
    if (id === member.id) return { id, name, reviewer: 0 };

    return {
      id,
      name,
      reviewer: reviewings.find(({ id }) => id === member.id)?.reviewee || 0,
    };
  });
};
