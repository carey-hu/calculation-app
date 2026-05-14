import type { HistoryRecord, DetailItem, ResultItem, TrainLogItem } from '../types';

interface ChartData {
  dateList: string[];
  accuracyList: string[];
  timeList: string[];
}

export const aggregateChartData = (historyList: HistoryRecord[], modeName: string): ChartData => {
  const filtered = historyList.filter((item) => item.modeName === modeName).reverse();

  const dateList: string[] = [];
  const accuracyList: string[] = [];
  const timeList: string[] = [];

  filtered.forEach((item) => {
    let accuracy = 0;
    if (item.mode === 'train') {
      let wrong = 0;
      if (item.detail && item.detail.length > 0) {
        wrong = item.detail.filter((x) => (x as TrainLogItem).wrong > 0).length;
      } else {
        const match = item.summary.match(/错(\d+)/);
        if (match) wrong = parseInt(match[1], 10);
      }
      accuracy = ((81 - wrong) / 81) * 100;
    } else if (item.detail && item.detail.length > 0) {
      const correctCount = item.detail.filter((x) => (x as ResultItem).ok).length;
      accuracy = (correctCount / item.detail.length) * 100;
    } else {
      const match = item.summary.match(/(\d+)%/);
      if (match) accuracy = parseInt(match[1], 10);
    }

    const duration = item.duration ? parseFloat(item.duration.replace('s', '')) : 0;
    dateList.push(item.timeStr);
    accuracyList.push(accuracy.toFixed(0));
    timeList.push(duration.toFixed(1));
  });

  return { dateList, accuracyList, timeList };
};

export const buildChartOption = ({ dateList, accuracyList, timeList }: ChartData) => {
  if (dateList.length === 0) {
    return {
      title: {
        text: '该模式暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#999' },
      },
    };
  }
  return {
    grid: { top: 30, bottom: 20, left: 30, right: 30, containLabel: true },
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: dateList,
      axisLabel: { color: '#333', fontSize: 10, interval: 'auto', hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value' as const,
        min: 0,
        max: 100,
        position: 'left' as const,
        splitLine: { show: true, lineStyle: { type: 'dashed' as const, opacity: 0.1 } },
        axisLabel: { color: '#007aff', formatter: '{value}%' },
      },
      {
        type: 'value' as const,
        position: 'right' as const,
        splitLine: { show: false },
        axisLabel: { color: '#ff3b30', formatter: '{value}s' },
      },
    ],
    series: [
      {
        name: '正确率',
        type: 'line' as const,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { color: '#007aff', width: 3 },
        itemStyle: { color: '#007aff' },
        data: accuracyList,
      },
      {
        name: '耗时',
        type: 'line' as const,
        yAxisIndex: 1,
        smooth: true,
        lineStyle: { color: '#ff3b30', width: 2, type: 'dashed' as const },
        itemStyle: { color: '#ff3b30' },
        data: timeList,
      },
    ],
  };
};
