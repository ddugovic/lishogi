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
  ['15級', '15-kyu', 75],
  ['14級', '14-kyu', 75],
  ['13級', '13-kyu', 75],
  ['12級', '12-kyu', 75],
  ['11級', '11-kyu', 75],
  ['10級', '10-kyu', 75],
  ['9級', '9-kyu', 75],
  ['8級', '8-kyu', 75],
  ['7級', '7-kyu', 75],
  ['6級', '6-kyu', 75],
  ['5級', '5-kyu', 75],
  ['4級', '4-kyu', 75],
  ['3級', '3-kyu', 75],
  ['2級', '2-kyu', 75],
  ['1級', '1-kyu', 100],
  ['初段', '1-Dan', 100],
  ['二段', '2-Dan', 100],
  ['三段', '3-Dan', 100],
  ['四段', '4-Dan', 125],
  ['五段', '5-Dan', 150],
  ['六段', '6-Dan', 150],
  ['七段', '7-Dan', 225],
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

function rankName(rank: Rank): string {
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

export function rankTagHtml(rank: Rank): string {
  return `<span class="rank-tag r-${rank.enName}">${rankName(rank)}&nbsp;</span>`;
}
