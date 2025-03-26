import type { Chart, ChartDataset, ChartOptions } from 'chart.js';
import { cssVar } from 'common/styles';

export interface MovePoint {
  y: number;
  x: number;
}

// Add a slight offset so the graph doesn't get cutoff when eval = mate.
export const chartYMax = 1.05;
export const chartYMin: number = -chartYMax;

export const accent: string = cssVar('--c-accent');
export const fontColor: string = cssVar('--c-font-clear');
export const gridColor: string = cssVar('--c-border');
export const hoverBorderColor: string = cssVar('--c-font-clear');
export const tooltipBgColor: string = cssVar('--c-page-mask');
export const lineColor: string = cssVar('--c-primary');
const zeroLineColor: string = cssVar('--c-shade');

export const axisOpts = (xmin: number, xmax: number): ChartOptions<'line'>['scales'] => ({
  x: {
    display: false,
    type: 'linear',
    min: xmin,
    max: xmax,
    offset: false,
  },
  y: {
    // Set equidistant max and min to center the graph at y=0.
    min: chartYMin,
    max: chartYMax,
    border: { display: false },
    ticks: { display: false },
    grid: {
      color: ctx => (ctx.tick.value === 0 ? zeroLineColor : undefined),
    },
  },
});

export function fontFamily(
  size?: number,
  weight?: 'bold',
): {
  family: string;
  size: number;
  weight?: 'bold';
} {
  return {
    family:
      "'Noto Sans', 'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif",
    size: size ?? 12,
    weight: weight,
  };
}

export function maybeChart(el: HTMLCanvasElement): Chart | undefined {
  const ctx = el.getContext('2d');
  if (ctx) return window.Chart.getChart(ctx);
  return undefined;
}

/**  Instead of using the annotation plugin, create a dataset to plot as a pseudo-annotation
 *  @returns a vertical line from {ply,-1.05} to {ply,+1.05}.
 * */
export function plyLine(ply: number, mainline = true): ChartDataset<'line'> {
  return {
    xAxisID: 'x',
    type: 'line',
    label: 'ply',
    data: [
      { x: ply, y: chartYMin },
      { x: ply, y: chartYMax },
    ],
    borderColor: accent,
    pointRadius: 0,
    pointHoverRadius: 0,
    borderWidth: 1,
    animation: false,
    segment: !mainline ? { borderDash: [5] } : undefined,
    order: 0,
    datalabels: { display: false },
  };
}

export function selectPly(this: Chart, ply: number, onMainline: boolean): void {
  const index = this.data.datasets.findIndex(dataset => dataset.label === 'ply');
  const line = plyLine(ply, onMainline);
  this.data.datasets[index] = line;
  this.update('none');
}
