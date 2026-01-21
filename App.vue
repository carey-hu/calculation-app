<template>
  <div class="page">
    <div v-if="toast.show" class="toast-mask">
      <div class="toast-content">
        {{ toast.title }}
      </div>
    </div>

    <div v-if="viewState==='home'" class="wrap homeWrap">
      <div class="title">计算助手</div>
      <div class="subtitle">专项练习：进位加、退位减、大九九除法</div>

      <div class="card">
        <div class="rowLabel">大九九/除法</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='train'?'active':'']" @click="setMode('train')">
            <span class="modeTitle">训练</span>
          </div>
          <div :class="['modeItem', mode==='speed'?'active':'']" @click="setMode('speed')">
            <span class="modeTitle">竞速</span>
          </div>
          <div :class="['modeItem', mode==='first'?'active':'']" @click="setMode('first')">
            <span class="modeTitle">首位(随机)</span>
          </div>
        </div>

        <div class="rowLabel">商首位专项 (指定除数 2-19)</div>
        <button class="btnGhost" style="margin-top:0; height:40px; line-height:40px; font-size:16px;" @click="toSelectDivisor">
          进入除数选择模式
        </button>

        <div class="rowLabel">一位数专项 (仅填尾数)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='plus'?'active':'']" @click="setMode('plus')">
            <span class="modeTitle">进位加</span>
          </div>
          <div :class="['modeItem', mode==='minus'?'active':'']" @click="setMode('minus')">
            <span class="modeTitle">退位减</span>
          </div>
        </div>

        <div class="rowLabel">两位数专项 (完整答案)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='doublePlus'?'active':'']" @click="setMode('doublePlus')">
            <span class="modeTitle">双进位加</span>
          </div>
          <div :class="['modeItem', mode==='doubleMinus'?'active':'']" @click="setMode('doubleMinus')">
            <span class="modeTitle">双退位减</span>
          </div>
        </div>

        <div class="rowLabel">三位数专项 (完整答案)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='triplePlus'?'active':'']" @click="setMode('triplePlus')">
            <span class="modeTitle">三进位加</span>
          </div>
          <div :class="['modeItem', mode==='tripleMinus'?'active':'']" @click="setMode('tripleMinus')">
            <span class="modeTitle">三退位减</span>
          </div>
        </div>

        <div class="rowLabel">五除三专项 (允许3%误差)</div>
        <div class="modeRow">
          <div :class="['modeItem', mode==='divSpecA'?'active':'']" @click="setMode('divSpecA')">
            <span class="modeTitle">反向放缩</span>
          </div>
          <div :class="['modeItem', mode==='divSpecB'?'active':'']" @click="setMode('divSpecB')">
            <span class="modeTitle">平移法</span>
          </div>
        </div>

        <button class="btnPrimary" @click="startGame" style="margin-top: 15px;">开始练习</button>
        <button class="btnGhost" @click="openHistory">历史记录</button>
      </div>
    </div>

    <div v-if="viewState==='selectDivisor'" class="wrap homeWrap">
      <div class="title">选择除数</div>
      <div class="subtitle">点击下方数字开始练习商首位</div>
      
      <div class="card">
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <button v-for="item in [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]" :key="item" 
                  class="k" style="font-size:20px; height:50px; line-height:50px; background:rgba(255,255,255,0.4);" 
                  @click="selectDivisorAndStart(item)">{{item}}</button>
        </div>
        <button class="btnGhost" style="margin-top: 20px;" @click="goHome">返回主页</button>
      </div>
    </div>

    <div v-if="viewState==='game'" class="wrap gameRoot" :style="{ paddingBottom: safeBottom + 'px' }">
      <div class="topbar" :style="{ marginTop: (safeTop + 8) + 'px' }">
        <button class="btnBack" @click="goHome">返回</button>
        <div class="topStats">
          <div class="stat">{{progressText}}</div>
          <div class="stat">⏱ {{totalText}}</div>
        </div>
      </div>
      <div class="gameMain">
        <div class="card qCard">
          <div class="qText">{{qText}}</div>
          <div class="qNote">{{hintNote}}</div>
          <div class="ansBox">答案：{{input ? input : '—'}}</div>
          <div class="hint">{{hint}}</div>
        </div>
      </div>
      <div class="keypad card">
        <div class="fnRow">
          <button class="kFn" @click="leftAction">{{leftText}}</button>
          <button class="kFn" @click="clearInput">清空</button>
          <button class="kFn danger" @click="backspace">退格</button>
        </div>
        <div class="grid">
          <button v-for="item in [1,2,3,4,5,6,7,8,9]" :key="item" class="k" @click="pressDigit(item)">{{item}}</button>
          <button class="k wide" @click="pressDigit(0)">0</button>
          <button class="k confirm wide2" @click="confirmAnswer">确认</button>
        </div>
      </div>
    </div>

    <div v-if="viewState==='result'" class="wrap full-height">
      <div class="title">{{resultTitle}}</div>
      <div class="subtitle">{{resultMeta}}</div>
      <div class="card full-flex">
        <div class="resultScroll">
          <template v-if="mode==='train'">
            <div v-for="(item, index) in trainLog" :key="index" class="row">
              <span class="rowLeft">{{index+1}}. {{item.q}}</span>
              <span class="rowRight">
                <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff4d4f' : 'inherit' }">{{item.usedStr}}</span> 
                / 错{{item.wrong}}{{item.skipped?'(跳)':''}}
              </span>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, index) in results" :key="index" class="row">
              <span class="rowLeft">{{index+1}}. {{item.q}} = {{item.yourAns}}</span>
              <span class="rowRight">
                 <span style="margin-right:4px; font-size:12px; color:#666;">{{item.usedStr}}</span>
                 <span>{{item.ok ? '✅' : '❌'}}</span>
                 <span v-if="!item.ok" style="color:#ff4d4f; font-size:12px; margin-left:2px;">({{item.realAns}})</span>
              </span>
            </div>
          </template>
        </div>
        <div style="margin-top: 10px;">
          <div v-if="isHistoryReview">
            <button class="btnPrimary" @click="backToHistory">返回列表</button>
          </div>
          <div v-else>
            <button class="btnPrimary" @click="goHome">返回主页</button>
            <button class="btnGhost" @click="startGame">再来一局</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewState==='history'" class="wrap full-height">
      <div class="title">历史记录</div>
      <div class="subtitle">仅保留最近50条训练数据</div>
      
      <div class="card full-flex">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; padding:0 5px;">
           <span style="font-weight:900; opacity:0.6;">时间 / 模式</span>
           <span style="font-weight:900; opacity:0.6;">成绩 / 耗时</span>
        </div>
        
        <div class="resultScroll">
          <div v-if="historyList.length === 0" style="text-align:center; padding: 20px; color:rgba(0,0,0,0.4);">
            暂无记录，快去练习吧！
          </div>
          <div v-else>
            <div v-for="(item, index) in historyList" :key="item.ts" class="row" @click="viewHistoryDetail(index)" style="cursor:pointer;">
              <div class="rowLeft" style="display:flex; flex-direction:column;">
                <span style="font-size:12px; opacity:0.6;">{{item.timeStr}}</span>
                <span>{{item.modeName}}</span>
              </div>
              <div class="rowRight" style="display:flex; flex-direction:column; align-items:flex-end;">
                <span style="font-size:16px; color:#0d6b3f;">{{item.summary}}</span>
                <span style="font-size:12px; opacity:0.6;">{{item.duration}} > </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 10px; display:flex; gap:10px;">
          <button class="btnGhost" style="margin:0; flex:1;" @click="clearHistory">清空记录</button>
          <button class="btnPrimary" style="margin:0; flex:1;" @click="closeHistory">返回主页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      viewState: 'home',   
      mode: 'train',
      selectedDivisor: 0,
      pool: [],
      idx: 0,
      current: null,
      input: '',
      hint: '输入答案后点“确认”。',
      hintNote: '',
      totalText: '0:00.0',
      progressText: '1/81',
      qText: '—',
      leftText: '跳过',
      totalStartTs: 0,
      qStartTs: 0,
      timer: null,
      trainWrong: 0,
      trainSkip: 0,
      curWrongTries: 0,
      trainLog: [],
      results: [],
      resultTitle: '',
      resultMeta: '',
      historyList: [],
      safeTop: 0,
      safeBottom: 0,
      isHistoryReview: false,
      toast: { show: false, title: '' }
    }
  },
  mounted() {
    // 读取历史记录
    const history = localStorage.getItem('calc_history');
    if(history) {
      try {
        this.historyList = JSON.parse(history);
      } catch(e){ console.error(e) }
    }
  },
  methods: {
    now() { return Date.now(); },
    
    // 简易 Toast 实现
    showToast(title) {
      this.toast.title = title;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 1500);
    },

    shuffle(arr){
      for(let i=arr.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    buildPool(){
      const arr = [];
      for(let d=11; d<=19; d++){
        for(let q=1; q<=9; q++){
          arr.push({ dividend: d*q, divisor: d, ans: q, symbol: '÷' });
        }
      }
      return arr;
    },

    msToMMSS(ms){
      const totalSec = ms / 1000;
      const m = Math.floor(totalSec / 60);
      const s = (totalSec % 60).toFixed(1);
      return `${m}:${s < 10 ? '0' + s : s}`;
    },

    formatTime(ts) {
      const date = new Date(ts);
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const h = date.getHours();
      const min = date.getMinutes();
      const pad = n => n < 10 ? '0' + n : n;
      return `${m}/${d} ${pad(h)}:${pad(min)}`;
    },

    getModeName(mode, extra) {
      const map = {
        'train': '基础训练',
        'speed': '大九九竞速',
        'first': '商首位(随机)',
        'firstSpec': `商首位(除${extra})`,
        'plus': '一位进位加',
        'minus': '一位退位减',
        'doublePlus': '双进位加',
        'doubleMinus': '双退位减',
        'triplePlus': '三进位加',
        'tripleMinus': '三退位减',
        'divSpecA': '反向放缩',
        'divSpecB': '平移法'
      };
      return map[mode] || '未知模式';
    },

    setMode(mode){
      this.mode = mode;
    },

    toSelectDivisor(){
      this.viewState = 'selectDivisor';
    },

    selectDivisorAndStart(d){
      this.mode = 'firstSpec';
      this.selectedDivisor = d;
      this.startGame();
    },

    startGame(){
      const mode = this.mode;
      let pool = [];
      let hintNote = '精确到整数';

      // 题目生成逻辑保持不变
      if(mode === 'plus'){
        hintNote = '一位数进位加：只填个位尾数';
        for(let i=0; i<10; i++){
          let a, b;
          do { a = Math.floor(Math.random()*9)+1; b = Math.floor(Math.random()*9)+1; } while(a + b < 10);
          pool.push({ dividend: a, divisor: b, ans: (a+b)%10, symbol: '+' });
        }
      } else if(mode === 'minus'){
        hintNote = '一位数退位减：只填个位尾数';
        for(let i=0; i<10; i++){
          let a, b;
          do { a = Math.floor(Math.random()*9)+1; b = Math.floor(Math.random()*9)+1; } while(a >= b);
          pool.push({ dividend: a, divisor: b, ans: (10+a-b), symbol: '-' });
        }
      } else if(mode === 'doublePlus'){
        hintNote = '双进位加：个位十位均需进位';
        for(let i=0; i<10; i++){
          let a, b, a1, a2, b1, b2;
          do {
            a = Math.floor(Math.random()*90)+10; b = Math.floor(Math.random()*90)+10;
            a1 = Math.floor(a/10); a2 = a%10;
            b1 = Math.floor(b/10); b2 = b%10;
          } while(a2 + b2 < 10 || a1 + b1 < 10);
          pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' });
        }
      } else if(mode === 'doubleMinus'){
        hintNote = '双退位减：个位退，十位不退';
        for(let i=0; i<10; i++){
          let a, b, a1, a2, b1, b2;
          do {
            a = Math.floor(Math.random()*90)+10; b = Math.floor(Math.random()*90)+10;
            a1 = Math.floor(a/10); a2 = a%10;
            b1 = Math.floor(b/10); b2 = b%10;
          } while(!(a2 < b2 && a1 - 1 >= b1)); 
          pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' });
        }
      } else if(mode === 'triplePlus'){
        hintNote = '三进位加：个位十位百位均需进位';
        for(let i=0; i<10; i++){
          let a, b, a1, a2, a3, b1, b2, b3;
          do {
            a = Math.floor(Math.random()*900)+100; b = Math.floor(Math.random()*900)+100;
            a1 = Math.floor(a/100); a2 = Math.floor((a%100)/10); a3 = a%10;
            b1 = Math.floor(b/100); b2 = Math.floor((b%100)/10); b3 = b%10;
          } while(a3 + b3 < 10 || a2 + b2 < 10 || a1 + b1 < 10);
          pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' });
        }
      } else if(mode === 'tripleMinus'){
        hintNote = '三退位减：个十退，百不退';
        for(let i=0; i<10; i++){
          let a, b, a1, a2, a3, b1, b2, b3;
          do {
            a = Math.floor(Math.random()*900)+100; b = Math.floor(Math.random()*900)+100;
            a1 = Math.floor(a/100); a2 = Math.floor((a%100)/10); a3 = a%10;
            b1 = Math.floor(b/100); b2 = Math.floor((b%100)/10); b3 = b%10;
          } while(!(a3 < b3 && (a2 - 1) < b2 && (a1 - 1) >= b1)); 
          pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' });
        }
      } else if(mode === 'divSpecA'){
        hintNote = '反向放缩：除数111-199 (误差3%内)';
        for(let i=0; i<10; i++){
          const divisor = Math.floor(Math.random() * (199 - 111 + 1)) + 111; 
          const dividend = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
          const ans = dividend / divisor;
          pool.push({ dividend, divisor, ans, symbol: '÷' });
        }
      } else if(mode === 'divSpecB'){
        hintNote = '平移法：商90-111 (误差3%内)';
        let count = 0;
        while(count < 10){
          const divisor = Math.floor(Math.random() * 900) + 100; 
          const targetQ = Math.floor(Math.random() * (111 - 90 + 1)) + 90;
          const dividend = divisor * targetQ + Math.floor(Math.random() * divisor);
          if(dividend >= 10000 && dividend <= 99999){
             const ans = dividend / divisor;
             pool.push({ dividend, divisor, ans, symbol: '÷' });
             count++;
          }
        }
      } else if(mode === 'first'){
        hintNote = '目标：输入商的第一位数字';
        for(let i=0; i<10; i++){
          const divisor = 11 + Math.floor(Math.random() * 9); 
          const dividend = 100 + Math.floor(Math.random() * 900); 
          const firstDigit = parseInt(String(Math.floor(dividend / divisor))[0], 10);
          pool.push({ dividend, divisor, ans: firstDigit, symbol: '÷' });
        }
      } else if(mode === 'firstSpec'){
         const d = this.selectedDivisor;
         hintNote = `除数${d}专项：只填商首位`;
         for(let i=0; i<10; i++){
            const dividend = Math.floor(Math.random() * (999 - d + 1)) + d;
            const fullQuotient = Math.floor(dividend / d);
            const firstDigit = parseInt(String(fullQuotient)[0], 10);
            pool.push({ dividend, divisor: d, ans: firstDigit, symbol: '÷' });
         }
      } else {
        pool = this.shuffle(this.buildPool());
        if(mode === 'speed') pool = pool.slice(0, 10);
      }

      if(this.timer) clearInterval(this.timer);
      const totalStartTs = this.now();
      
      this.viewState = 'game';
      this.pool = pool;
      this.idx = 0;
      this.input = '';
      this.hint = '请输入答案';
      this.hintNote = hintNote;
      this.leftText = (mode === 'train' ? '跳过' : '重开');
      this.totalStartTs = totalStartTs;
      this.qStartTs = 0;
      this.trainWrong = 0;
      this.trainSkip = 0;
      this.curWrongTries = 0;
      this.trainLog = [];
      this.results = [];
      this.isHistoryReview = false;

      // 下一帧执行，确保DOM更新
      this.$nextTick(() => {
        this._nextQuestion();
        this.timer = setInterval(()=> this._tick(), 100); 
      });
    },

    _tick(){
      const diff = this.now() - this.totalStartTs;
      this.totalText = this.msToMMSS(diff);
    },

    _setQuestion(q, shownIdx){
      this.current = q;
      this.qStartTs = this.now();
      this.input = '';
      this.curWrongTries = 0;
      this.qText = `${q.dividend}${q.symbol}${q.divisor}=`;
      this.progressText = `${shownIdx}/${this.pool.length}`;
    },

    _nextQuestion(){
      const { idx, pool } = this;
      if(idx >= pool.length){ this._finish(); return; }
      this._setQuestion(pool[idx], idx + 1);
      this.idx = idx + 1;
    },

    pressDigit(d){
      let input = this.input || '';
      if(input.length >= 6) return;
      input += String(d);
      this.input = input;
    },

    clearInput(){ this.input = ''; },
    backspace(){ this.input = (this.input || '').slice(0, -1); },

    leftAction(){
      if(this.mode !== 'train'){ this.startGame(); return; }
      const cur = this.current;
      const used = (this.now() - this.qStartTs)/1000;
      const log = this.trainLog.concat([{
        q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
        usedStr: used.toFixed(1) + 's',
        wrong: this.curWrongTries,
        skipped: true
      }]);
      this.trainSkip = this.trainSkip + 1;
      this.trainLog = log;
      this._nextQuestion();
    },

    confirmAnswer(){
      const { current: cur, input, mode } = this;
      if(!input) return;
      const n = parseInt(input, 10);
      const used = (this.now() - this.qStartTs)/1000;

      let correct = false;
      let realAnsDisplay = cur.ans; 

      if(mode === 'divSpecA' || mode === 'divSpecB'){
        const diffRatio = Math.abs(n - cur.ans) / cur.ans;
        correct = diffRatio <= 0.03;
        realAnsDisplay = Math.round(cur.ans); 
      } else {
        correct = (n === cur.ans);
      }

      if(mode === 'train'){
        if(correct){
          const log = this.trainLog.concat([{
            q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
            usedStr: used.toFixed(1) + 's',
            wrong: this.curWrongTries,
            skipped: false
          }]);
          this.trainLog = log;
          this.showToast('正确');
          this._nextQuestion();
        } else {
          this.trainWrong++;
          this.curWrongTries++;
          this.input = '';
          this.hint = `错误！答案是：${realAnsDisplay}`;
        }
        return;
      }

      const results = this.results.concat([{
        q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
        ok: correct,
        yourAns: input, 
        realAns: realAnsDisplay, 
        usedStr: used.toFixed(1) + 's'
      }]);

      this.results = results;
      this.showToast(correct ? '正确' : `错误(${realAnsDisplay})`);
      this._nextQuestion();
    },

    _saveRecord(meta, summary, detailLog){
      const record = {
        ts: this.now(),
        timeStr: this.formatTime(this.now()),
        mode: this.mode,
        modeName: this.getModeName(this.mode, this.selectedDivisor),
        duration: meta.totalSec.toFixed(1) + 's',
        summary: summary,
        detail: detailLog 
      };
      
      let history = this.historyList;
      history.unshift(record);
      if(history.length > 50) history = history.slice(0, 50);
      this.historyList = history;
      // Web端存储
      localStorage.setItem('calc_history', JSON.stringify(history));
    },

    _finish(){
      if(this.timer) clearInterval(this.timer);
      const { mode, totalStartTs, results, trainLog, selectedDivisor } = this;
      const totalSec = (this.now() - totalStartTs)/1000;
      
      let title = '训练完成！';
      if(mode==='plus') title='一位数进位加完成！';
      else if(mode==='minus') title='一位数退位减完成！';
      else if(mode==='doublePlus') title='双进位加完成！';
      else if(mode==='doubleMinus') title='双退位减完成！';
      else if(mode==='triplePlus') title='三进位加完成！';
      else if(mode==='tripleMinus') title='三退位减完成！';
      else if(mode==='speed') title='竞速完成！';
      else if(mode==='first') title='商首位完成！';
      else if(mode==='divSpecA') title='反向放缩完成！';
      else if(mode==='divSpecB') title='平移法完成！';
      else if(mode==='firstSpec') title=`商首位(除${selectedDivisor})完成！`;

      let metaText = '';
      let recordSummary = '';
      let detailLog = [];

      if(mode === 'train'){
          metaText = `用时：${totalSec.toFixed(1)}s｜错误：${this.trainWrong}｜跳过：${this.trainSkip}`;
          recordSummary = `错${this.trainWrong}/跳${this.trainSkip}`;
          detailLog = trainLog;
      } else {
          const correctCount = results.filter(x=>x.ok).length;
          const totalCount = results.length;
          metaText = `正确：${correctCount}/${totalCount}｜总用时：${totalSec.toFixed(1)}s`;
          recordSummary = `正确率 ${Math.round(correctCount/totalCount*100)}%`;
          detailLog = results;
      }

      this.viewState = 'result';
      this.resultTitle = title;
      this.resultMeta = metaText;
      this.isHistoryReview = false;

      this._saveRecord({ totalSec }, recordSummary, detailLog);
    },

    goHome(){
      if(this.timer) clearInterval(this.timer);
      this.viewState = 'home';
    },

    openHistory(){
      this.viewState = 'history';
    },

    viewHistoryDetail(index){
      const record = this.historyList[index];
      if(!record) return;

      let title = record.modeName + ' 回顾';
      
      if(record.mode === 'train'){
          this.mode = record.mode;
          this.trainLog = record.detail || [];
          this.results = [];
          this.viewState = 'result';
          this.resultTitle = title;
          this.resultMeta = `时间：${record.timeStr} | ${record.summary} | 用时：${record.duration}`;
          this.isHistoryReview = true;
      } else {
          this.mode = record.mode;
          this.results = record.detail || [];
          this.trainLog = [];
          this.viewState = 'result';
          this.resultTitle = title;
          this.resultMeta = `时间：${record.timeStr} | ${record.summary} | 用时：${record.duration}`;
          this.isHistoryReview = true;
      }
    },

    backToHistory(){
      this.viewState = 'history';
    },

    closeHistory(){
      this.viewState = 'home';
    },

    clearHistory(){
      if(confirm('确定要清空所有历史记录吗？')){
        localStorage.removeItem('calc_history');
        this.historyList = [];
      }
    }
  }
}
</script>

<style scoped>
/* 全局样式模拟手机 */
.page {
  min-height: 100vh;
  background: #93d5dc;
  color: #0b2224;
  display: flex;
  flex-direction: column;
  max-width: 480px; /* 限制最大宽度，在电脑上居中显示 */
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}

/* 简易 Toast */
.toast-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; justify-content: center; align-items: center; z-index: 999;
  pointer-events: none;
}
.toast-content {
  background: rgba(0,0,0,0.7); color: #fff; padding: 10px 20px;
  border-radius: 5px; font-size: 14px;
}

/* 布局类 */
.wrap { padding: 18px 14px 20px; box-sizing: border-box; }
.homeWrap { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.full-height { flex: 1; display: flex; flex-direction: column; height: 100vh; }
.full-flex { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-bottom: 20px; }

/* 字体和卡片 */
.title { text-align: center; font-size: 36px; font-weight: 900; margin: 5px 0 4px; }
.subtitle { text-align: center; font-size: 13px; color: rgba(11,34,36,.78); margin-bottom: 12px; }
.card { 
  background: rgba(255,255,255,.22); 
  border: 1px solid rgba(255,255,255,.25); 
  border-radius: 14px; 
  padding: 13px; 
  box-shadow: 0 10px 20px rgba(0,0,0,.16); 
  backdrop-filter: blur(12px); 
}

/* 分组标签 */
.rowLabel { font-size: 12px; font-weight: 900; color: #0d6b3f; margin: 9px 0 4px 4px; opacity: 0.8; }

/* 模式选择 */
.modeRow { display: flex; gap: 6px; margin-bottom: 6px; }
.modeItem { 
  flex: 1; padding: 11px 4px; border-radius: 12px; 
  background: rgba(255,255,255,0.18); 
  border: 1px solid rgba(255,255,255,0.22); 
  text-align: center; box-sizing: border-box; transition: all 0.2s; 
  cursor: pointer;
}
.modeItem.active { border-color: #0d6b3f; background: rgba(13,107,63,0.15); }
.modeTitle { display: block; font-size: 15px; font-weight: 900; }

/* 按钮 */
button { border: none; outline: none; cursor: pointer; }
.btnPrimary { 
  width: 100%; height: 48px; line-height: 48px; 
  border-radius: 12px; background: #0d6b3f; color: #fff; 
  font-size: 22px; font-weight: 900; 
}
.btnGhost { 
  margin-top: 9px; width: 100%; height: 45px; line-height: 45px; 
  border-radius: 12px; background: rgba(255,255,255,0.20); 
  border: 1px solid rgba(255,255,255,0.25); color: #0b2224; 
  font-size: 19px; font-weight: 900; 
}

/* 游戏界面 */
.gameRoot { min-height: 100vh; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; gap: 9px; margin-bottom: 9px; }
.btnBack { 
  width: 88px; height: 48px; line-height: 48px; border-radius: 11px; 
  background: rgba(255,255,255,.18); border: 1px solid rgba(11,34,36,.35); 
  font-weight: 900; font-size: 18px; margin: 0; 
}
.topStats { flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 9px; font-weight: 900; font-size: 15px; }
.gameMain { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.qCard { text-align: center; }
.qText { font-size: 52px; font-weight: 900; margin-top: 3px; }
.qNote { margin-top: 4px; font-size: 13px; color: rgba(11,34,36,.75); }
.ansBox { 
  margin-top: 10px; padding: 10px; border-radius: 11px; 
  border: 1px solid rgba(11,34,36,.22); background: rgba(255,255,255,.12); 
  font-size: 22px; font-weight: 900; min-height: 22px;
}
.keypad { border-radius: 15px; padding: 9px; margin-top: 20px; }
.fnRow { display: flex; gap: 9px; margin-bottom: 9px; }
.kFn { 
  flex: 1; height: 53px; line-height: 53px; border-radius: 11px; 
  background: rgba(255,255,255,.18); border: 1px solid rgba(11,34,36,.25); 
  font-size: 20px; font-weight: 900; margin: 0; 
}
.kFn.danger { background: rgba(255,80,80,.18); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.k { 
  width: 100%; height: 60px; line-height: 60px; border-radius: 11px; 
  background: #93d5dc; border: 1px solid rgba(11,34,36,.25); 
  font-size: 30px; font-weight: 900; margin: 0; 
}
.k.wide { grid-column: 1 / 2; }
.k.wide2 { grid-column: 2 / 4; }
.k.confirm { background: rgba(0,180,120,.22); font-size: 28px; }

/* 结果列表 */
.resultScroll { width: 100%; flex: 1; overflow-y: auto; }
.row { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 12px 0; border-bottom: 1px solid rgba(11,34,36,.10); 
  font-weight: 900; white-space: nowrap; 
}
.rowLeft { flex: 1; overflow: hidden; text-overflow: ellipsis; padding-right: 5px; }
.rowRight { flex-shrink: 0; display: flex; align-items: center; text-align: right; justify-content: flex-end; }
</style>