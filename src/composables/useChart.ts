import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import type { EChartsType } from 'echarts';
import type { HistoryRecord } from '../types';
import { aggregateChartData, buildChartOption } from '../lib/chart';

export function useChart(historyListRef: { value: HistoryRecord[] }) {
  const showChart = ref(false);
  const chartTab = ref('');
  const availableModes = ref<string[]>([]);
  let chartInstance: EChartsType | null = null;

  const renderChart = (modeName: string) => {
    const dom = document.getElementById('accChart');
    if (!dom) return;
    if (chartInstance) chartInstance.dispose();
    chartInstance = echarts.init(dom);
    const data = aggregateChartData(historyListRef.value, modeName);
    chartInstance.setOption(buildChartOption(data));
  };

  const initChart = () => {
    showChart.value = true;
    const modeSet = new Set(historyListRef.value.map((item) => item.modeName));
    availableModes.value = Array.from(modeSet);
    if (historyListRef.value.length > 0 && !chartTab.value) {
      chartTab.value = historyListRef.value[0].modeName;
    } else if (availableModes.value.length > 0 && !chartTab.value) {
      chartTab.value = availableModes.value[0];
    }
    nextTick(() => renderChart(chartTab.value));
  };

  const switchChartTab = (modeName: string) => {
    chartTab.value = modeName;
    renderChart(modeName);
  };

  const closeChart = () => {
    showChart.value = false;
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
  };

  const reopenIfActive = () => {
    if (showChart.value) nextTick(() => renderChart(chartTab.value));
  };

  const onResize = () => {
    if (chartInstance) chartInstance.resize();
  };

  onMounted(() => window.addEventListener('resize', onResize));
  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    if (chartInstance) chartInstance.dispose();
  });

  return {
    showChart, chartTab, availableModes,
    initChart, switchChartTab, closeChart, reopenIfActive,
  };
}
