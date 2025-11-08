import { useJapanese } from 'common/common';
import { h, type VNode } from 'snabbdom';

export type Rank = {
  jaName: string;
  enName: string;
  min: number;
  max: number;
};

const GLICKO_MIN = 400;
const GLICKO_MAX = 4000;

// In sync with modules/rating/src/main/Rank.scala
const defs: [string, string, number][] = [
  ['15級', '15-kyu', 80],
  ['14級', '14-kyu', 80],
  ['13級', '13-kyu', 80],
  ['12級', '12-kyu', 80],
  ['11級', '11-kyu', 80],
  ['10級', '10-kyu', 80],
  ['9級', '9-kyu', 80],
  ['8級', '8-kyu', 80],
  ['7級', '7-kyu', 80],
  ['6級', '6-kyu', 80],
  ['5級', '5-kyu', 80],
  ['4級', '4-kyu', 80],
  ['3級', '3-kyu', 80],
  ['2級', '2-kyu', 90],
  ['1級', '1-kyu', 120],
  ['初段', '1-Dan', 120],
  ['二段', '2-Dan', 120],
  ['三段', '3-Dan', 120],
  ['四段', '4-Dan', 120],
  ['五段', '5-Dan', 120],
  ['六段', '6-Dan', 120],
  ['七段', '7-Dan', 120],
  ['八段', '8-Dan', 0],
];

let min = GLICKO_MIN;
const all: Rank[] = defs.map(([ja, en, step]) => {
  const max = step === 0 ? GLICKO_MAX : min + step;
  const rank = { jaName: ja, enName: en, min, max };
  min = max;
  return rank;
});

export function rankFromRating(rating: number): Rank {
  return (
    all.find(r => rating >= r.min && rating < r.max) ||
    (rating < all[0].min ? all[0] : all[all.length - 1])
  );
}

export function rankName(rank: Rank): string {
  return useJapanese() ? rank.jaName : rank.enName;
}

export function extractRank(input?: string): Rank | undefined {
  if (!input) return;

  const trimmed = input.trim().toLowerCase();

  return all.find(
    r => trimmed.startsWith(`${r.jaName} `) || trimmed.startsWith(`${r.enName.toLowerCase()} `),
  );
}

export function rankTag(rank: Rank): VNode {
  return h(`span.rank-tag.r-${rank.enName}`, `${rankName(rank)} `);
}
