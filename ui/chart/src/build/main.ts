import { Chart } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { loadLishogiScript } from 'common/assets';
import 'chartjs-adapter-dayjs-4/';

if ('ResizeObserver' in window === false) loadLishogiScript('chart.resizePolyfill');

Chart.register(ChartDataLabels);

window.Chart = Chart;
