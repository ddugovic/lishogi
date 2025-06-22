import { TinyColor } from '@ctrl/tinycolor';
import type { Chart, ChartConfiguration } from 'chart.js';
import { primaryColor, tooltipConfig } from '../common';

function main(canvas: HTMLCanvasElement, data: number[]): Chart {
  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: data.map(() => ''),
      datasets: [
        {
          data: data,
          borderColor: primaryColor(),
          borderWidth: 3,
          backgroundColor: new TinyColor(primaryColor()).setAlpha(0.2).toString(),
          fill: true,
          pointHitRadius: 200,
          pointHoverBackgroundColor: primaryColor(),
          pointHoverBorderColor: primaryColor(),
          pointRadius: 0,
          pointHoverRadius: 5,
          spanGaps: true,
        },
      ],
    },
    options: {
      animation: false,
      layout: {
        padding: 10,
      },
      elements: {
        line: {
          tension: 0.1,
        },
      },
      clip: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          ...tooltipConfig,
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
        },
      },
    },
  };
  return new window.Chart(canvas, config);
}

window.lishogi.registerModule(__bundlename__, main);
