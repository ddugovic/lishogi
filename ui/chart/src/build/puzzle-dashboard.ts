import { cssVar } from 'common/theme';
import { fontColor, tooltipBgColor } from '../common';

function main(data: any): void {
  const canvas = document.querySelector('.puzzle-dashboard__radar') as HTMLCanvasElement;
  const d = data.radar;
  d.datasets[0] = {
    ...d.datasets[0],
    ...{
      backgroundColor: 'rgba(189,130,35,0.2)',
      borderColor: cssVar('--c-brag'),
      pointBackgroundColor: fontColor,
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
      },
      aspectRatio: 2,
      scales: {
        r: {
          beginAtZero: false,
          suggestedMin: Math.min(...d.datasets[0].data) - 100,
          ticks: {
            color: fontColor,
            showLabelBackdrop: false, // hide square behind text
            format: {
              useGrouping: false,
            },
          },
          pointLabels: {
            color: fontColor,
            font: {
              size: window.innerWidth < 500 ? 11 : 16,
            },
          },
          grid: {
            color: tooltipBgColor,
          },
          angleLines: {
            color: tooltipBgColor,
          },
        },
      },
    },
  });
}

window.lishogi.registerModule(__bundlename__, main);
