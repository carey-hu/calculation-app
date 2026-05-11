export const aggregateChartData = (historyList, modeName) => {
  const all = JSON.parse(JSON.stringify(historyList)).reverse();
  const filtered = all.filter((item) => item.modeName === modeName);

  const dateList = [];
  const accuracyList = [];
  const timeList = [];

  filtered.forEach((item) => {
    let accuracy = 0;
    if (item.mode === 'train') {
      let wrong = 0;
      if (item.detail && item.detail.length > 0) {
        wrong = item.detail.filter((x) => x.wrong > 0).length;
      } else {
        const match = item.summary.match(/错(\d+)/);
        if (match) wrong = parseInt(match[1]);
      }
      accuracy = ((81 - wrong) / 81) * 100;
    } else if (item.detail && item.detail.length > 0) {
      const correctCount = item.detail.filter((x) => x.ok).length;
      accuracy = (correctCount / item.detail.length) * 100;
    } else {
      const match = item.summary.match(/(\d+)%/);
      if (match) accuracy = parseInt(match[1]);
    }

    const duration = item.duration ? parseFloat(item.duration.replace('s', '')) : 0;
    dateList.push(item.timeStr);
    accuracyList.push(accuracy.toFixed(0));
    timeList.push(duration.toFixed(1));
  });

  return { dateList, accuracyList, timeList };
};

export const buildChartOption = ({ dateList, accuracyList, timeList }) => {
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
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dateList,
      axisLabel: { color: '#333', fontSize: 10, interval: 'auto', hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value', min: 0, max: 100, position: 'left',
        splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } },
        axisLabel: { color: '#007aff', formatter: '{value}%' },
      },
      {
        type: 'value', position: 'right',
        splitLine: { show: false },
        axisLabel: { color: '#ff3b30', formatter: '{value}s' },
      },
    ],
    series: [
      {
        name: '正确率', type: 'line', yAxisIndex: 0, smooth: true,
        lineStyle: { color: '#007aff', width: 3 },
        itemStyle: { color: '#007aff' },
        data: accuracyList,
      },
      {
        name: '耗时', type: 'line', yAxisIndex: 1, smooth: true,
        lineStyle: { color: '#ff3b30', width: 2, type: 'dashed' },
        itemStyle: { color: '#ff3b30' },
        data: timeList,
      },
    ],
  };
};
