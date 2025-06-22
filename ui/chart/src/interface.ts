import type { Chart } from 'chart.js';
import type { AnalyseGame } from 'game/interfaces';

export interface PlyChart extends Chart<'line'> {
  selectPly(ply: number, isMainline: boolean): void;
}

export interface AcplChart extends PlyChart {
  updateData(d: AnalyseData, mainline: Tree.Node[]): void;
}

export interface Player {
  color: Color;
  blurs?: {
    bits?: string;
  };
}

export interface AnalyseData {
  player: Player;
  opponent: Player;
  treeParts: Tree.Node[];
  game: AnalyseGame;
  analysis?: {
    partial?: boolean;
  };
  clock?: {
    running: boolean;
    initial: number;
    increment: number;
    byoyomi: number;
  };
}

export interface DistributionData {
  freq: number[];
  myRating: number | null;
  otherPlayer: string | null;
  otherRating: number | null;
}

export interface PerfRatingHistory {
  name: string;
  points: [number, number, number, number][];
}
