import { TinyColor } from '@ctrl/tinycolor';
import { bragColor, fontClearColor, fontDimColor, tooltipConfig } from '../common';

function main(data: any): void {
  const canvas = document.querySelector('.puzzle-dashboard__radar') as HTMLCanvasElement;
  const d = data.radar;
  d.datasets[0] = {
    ...d.datasets[0],
    ...{
      backgroundColor: new TinyColor(bragColor()).setAlpha(0.2).toString(),
      borderColor: bragColor(),
      pointBackgroundColor: bragColor(),
      pointHoverBackgroundColor: fontClearColor(),
      pointRadius: 4,
      pointHoverRadius: 5,
      pointHitRadius: 20,
    },
  };

  new window.Chart(canvas, {
    type: 'radar',
    data: d,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          display: false,
        },
        tooltip: {
          ...tooltipConfig,
          format: {
            useGrouping: false,
          },
        },
      },
      aspectRatio: 2,
      scales: {
        r: {
          beginAtZero: false,
          suggestedMin: Math.min(...d.datasets[0].data) - 100,
          ticks: {
            color: fontDimColor(),
            showLabelBackdrop: false,
            format: {
              useGrouping: false,
            },
          },
          pointLabels: {
            color: fontClearColor(),
            font: {
              size: window.innerWidth < 500 ? 11 : 16,
            },
          },
          grid: {
            color: fontDimColor(),
          },
          angleLines: {
            color: fontDimColor(),
          },
        },
      },
    },
  });
}

window.lishogi.registerModule(__bundlename__, main);
