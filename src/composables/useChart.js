/**
 * 图表功能
 * 使用 ECharts 展示训练趋势
 */

import { ref, onUnmounted } from 'vue'
import * as echarts from 'echarts'

export function useChart() {
  const chartInstance = ref(null)
  const showChart = ref(false)
  const chartTab = ref('')
  const availableModes = ref([])
  
  function initChart(historyList) {
    showChart.value = true
    
    // 获取所有模式
    const modeSet = new Set(historyList.map(item => item.modeName))
    availableModes.value = Array.from(modeSet)
    
    // 设置默认 tab
    if (historyList.length > 0 && !chartTab.value) {
      chartTab.value = historyList[0].modeName
    } else if (availableModes.value.length > 0 && !chartTab.value) {
      chartTab.value = availableModes.value[0]
    }
  }
  
  function renderChart(targetModeName, historyList, elementId = 'accChart') {
    const chartDom = document.getElementById(elementId)
    if (!chartDom) return
    
    // 销毁旧实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    
    chartInstance.value = echarts.init(chartDom)
    
    // 处理数据
    const allData = JSON.parse(JSON.stringify(historyList)).reverse()
    const filteredData = allData.filter(item => item.modeName === targetModeName)
    
    const dateList = []
    const accuracyList = []
    const timeList = []
    
    filteredData.forEach(item => {
      let accuracy = 0
      
      if (item.mode === 'train') {
        // 训练模式
        let wrong = 0
        if (item.detail && item.detail.length > 0) {
          wrong = item.detail.filter(x => x.wrong > 0).length
        } else {
          const match = item.summary.match(/错(\d+)/)
          if (match) wrong = parseInt(match[1])
        }
        accuracy = ((81 - wrong) / 81) * 100
      } else {
        // 其他模式
        if (item.detail && item.detail.length > 0) {
          const correctCount = item.detail.filter(x => x.ok).length
          accuracy = (correctCount / item.detail.length) * 100
        } else {
          const match = item.summary.match(/(\d+)%/)
          if (match) accuracy = parseInt(match[1])
        }
      }
      
      let duration = 0
      if (item.duration) {
        duration = parseFloat(item.duration.replace('s', ''))
      }
      
      dateList.push(item.timeStr)
      accuracyList.push(accuracy.toFixed(0))
      timeList.push(duration.toFixed(1))
    })
    
    // 无数据提示
    if (dateList.length === 0) {
      chartInstance.value.setOption({
        title: {
          text: '该模式暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#999' }
        }
      })
      return
    }
    
    // 图表配置
    const option = {
      grid: {
        top: 30,
        bottom: 20,
        left: 30,
        right: 30,
        containLabel: true
      },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: dateList,
        axisLabel: {
          color: '#333',
          fontSize: 10,
          interval: 'auto',
          hideOverlap: true
        }
      },
      yAxis: [
        {
          type: 'value',
          min: 0,
          max: 100,
          position: 'left',
          splitLine: {
            show: true,
            lineStyle: { type: 'dashed', opacity: 0.1 }
          },
          axisLabel: { color: '#007aff', formatter: '{value}%' }
        },
        {
          type: 'value',
          position: 'right',
          splitLine: { show: false },
          axisLabel: { color: '#ff3b30', formatter: '{value}s' }
        }
      ],
      series: [
        {
          name: '正确率',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { color: '#007aff', width: 3 },
          itemStyle: { color: '#007aff' },
          data: accuracyList
        },
        {
          name: '耗时',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          lineStyle: { color: '#ff3b30', width: 2, type: 'dashed' },
          itemStyle: { color: '#ff3b30' },
          data: timeList
        }
      ]
    }
    
    chartInstance.value.setOption(option)
  }
  
  function switchChartTab(modeName, historyList) {
    chartTab.value = modeName
    renderChart(modeName, historyList)
  }
  
  function closeChart() {
    showChart.value = false
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  }
  
  function resizeChart() {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  }
  
  // 清理
  onUnmounted(() => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
  })
  
  return {
    showChart,
    chartTab,
    availableModes,
    initChart,
    renderChart,
    switchChartTab,
    closeChart,
    resizeChart
  }
}
