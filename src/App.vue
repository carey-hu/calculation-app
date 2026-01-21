<template>
  <div class="page">
    <div class="aurora-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>
    
    <div v-if="toast.show" class="toast-mask">
      <div class="toast-content">{{ toast.title }}</div>
    </div>

    <div v-if="viewState==='home'" class="wrap homeWrap">
      <div class="header-section">
        <div class="title">计算助手</div>
        <div class="subtitle">Daily Mental Math Training</div>
      </div>

      <div class="card glass-panel">
        <div class="section-header">大九九 / 除法</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='train'?'active':'']" @click="setMode('train')">
            <span class="modeTitle">训练</span>
            <span class="modeDesc">81题</span>
          </div>
          <div :class="['modeItem', mode==='speed'?'active':'']" @click="setMode('speed')">
            <span class="modeTitle">竞速</span>
            <span class="modeDesc">10题</span>
          </div>
          <div :class="['modeItem', mode==='first'?'active':'']" @click="setMode('first')">
            <span class="modeTitle">首位</span>
            <span class="modeDesc">随机</span>
          </div>
        </div>

        <div class="section-header">商首位专项 (指定除数 2-19)</div>
        <button class="btnGhost glass-btn select-btn" @click="toSelectDivisor">
          进入除数选择模式
        </button>

        <div class="section-header">一位数专项 (仅填尾数)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='plus'?'active':'']" @click="setMode('plus')">
            <span class="modeTitle">进位加</span>
          </div>
          <div :class="['modeItem', mode==='minus'?'active':'']" @click="setMode('minus')">
            <span class="modeTitle">退位减</span>
          </div>
        </div>

        <div class="section-header">多位数专项 (完整答案)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='doublePlus'?'active':'']" @click="setMode('doublePlus')">
            <span class="modeTitle">双进位</span>
          </div>
          <div :class="['modeItem', mode==='doubleMinus'?'active':'']" @click="setMode('doubleMinus')">
            <span class="modeTitle">双退位</span>
          </div>
          <div :class="['modeItem', mode==='triplePlus'?'active':'']" @click="setMode('triplePlus')">
            <span class="modeTitle">三进位</span>
          </div>
        </div>

        <div class="section-header">估算技巧 (允许3%误差)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='divSpecA'?'active':'']" @click="setMode('divSpecA')">
            <span class="modeTitle">反向放缩</span>
          </div>
          <div :class="['modeItem', mode==='divSpecB'?'active':'']" @click="setMode('divSpecB')">
            <span class="modeTitle">平移法</span>
          </div>
        </div>

        <button class="btnPrimary glass-primary-btn" @click="startGame">开始练习</button>
        <button class="btnText" @click="openHistory">查看历史记录</button>
      </div>
    </div>

    <div v-if="viewState==='selectDivisor'" class="wrap homeWrap">
      <div class="header-section">
        <div class="title">选择除数</div>
        <div class="subtitle">点击数字开始商首位专项训练</div>
      </div>
      
      <div class="card glass-panel">
        <div class="grid-num">
          <button v-for="item in [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]" :key="item" 
                  class="num-btn glass-key" 
                  @click="selectDivisorAndStart(item)">{{item}}</button>
        </div>
        <button class="btnGhost glass-btn" style="margin-top: 24px;" @click="goHome">返回主页</button>
      </div>
    </div>

    <div v-if="viewState==='game'" class="wrap gameRoot">
      <div class="game-topbar">
        <button class="btnBack glass-btn-icon" @click="goHome">
          <span style="font-size: 20px;">✕</span>
        </button>
        <div class="game-stats">
          <div class="stat-pill glass-pill">{{progressText}}</div>
          <div class="stat-pill glass-pill timer">⏱ {{totalText}}</div>
        </div>
      </div>

      <div class="gameMain">
        <div class="card qCard glass-panel-clear">
          <div class="qText">{{qText}}</div>
          <div class="qNote">{{hintNote}}</div>
          <div class="ansBox glass-input">{{input ? input : ''}}</div> <div class="hint" :class="{ error: hint.includes('错误') }">{{hint}}</div>
        </div>
      </div>

      <div class="keypad glass-panel-bottom">
        <div class="fnRow">
          <button class="kFn glass-key secondary" @click="leftAction">{{leftText}}</button>
          <button class="kFn glass-key secondary" @click="clearInput">清空</button>
          <button class="kFn glass-key delete" @click="backspace">⌫</button>
        </div>
        <div class="grid-keypad">
          <button v-for="item in [1,2,3,4,5,6,7,8,9]" :key="item" class="k glass-key" @click="pressDigit(item)">{{item}}</button>
          <button class="k wide glass-key" @click="pressDigit(0)">0</button>
          <button class="k confirm wide2 glass-key-confirm" @click="confirmAnswer">确认</button>
        </div>
      </div>
    </div>

    <div v-if="viewState==='result'" class="wrap full-height">
      <div class="header-section">
        <div class="title">{{resultTitle}}</div>
        <div class="subtitle">{{resultMeta}}</div>
      </div>
      
      <div class="card full-flex glass-panel">
        <div class="resultScroll">
          <template v-if="mode==='train'">
            <div v-for="(item, index) in trainLog" :key="index" class="row">
              <span class="rowLeft"><span class="idx">{{index+1}}</span> {{item.q}}</span>
              <span class="rowRight">
                <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff3b30' : 'inherit' }">{{item.usedStr}}</span> 
                <span v-if="item.wrong>0" class="badge-wrong">错{{item.wrong}}</span>
                <span v-if="item.skipped" class="badge-skip">跳</span>
              </span>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, index) in results" :key="index" class="row">
              <span class="rowLeft"><span class="idx">{{index+1}}</span> {{item.q}} = {{item.yourAns}}</span>
              <span class="rowRight">
                 <span style="margin-right:6px; font-size:12px; opacity:0.6;">{{item.usedStr}}</span>
                 <span>{{item.ok ? '✅' : '❌'}}</span>
                 <span v-if="!item.ok" style="color:#ff3b30; font-weight:700; margin-left:4px;">{{item.realAns}}</span>
              </span>
            </div>
          </template>
        </div>
        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
          <div v-if="isHistoryReview">
            <button class="btnPrimary glass-primary-btn" @click="backToHistory">返回列表</button>
          </div>
          <div v-else>
            <button class="btnPrimary glass-primary-btn" @click="goHome">返回主页</button>
            <button class="btnGhost glass-btn" @click="startGame">再来一局</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewState==='history'" class="wrap full-height">
      <div class="header-section">
        <div class="title">历史记录</div>
        <div class="subtitle">保留最近5000条数据</div>
      </div>
      
      <div class="card full-flex glass-panel">
        
        <div v-if="showChart" class="chart-container glass-inner">
           <div class="chart-tabs">
             <div v-for="m in availableModes" :key="m" :class="['chart-tab-item', chartTab === m ? 'active' : '']" @click="switchChartTab(m)">{{ m }}</div>
           </div>
           <div id="accChart" style="width: 100%; height: 200px;"></div>
           <button class="btnText small" @click="closeChart">收起图表</button>
        </div>
        <div v-else>
           <button class="btnGhost glass-btn small-btn" @click="initChart">📊 分析趋势</button>
        </div>

        <div class="list-header">
           <span>时间 / 模式</span>
           <span>成绩 / 耗时</span>
        </div>
        
        <div class="resultScroll">
          <div v-if="historyList.length === 0" class="empty-state">
            暂无记录，快去练习吧！
          </div>
          <div v-else>
            <div v-for="(item, index) in historyList" :key="item.ts" class="row hover-effect" @click="viewHistoryDetail(index)">
              <div class="rowLeft col">
                <span class="time-label">{{item.timeStr}}</span>
                <span class="mode-label">{{item.modeName}}</span>
              </div>
              <div class="rowRight col align-right">
                <span class="score-val">{{item.summary}}</span>
                <span class="time-val">{{item.duration}}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 15px; display:flex; flex-direction: column; gap:12px;">
          <button v-if="historyList.length > 1000" class="btnGhost glass-btn danger-btn" @click="clearOldest">
            清理最早1000条
          </button>
          <div style="display:flex; gap:12px;">
            <button class="btnGhost glass-btn" style="flex:1;" @click="clearHistory">清空</button>
            <button class="btnPrimary glass-primary-btn" style="flex:1;" @click="closeHistory">返回</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  data() {
    return {
      viewState: 'home', mode: 'train', selectedDivisor: 0, pool: [], idx: 0, current: null, input: '', hint: 'Ready?', hintNote: '', totalText: '0:00.0', progressText: '1/81', qText: '—', leftText: '跳过', totalStartTs: 0, qStartTs: 0, timer: null, trainWrong: 0, trainSkip: 0, curWrongTries: 0, trainLog: [], results: [], resultTitle: '', resultMeta: '', historyList: [], isHistoryReview: false, toast: { show: false, title: '' },
      showChart: false, chartInstance: null, chartTab: '', availableModes: [] 
    }
  },
  mounted() {
    const history = localStorage.getItem('calc_history');
    if(history) { try { this.historyList = JSON.parse(history); } catch(e){ console.error(e) } }
    window.addEventListener('resize', () => { if(this.chartInstance) this.chartInstance.resize(); });
  },
  methods: {
    now() { return Date.now(); },
    showToast(title) { this.toast.title = title; this.toast.show = true; setTimeout(() => { this.toast.show = false; }, 1500); },
    initChart() { this.showChart = true; const modeSet = new Set(this.historyList.map(item => item.modeName)); this.availableModes = Array.from(modeSet); if(this.historyList.length > 0 && !this.chartTab) { this.chartTab = this.historyList[0].modeName; } else if (this.availableModes.length > 0 && !this.chartTab) { this.chartTab = this.availableModes[0]; } this.$nextTick(() => { this.renderChart(this.chartTab); }); },
    switchChartTab(modeName) { this.chartTab = modeName; this.renderChart(modeName); },
    renderChart(targetModeName) {
      const chartDom = document.getElementById('accChart'); if(!chartDom) return; if(this.chartInstance) this.chartInstance.dispose(); this.chartInstance = echarts.init(chartDom);
      const allData = JSON.parse(JSON.stringify(this.historyList)).reverse(); const filteredData = allData.filter(item => item.modeName === targetModeName);
      const dateList = []; const accuracyList = []; const timeList = [];
      filteredData.forEach(item => { let accuracy = 0; if(item.mode === 'train') { let wrong = 0; if(item.detail && item.detail.length > 0) { wrong = item.detail.filter(x => x.wrong > 0).length; } else { const match = item.summary.match(/错(\d+)/); if(match) wrong = parseInt(match[1]); } accuracy = ((81 - wrong) / 81) * 100; } else { if(item.detail && item.detail.length > 0) { const correctCount = item.detail.filter(x => x.ok).length; accuracy = (correctCount / item.detail.length) * 100; } else { const match = item.summary.match(/(\d+)%/); if(match) accuracy = parseInt(match[1]); } } let duration = 0; if(item.duration) { duration = parseFloat(item.duration.replace('s', '')); } dateList.push(item.timeStr); accuracyList.push(accuracy.toFixed(0)); timeList.push(duration.toFixed(1)); });
      if(dateList.length === 0) { this.chartInstance.setOption({ title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999' } } }); return; }
      const option = {
        grid: { top: 30, bottom: 20, left: 30, right: 30, containLabel: true }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: dateList, axisLabel: { color: '#666', fontSize: 10, interval: 'auto', hideOverlap: true }, axisLine: { show: false }, axisTick: { show: false } }, yAxis: [ { type: 'value', min: 0, max: 100, position: 'left', splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.05)' } } }, { type: 'value', position: 'right', splitLine: { show: false } } ], series: [ { name: '正确率', type: 'line', yAxisIndex: 0, smooth: true, showSymbol: false, lineStyle: { color: '#007AFF', width: 3 }, itemStyle: { color: '#007AFF' }, data: accuracyList }, { name: '耗时', type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, lineStyle: { color: '#5856D6', width: 2, type: 'dashed' }, itemStyle: { color: '#5856D6' }, data: timeList } ]
      };
      this.chartInstance.setOption(option);
    },
    closeChart() { this.showChart = false; if(this.chartInstance) { this.chartInstance.dispose(); this.chartInstance = null; } },
    shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    buildPool(){ const arr = []; for(let d=11; d<=19; d++){ for(let q=1; q<=9; q++){ arr.push({ dividend: d*q, divisor: d, ans: q, symbol: '÷' }); } } return arr; },
    msToMMSS(ms){ const totalSec = ms / 1000; const m = Math.floor(totalSec / 60); const s = (totalSec % 60).toFixed(1); return `${m}:${s < 10 ? '0' + s : s}`; },
    formatTime(ts) { const date = new Date(ts); const m = date.getMonth() + 1; const d = date.getDate(); const h = date.getHours(); const min = date.getMinutes(); const pad = n => n < 10 ? '0' + n : n; return `${m}/${d} ${pad(h)}:${pad(min)}`; },
    getModeName(mode, extra) { const map = { 'train': '基础训练', 'speed': '大九九竞速', 'first': '商首位', 'firstSpec': `商首位(除${extra})`, 'plus': '一位进位加', 'minus': '一位退位减', 'doublePlus': '双进位加', 'doubleMinus': '双退位减', 'triplePlus': '三进位加', 'tripleMinus': '三退位减', 'divSpecA': '反向放缩', 'divSpecB': '平移法' }; return map[mode] || '未知模式'; },
    setMode(mode){ this.mode = mode; }, toSelectDivisor(){ this.viewState = 'selectDivisor'; }, selectDivisorAndStart(d){ this.mode = 'firstSpec'; this.selectedDivisor = d; this.startGame(); },
    startGame(){
      const mode = this.mode; let pool = []; let hintNote = '精确到整数';
      if(mode === 'plus'){ hintNote = '只填个位尾数'; for(let i=0; i<10; i++){ let a, b; do { a = Math.floor(Math.random()*9)+1; b = Math.floor(Math.random()*9)+1; } while(a + b < 10); pool.push({ dividend: a, divisor: b, ans: (a+b)%10, symbol: '+' }); } }
      else if(mode === 'minus'){ hintNote = '只填个位尾数'; for(let i=0; i<10; i++){ let a, b; do { a = Math.floor(Math.random()*9)+1; b = Math.floor(Math.random()*9)+1; } while(a >= b); pool.push({ dividend: a, divisor: b, ans: (10+a-b), symbol: '-' }); } }
      else if(mode === 'doublePlus'){ hintNote = '个位十位均进位'; for(let i=0; i<10; i++){ let a, b, a1, a2, b1, b2; do { a = Math.floor(Math.random()*90)+10; b = Math.floor(Math.random()*90)+10; a1 = Math.floor(a/10); a2 = a%10; b1 = Math.floor(b/10); b2 = b%10; } while(a2 + b2 < 10 || a1 + b1 < 10); pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' }); } }
      else if(mode === 'doubleMinus'){ hintNote = '个位退，十位不退'; for(let i=0; i<10; i++){ let a, b, a1, a2, b1, b2; do { a = Math.floor(Math.random()*90)+10; b = Math.floor(Math.random()*90)+10; a1 = Math.floor(a/10); a2 = a%10; b1 = Math.floor(b/10); b2 = b%10; } while(!(a2 < b2 && a1 - 1 >= b1)); pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' }); } }
      else if(mode === 'triplePlus'){ hintNote = '三位连续进位'; for(let i=0; i<10; i++){ let a, b, a1, a2, a3, b1, b2, b3; do { a = Math.floor(Math.random()*900)+100; b = Math.floor(Math.random()*900)+100; a1 = Math.floor(a/100); a2 = Math.floor((a%100)/10); a3 = a%10; b1 = Math.floor(b/100); b2 = Math.floor((b%100)/10); b3 = b%10; } while(a3 + b3 < 10 || a2 + b2 < 10 || a1 + b1 < 10); pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' }); } }
      else if(mode === 'tripleMinus'){ hintNote = '个位十位连续退位'; for(let i=0; i<10; i++){ let a, b, a1, a2, a3, b1, b2, b3; do { a = Math.floor(Math.random()*900)+100; b = Math.floor(Math.random()*900)+100; a1 = Math.floor(a/100); a2 = Math.floor((a%100)/10); a3 = a%10; b1 = Math.floor(b/100); b2 = Math.floor((b%100)/10); b3 = b%10; } while(!(a3 < b3 && (a2 - 1) < b2 && (a1 - 1) >= b1)); pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' }); } }
      else if(mode === 'divSpecA'){ hintNote = '误差3%内'; for(let i=0; i<10; i++){ const divisor = Math.floor(Math.random() * (199 - 111 + 1)) + 111; const dividend = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000; const ans = dividend / divisor; pool.push({ dividend, divisor, ans, symbol: '÷' }); } }
      else if(mode === 'divSpecB'){ hintNote = '误差3%内'; let count = 0; while(count < 10){ const divisor = Math.floor(Math.random() * 900) + 100; const targetQ = Math.floor(Math.random() * (111 - 90 + 1)) + 90; const dividend = divisor * targetQ + Math.floor(Math.random() * divisor); if(dividend >= 10000 && dividend <= 99999){ const ans = dividend / divisor; pool.push({ dividend, divisor, ans, symbol: '÷' }); count++; } } }
      else if(mode === 'first'){ hintNote = '输入首位数字'; for(let i=0; i<10; i++){ const divisor = 11 + Math.floor(Math.random() * 9); const dividend = 100 + Math.floor(Math.random() * 900); const firstDigit = parseInt(String(Math.floor(dividend / divisor))[0], 10); pool.push({ dividend, divisor, ans: firstDigit, symbol: '÷' }); } }
      else if(mode === 'firstSpec'){ const d = this.selectedDivisor; hintNote = `除${d}专项`; for(let i=0; i<10; i++){ const dividend = Math.floor(Math.random() * (999 - d + 1)) + d; const fullQuotient = Math.floor(dividend / d); const firstDigit = parseInt(String(fullQuotient)[0], 10); pool.push({ dividend, divisor: d, ans: firstDigit, symbol: '÷' }); } }
      else { pool = this.shuffle(this.buildPool()); if(mode === 'speed') pool = pool.slice(0, 10); }
      if(this.timer) clearInterval(this.timer);
      this.viewState = 'game'; this.pool = pool; this.idx = 0; this.input = ''; this.hint = 'READY'; this.hintNote = hintNote; this.leftText = (mode === 'train' ? '跳过' : '重开');
      this.totalStartTs = this.now(); this.qStartTs = 0; this.trainWrong = 0; this.trainSkip = 0; this.curWrongTries = 0; this.trainLog = []; this.results = []; this.isHistoryReview = false;
      this.$nextTick(() => { this._nextQuestion(); this.timer = setInterval(()=> this._tick(), 100); });
    },
    _tick(){ const diff = this.now() - this.totalStartTs; this.totalText = this.msToMMSS(diff); },
    _setQuestion(q, shownIdx){ this.current = q; this.qStartTs = this.now(); this.input = ''; this.curWrongTries = 0; this.qText = `${q.dividend}${q.symbol}${q.divisor}=`; this.progressText = `${shownIdx}/${this.pool.length}`; },
    _nextQuestion(){ const { idx, pool } = this; if(idx >= pool.length){ this._finish(); return; } this._setQuestion(pool[idx], idx + 1); this.idx = idx + 1; },
    pressDigit(d){ let input = this.input || ''; if(input.length >= 6) return; input += String(d); this.input = input; },
    clearInput(){ this.input = ''; },
    backspace(){ this.input = (this.input || '').slice(0, -1); },
    leftAction(){ if(this.mode !== 'train'){ this.startGame(); return; } const cur = this.current; const used = (this.now() - this.qStartTs)/1000; const log = this.trainLog.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, usedStr: used.toFixed(1) + 's', wrong: this.curWrongTries, skipped: true }]); this.trainSkip = this.trainSkip + 1; this.trainLog = log; this._nextQuestion(); },
    confirmAnswer(){
      const { current: cur, input, mode } = this; if(!input) return; const n = parseInt(input, 10); const used = (this.now() - this.qStartTs)/1000;
      let correct = false; let realAnsDisplay = cur.ans; 
      if(mode === 'divSpecA' || mode === 'divSpecB'){ const diffRatio = Math.abs(n - cur.ans) / cur.ans; correct = diffRatio <= 0.03; realAnsDisplay = Math.round(cur.ans); } else { correct = (n === cur.ans); }
      if(mode === 'train'){ if(correct){ const log = this.trainLog.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, usedStr: used.toFixed(1) + 's', wrong: this.curWrongTries, skipped: false }]); this.trainLog = log; this.showToast('正确'); this._nextQuestion(); }else{ this.trainWrong++; this.curWrongTries++; this.input = ''; this.hint = `❌ 答案是 ${realAnsDisplay}`; } return; }
      const results = this.results.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, ok: correct, yourAns: input, realAns: realAnsDisplay, usedStr: used.toFixed(1) + 's' }]); this.results = results; this.showToast(correct ? '正确' : `❌ ${realAnsDisplay}`); this._nextQuestion();
    },
    _saveRecord(meta, summary, detailLog){ const record = { ts: this.now(), timeStr: this.formatTime(this.now()), mode: this.mode, modeName: this.getModeName(this.mode, this.selectedDivisor), duration: meta.totalSec.toFixed(1) + 's', summary: summary, detail: detailLog }; let history = this.historyList; history.unshift(record); if(history.length > 5000) history = history.slice(0, 5000); this.historyList = history; localStorage.setItem('calc_history', JSON.stringify(history)); },
    _finish(){ if(this.timer) clearInterval(this.timer); const { mode, totalStartTs, results, trainLog, selectedDivisor } = this; const totalSec = (this.now() - totalStartTs)/1000; let title = '训练完成'; if(mode==='speed') title='竞速完成'; let metaText = ''; let recordSummary = ''; let detailLog = []; if(mode === 'train'){ metaText = `${totalSec.toFixed(1)}s｜错${this.trainWrong}｜跳${this.trainSkip}`; recordSummary = `错${this.trainWrong}/跳${this.trainSkip}`; detailLog = trainLog; } else { const correctCount = results.filter(x=>x.ok).length; const totalCount = results.length; metaText = `正确${correctCount}/${totalCount}｜${totalSec.toFixed(1)}s`; recordSummary = `${Math.round(correctCount/totalCount*100)}%`; detailLog = results; } this.viewState = 'result'; this.resultTitle = title; this.resultMeta = metaText; this.isHistoryReview = false; this._saveRecord({ totalSec }, recordSummary, detailLog); },
    goHome(){ if(this.timer) clearInterval(this.timer); this.viewState = 'home'; },
    openHistory(){ this.viewState = 'history'; if(this.showChart) this.initChart(); },
    viewHistoryDetail(index){ const record = this.historyList[index]; if(!record) return; let title = record.modeName; if(record.mode === 'train'){ this.mode = record.mode; this.trainLog = record.detail || []; this.results = []; this.viewState = 'result'; this.resultTitle = title; this.resultMeta = `${record.timeStr} · ${record.duration}`; this.isHistoryReview = true; } else { this.mode = record.mode; this.results = record.detail || []; this.trainLog = []; this.viewState = 'result'; this.resultTitle = title; this.resultMeta = `${record.timeStr} · ${record.duration}`; this.isHistoryReview = true; } },
    backToHistory(){ this.viewState = 'history'; if(this.showChart) this.initChart(); },
    closeHistory(){ this.viewState = 'home'; },
    clearOldest() { if(confirm('清理最早1000条记录？')){ const keepCount = this.historyList.length - 1000; this.historyList = this.historyList.slice(0, keepCount); localStorage.setItem('calc_history', JSON.stringify(this.historyList)); this.showToast('清理完成'); if(this.showChart) this.initChart(); } },
    clearHistory(){ if(confirm('确定清空所有记录？')){ localStorage.removeItem('calc_history'); this.historyList = []; this.showToast('已清空'); } }
  }
}
</script>

<style scoped>
/* --- 全局字体与重置 --- */
.page {
  min-height: 100vh;
  /* 动态极光背景 */
  background: #f2f6fa;
  color: #1d1d1f;
  display: flex; flex-direction: column; max-width: 480px; margin: 0 auto;
  box-shadow: 0 0 40px rgba(0,0,0,0.1);
  font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

/* 动态背景球 */
.aurora-bg { position: absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; }
.blob { position: absolute; border-radius: 50%; filter: blur(50px); opacity: 0.7; animation: float 10s infinite alternate ease-in-out; }
.blob-1 { top: -10%; left: -20%; width: 300px; height: 300px; background: #a8c0ff; animation-delay: 0s; }
.blob-2 { bottom: 10%; right: -20%; width: 250px; height: 250px; background: #ffc8dd; animation-delay: -5s; }
.blob-3 { top: 40%; left: 40%; width: 200px; height: 200px; background: #b8f2e6; opacity:0.5; animation-delay: -2s; }
@keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, 40px); } }

/* 核心容器 */
.wrap { padding: 24px 20px 30px; box-sizing: border-box; position: relative; z-index: 1; }
.homeWrap { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.full-height { flex: 1; display: flex; flex-direction: column; height: 100vh; }
.full-flex { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-bottom: 20px; padding: 24px 20px; }

/* 标题系统 */
.header-section { margin-bottom: 24px; text-align: center; }
.title { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px; color: #1d1d1f; }
.subtitle { font-size: 15px; color: #86868b; font-weight: 500; letter-spacing: 0.2px; }

/* --- 玻璃面板升级版 (Glass 2.0) --- */
.glass-panel {
  background: rgba(255, 255, 255, 0.7); /* 提高白度，增加对比 */
  backdrop-filter: blur(30px) saturate(180%); /* 高级毛玻璃秘诀：高饱和度 */
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 10px 40px -10px rgba(0,0,0,0.1),
    inset 0 1px 0 0 rgba(255,255,255,0.8); /* 顶部高光 */
  border-radius: 28px;
  padding: 24px;
}

/* 分类小标题 */
.section-header {
  font-size: 13px; font-weight: 700; color: #86868b; 
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 20px 0 10px 4px;
}
.section-header:first-child { margin-top: 0; }

/* 模式选择网格 */
.modeRow { display: flex; gap: 10px; margin-bottom: 10px; }
.modeItem { 
  flex: 1; padding: 14px 8px; border-radius: 18px; 
  background: rgba(255,255,255,0.5); 
  border: 1px solid rgba(255,255,255,0.5); 
  text-align: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.modeItem:active { transform: scale(0.96); }
.modeItem.active { 
  background: #0071e3; 
  border-color: transparent; 
  box-shadow: 0 8px 16px rgba(0, 113, 227, 0.3);
}
.modeTitle { display: block; font-size: 16px; font-weight: 700; color: #1d1d1f; margin-bottom: 2px; }
.modeDesc { display: block; font-size: 11px; font-weight: 600; color: #86868b; }
.modeItem.active .modeTitle, .modeItem.active .modeDesc { color: #fff; }

/* 按钮系统 */
button { border: none; outline: none; cursor: pointer; font-family: inherit; -webkit-tap-highlight-color: transparent; }

.glass-btn {
  width: 100%; height: 50px; border-radius: 16px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.6);
  font-size: 17px; font-weight: 600; color: #1d1d1f;
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}
.glass-btn:active { transform: scale(0.98); background: rgba(255,255,255,0.8); }

.glass-primary-btn {
  width: 100%; height: 56px; border-radius: 20px;
  background: linear-gradient(135deg, #0071e3 0%, #4facfe 100%);
  color: #fff; font-size: 20px; font-weight: 700;
  margin-top: 20px;
  box-shadow: 0 10px 25px rgba(0, 113, 227, 0.3);
  transition: all 0.2s;
}
.glass-primary-btn:active { transform: scale(0.97); box-shadow: 0 5px 15px rgba(0, 113, 227, 0.2); }

.btnText { background: transparent; color: #0071e3; font-size: 15px; font-weight: 500; margin-top: 15px; width: 100%; }

/* --- 游戏界面重构 --- */
.gameRoot { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* 顶部栏 - 解决触控问题 */
.game-topbar {
  /* 核心：增加顶部安全距离，并增加高度 */
  padding-top: max(20px, env(safe-area-inset-top));
  padding-left: 20px; padding-right: 20px;
  height: 80px; /* 足够的高度供点击 */
  display: flex; align-items: center; justify-content: space-between;
}
.glass-btn-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.5); }
.game-stats { display: flex; gap: 10px; }
.glass-pill { 
  padding: 8px 14px; border-radius: 20px; background: rgba(255,255,255,0.5); backdrop-filter: blur(10px);
  font-size: 15px; font-weight: 700; color: #1d1d1f; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.timer { font-variant-numeric: tabular-nums; width: 90px; text-align: center; }

/* 题目卡片 */
.gameMain { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 20px; }
.glass-panel-clear {
  background: rgba(255,255,255,0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.4);
  border-radius: 30px; padding: 40px 20px; text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.05);
}
.qText { font-size: 64px; font-weight: 800; color: #1d1d1f; letter-spacing: 2px; margin-bottom: 5px; }
.qNote { font-size: 15px; color: #86868b; font-weight: 500; margin-bottom: 20px; }
.glass-input {
  display: inline-block; min-width: 140px; padding: 15px 25px; border-radius: 20px;
  background: rgba(255,255,255,0.7); box-shadow: inset 0 2px 6px rgba(0,0,0,0.05);
  font-size: 36px; font-weight: 800; color: #0071e3; min-height: 40px;
}
.hint { height: 24px; margin-top: 15px; font-size: 15px; font-weight: 600; color: #86868b; }
.hint.error { color: #ff3b30; }

/* 键盘区域 */
.glass-panel-bottom {
  background: rgba(255,255,255,0.8); backdrop-filter: blur(30px);
  border-top: 1px solid rgba(255,255,255,0.6);
  border-radius: 32px 32px 0 0;
  padding: 20px 20px 40px; /* 底部增加padding */
  box-shadow: 0 -10px 40px rgba(0,0,0,0.05);
}
.fnRow { display: flex; gap: 12px; margin-bottom: 12px; }
.grid-keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.glass-key {
  height: 60px; border-radius: 16px; font-size: 26px; font-weight: 500; color: #1d1d1f;
  background: #fff; box-shadow: 0 4px 0 #e5e5ea; border: 1px solid #f2f2f7;
  transition: all 0.1s;
}
.glass-key:active { transform: translateY(4px); box-shadow: none; background: #f2f2f7; }
.glass-key.secondary { background: #e5e5ea; box-shadow: 0 4px 0 #d1d1d6; font-size: 18px; font-weight: 600; }
.glass-key.delete { background: rgba(255, 59, 48, 0.1); color: #ff3b30; box-shadow: 0 4px 0 rgba(255, 59, 48, 0.15); border: none; }
.glass-key-confirm { background: #34c759; color: #fff; box-shadow: 0 4px 0 #248a3d; border: none; font-size: 22px; font-weight: 600; }
.wide { grid-column: span 1; }
.wide2 { grid-column: span 2; }

/* 历史列表 */
.list-header { display: flex; justify-content: space-between; padding: 0 10px 10px; font-size: 12px; font-weight: 700; color: #86868b; border-bottom: 1px solid rgba(0,0,0,0.05); }
.row { display: flex; justify-content: space-between; padding: 16px 8px; border-bottom: 1px solid rgba(0,0,0,0.05); transition: background 0.2s; border-radius: 12px; }
.hover-effect:active { background: rgba(0,0,0,0.03); }
.col { display: flex; flex-direction: column; gap: 4px; }
.align-right { align-items: flex-end; }
.time-label { font-size: 13px; color: #86868b; }
.mode-label { font-size: 16px; font-weight: 600; color: #1d1d1f; }
.score-val { font-size: 18px; font-weight: 700; color: #0071e3; }
.time-val { font-size: 13px; color: #86868b; }
.idx { display: inline-block; width: 24px; color: #c7c7cc; font-size: 12px; }
.badge-wrong { color: #ff3b30; background: rgba(255, 59, 48, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 5px; }
.badge-skip { color: #ff9500; background: rgba(255, 149, 0, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 5px; }

/* 图表容器 */
.chart-container.glass-inner { 
  background: rgba(255,255,255,0.5); border-radius: 20px; padding: 15px; margin-bottom: 20px; 
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
}
.chart-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; }
.chart-tab-item { flex-shrink: 0; padding: 6px 14px; border-radius: 14px; background: rgba(255,255,255,0.6); color: #86868b; font-size: 13px; font-weight: 600; }
.chart-tab-item.active { background: #0071e3; color: #fff; box-shadow: 0 4px 10px rgba(0, 113, 227, 0.3); }

/* 除数选择网格 */
.grid-num { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.num-btn { height: 60px; font-size: 24px; }

/* 吐司 */
.toast-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; z-index: 999; pointer-events: none; }
.toast-content { background: rgba(29, 29, 31, 0.8); backdrop-filter: blur(20px); color: #fff; padding: 16px 32px; border-radius: 30px; font-size: 17px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
</style>
