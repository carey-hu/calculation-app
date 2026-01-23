<template>
  <div class="page">
    <div class="mesh-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div v-if="toast.show" class="toast-mask">
      <div class="toast-content">{{ toast.title }}</div>
    </div>

    <div v-if="viewState==='home'" class="wrap homeWrap">
      <div class="header-area">
        <div class="title">计算助手</div>
        <div class="subtitle">专项练习：进位加、退位减、大九九除法</div>
      </div>

      <div class="card glass-panel">
        <template v-for="(group, groupKey) in modeGroups" :key="groupKey">
          <div class="rowLabel" v-if="group.label">{{ group.label }}</div>
          
          <div v-if="groupKey === 'divSelect'" style="margin-bottom: 10px;">
             <button class="btnGhost glass-btn" style="margin-top:0; height:45px; line-height:45px; font-size:16px;" @click="toSelectDivisor">
              进入除数选择模式
            </button>
          </div>

          <div class="modeRow" v-else>
            <div 
              v-for="modeKey in group.modes" 
              :key="modeKey"
              :class="['modeItem', currentModeKey === modeKey ? 'active' : '']" 
              @click="setMode(modeKey)"
            >
              <span class="modeTitle">{{ getModeConfig(modeKey).name }}</span>
            </div>
          </div>
        </template>
        
        <div class="rowLabel">空间思维专项</div>
        <div class="modeRow">
           <div class="modeItem" style="flex: 1 0 100%; background: rgba(88, 86, 214, 0.1); border-color: rgba(88, 86, 214, 0.2);" @click="startCubicMode">
              <span class="modeTitle" style="color: #5856d6;">🧊 立体拼合 / 积木训练</span>
           </div>
        </div>

        <button class="btnPrimary glass-primary main-action-btn homeStartBtn" @click="startGame">开始练习</button>
        <button class="btnHistory glass-btn main-action-btn" @click="openHistory">历史记录</button>
      </div>
    </div>

    <div v-if="viewState==='selectDivisor'" class="wrap homeWrap">
      <div class="header-area">
        <div class="title">选择除数</div>
        <div class="subtitle">点击下方数字开始练习商首位</div>
      </div>
      <div class="card glass-panel">
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <button v-for="item in divisorList" :key="item" 
                  class="k glass-key" style="font-size:20px; height:50px; line-height:50px;" 
                  @click="selectDivisorAndStart(item)">{{item}}</button>
        </div>
        <button class="btnGhost glass-btn main-action-btn" style="margin-top: 20px;" @click="goHome">返回主页</button>
      </div>
    </div>

    <div v-if="viewState==='game'" class="wrap gameRoot">
      <div class="topbar safe-top">
        <button class="btnBack glass-btn" @click="goHome">返回</button>
        <div class="topStats">
          <div class="stat glass-pill">{{progressText}}</div>
          <div class="stat glass-pill timer">⏱ {{totalText}}</div>
        </div>
      </div>
      
      <div class="gameMain">
        <div class="card qCard glass-panel">
          <div :class="['qText', isSmallFont ? 'qText-small' : '']">{{qText}}</div>
          
          <div class="qNote">{{activeConfig.hintNote || activeConfig.hint || '精确到整数'}}</div>
          <div class="ansBox glass-input">答案：{{input ? input : '—'}}</div>
          <div class="hint">{{uiHint}}</div>
        </div>
      </div>
      
      <div class="keypad card glass-panel">
        <div class="fnRow">
          <button class="kFn style-skip" @click="leftAction">{{leftText}}</button>
          <button class="kFn style-clear" @click="clearInput">清空</button>
          <button class="kFn style-del" @click="backspace">退格</button>
        </div>
        <div class="grid">
          <button v-for="item in [1,2,3,4,5,6,7,8,9]" :key="item" class="k glass-key" @click="pressDigit(item)">{{item}}</button>
          <button class="k wide glass-key" @click="pressDigit(0)">0</button>
          <button class="k confirm wide2 glass-key-confirm" @click="confirmAnswer">确认</button>
        </div>
      </div>
    </div>

    <div v-if="viewState==='cubic'" class="wrap full-height" style="padding:0; overflow:hidden;">
      <div id="three-container" style="width:100%; height:100%; display:block; outline:none; touch-action: none;"></div>

      <div class="cubic-ui safe-top">
        <div class="glass-panel" style="padding: 8px 12px; display: flex; flex-direction: column; gap: 8px; border-radius: 24px; max-width: 95%;">
          
          <div style="display:flex; gap: 8px; align-items:center; justify-content: space-between; width: 100%;">
            <button class="btnBack glass-btn small-btn" @click="quitCubicMode">退出</button>
            
            <div class="divider"></div>
            
            <div style="display:flex; gap:5px; flex-wrap:wrap; justify-content:center;">
              <div 
                v-for="c in colors" 
                :key="c" 
                :style="{backgroundColor: c, border: c==='#ffffff' ? '1px solid #ccc' : '2px solid rgba(255,255,255,0.5)'}"
                :class="['color-dot', selectedColor === c && !isDeleteMode ? 'active' : '']"
                @click="switchColor(c)"
              ></div>
            </div>

            <div class="divider"></div>

            <div style="display:flex; gap: 5px;">
              <button :class="['btnIcon', isDeleteMode ? 'active' : '']" @click="isDeleteMode=true">🗑️</button>
              <button class="btnIcon" @click="clearCubes">🔄</button>
            </div>
          </div>

          <div style="display:flex; gap: 6px; justify-content: center; width:100%; padding-top:4px; border-top:1px solid rgba(0,0,0,0.05);">
            <button class="view-btn" @click="setCameraView('front')">正视</button>
            <button class="view-btn" @click="setCameraView('left')">左视</button>
            <button class="view-btn" @click="setCameraView('top')">俯视</button>
            <button class="view-btn" @click="setCameraView('iso')">复位</button>
            <button class="view-btn small-text" @click="setCameraView('right')">右</button>
            <button class="view-btn small-text" @click="setCameraView('back')">后</button>
          </div>

        </div>
        <div class="tip-toast">点击地面放置，点击方块叠加</div>
      </div>
    </div>

    <div v-if="viewState==='result'" class="wrap full-height">
      <div class="header-area safe-header">
        <div class="title">{{resultTitle}}</div>
        <div class="subtitle">{{resultMeta}}</div>
      </div>
      
      <div class="card full-flex glass-panel">
        <div class="resultScroll">
          <template v-if="currentModeKey==='train'">
            <div v-for="(item, index) in trainLog" :key="index" class="row">
              <span class="rowLeft">{{index+1}}. {{item.q}}</span>
              <span class="rowRight">
                <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff3b30' : 'inherit' }">{{item.usedStr}}</span> 
                / 错{{item.wrong}}{{item.skipped?'(跳)':''}}
              </span>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, index) in results" :key="index" class="row">
              <span class="rowLeft">{{index+1}}. {{item.q}} = {{item.yourAns}}</span>
              <span class="rowRight">
                 <span style="margin-right:4px; font-size:13px; color:#666;">{{item.usedStr}}</span>
                 <span>{{item.ok ? '✅' : '❌'}}</span>
                 <span v-if="!item.ok" style="color:#ff3b30; font-size:13px; margin-left:2px; font-weight:700;">({{item.realAns}})</span>
              </span>
            </div>
          </template>
        </div>
        <div style="margin-top: 15px;">
          <div v-if="isHistoryReview">
            <button class="btnPrimary glass-primary main-action-btn" @click="backToHistory">返回列表</button>
          </div>
          <div v-else>
            <button class="btnPrimary glass-primary main-action-btn" @click="goHome">返回主页</button>
            <button class="btnGhost glass-btn main-action-btn" @click="startGame" style="margin-top:10px;">再来一局</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewState==='history'" class="wrap full-height">
      <div class="header-area safe-header">
        <div class="title">历史记录</div>
        <div class="subtitle">仅保留最近5000条训练数据</div>
      </div>
      
      <div class="card full-flex glass-panel">
        <div v-if="showChart" class="chart-container glass-inner">
           <div class="chart-tabs">
             <div 
               v-for="m in availableModes" 
               :key="m"
               :class="['chart-tab-item', chartTab === m ? 'active' : '']"
               @click="switchChartTab(m)"
             >
               {{ m }}
             </div>
           </div>
           <div id="accChart" style="width: 100%; height: 220px;"></div>
           <button class="btnGhost small" style="margin-top:5px; font-size:13px;" @click="closeChart">收起图表</button>
        </div>
        <div v-else>
           <button class="btnGhost glass-btn" style="height:44px; line-height:44px; font-size:16px; margin-bottom:15px; color:#007aff;" @click="initChart">
             📊 按模块分析趋势
           </button>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding:0 8px; font-weight:700; color:#8e8e93; font-size:13px;">
           <span>时间 / 模式</span>
           <span>成绩 / 耗时</span>
        </div>
        
        <div class="resultScroll">
          <div v-if="historyList.length === 0" style="text-align:center; padding: 20px; color:rgba(0,0,0,0.4);">
            暂无记录，快去练习吧！
          </div>
          <div v-else>
            <div v-for="(item, index) in historyList" :key="item.ts" class="row hover-row" @click="viewHistoryDetail(index)" style="cursor:pointer;">
              <div class="rowLeft" style="display:flex; flex-direction:column;">
                <span style="font-size:12px; color:#8e8e93;">{{item.timeStr}}</span>
                <span style="font-weight:700; color:#1d1d1f; font-size:15px;">{{item.modeName}}</span>
              </div>
              <div class="rowRight" style="display:flex; flex-direction:column; align-items:flex-end;">
                <span style="font-size:16px; color:#007aff; font-weight:800;">{{item.summary}}</span>
                <span style="font-size:12px; color:#8e8e93;">{{item.duration}} > </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 15px; display:flex; flex-direction: column; gap:10px;">
          <button 
            v-if="historyList.length > 1000" 
            class="btnGhost glass-btn" 
            style="margin:0; height: 40px; font-size: 16px; color: #ff3b30; background: rgba(255,59,48,0.08); border-color: rgba(255,59,48,0.2);" 
            @click="clearOldest"
          >
            🗑️ 清理最早的 1000 条
          </button>

          <div style="display:flex; gap:10px;">
            <button class="btnDanger glass-btn main-action-btn" style="margin:0; flex:1;" @click="clearHistory">清空全部</button>
            <button class="btnPrimary glass-primary main-action-btn" style="margin:0; flex:1;" @click="closeHistory">返回主页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// =================================================================
// 核心逻辑层 (保持不变)
// =================================================================

const shuffle = (arr) => {
  for(let i=arr.length-1;i>0;i--){ 
    const j = Math.floor(Math.random()*(i+1)); 
    [arr[i], arr[j]] = [arr[j], arr[i]]; 
  } 
  return arr; 
};

const buildBasePool = () => {
  const arr = []; 
  for(let d=11; d<=19; d++){ 
    for(let q=1; q<=9; q++){ 
      arr.push({ dividend: d*q, divisor: d, ans: q, symbol: '÷' }); 
    } 
  } 
  return arr;
};

const GAME_MODES = {
  'train': { name: '训练', title: '基础训练完成！', hintNote: '精确到整数', gen: () => shuffle(buildBasePool()) },
  'speed': { name: '竞速', title: '竞速完成！', hintNote: '精确到整数', gen: () => shuffle(buildBasePool()).slice(0, 10) },
  'first': { name: '首位(随机)', title: '商首位完成！', hintNote: '目标：输入商的第一位数字', gen: (n) => { const pool=[]; for(let i=0;i<n;i++){ const dr=11+Math.floor(Math.random()*9); const dd=100+Math.floor(Math.random()*900); const fd=parseInt(String(Math.floor(dd/dr))[0],10); pool.push({dividend:dd,divisor:dr,ans:fd,symbol:'÷'}); } return pool; } },
  'firstSpec': { name: '商首位专项', title: '商首位专项完成！', gen: (n, ex) => { const d=ex.divisor||12; const pool=[]; for(let i=0;i<n;i++){ const dd=Math.floor(Math.random()*(999-d+1))+d; const fq=Math.floor(dd/d); const fd=parseInt(String(fq)[0],10); pool.push({dividend:dd,divisor:d,ans:fd,symbol:'÷'}); } return pool; } },
  'plus': { name: '进位加', title: '一位数进位加完成！', hintNote: '只填个位尾数', gen: (n) => { const p=[]; for(let i=0;i<n;i++){ let a,b; do{a=Math.floor(Math.random()*9)+1;b=Math.floor(Math.random()*9)+1;}while(a+b<10); p.push({dividend:a,divisor:b,ans:(a+b)%10,symbol:'+'});} return p;} },
  'minus': { name: '退位减', title: '一位数退位减完成！', hintNote: '只填个位尾数', gen: (n) => { const p=[]; for(let i=0;i<n;i++){ let a,b; do{a=Math.floor(Math.random()*9)+1;b=Math.floor(Math.random()*9)+1;}while(a>=b); p.push({dividend:a,divisor:b,ans:(10+a-b),symbol:'-'});} return p;} },
  'doublePlus': { name: '双进位加', title: '双进位加完成！', hintNote: '个位十位均需进位', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ let a,b,a1,a2,b1,b2; do{a=Math.floor(Math.random()*90)+10;b=Math.floor(Math.random()*90)+10;a1=Math.floor(a/10);a2=a%10;b1=Math.floor(b/10);b2=b%10;}while(a2+b2<10||a1+b1<10); p.push({dividend:a,divisor:b,ans:a+b,symbol:'+'});} return p;} },
  'doubleMinus': { name: '双退位减', title: '双退位减完成！', hintNote: '个位退，十位不退', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ let a,b,a1,a2,b1,b2; do{a=Math.floor(Math.random()*90)+10;b=Math.floor(Math.random()*90)+10;a1=Math.floor(a/10);a2=a%10;b1=Math.floor(b/10);b2=b%10;}while(!(a2<b2&&a1-1>=b1)); p.push({dividend:a,divisor:b,ans:a-b,symbol:'-'});} return p;} },
  'fourSum': { name: '四数相加', title: '四数相加完成！', hintNote: '计算准确和', isSmallFont:true, gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const a=Math.floor(Math.random()*90)+10;const b=Math.floor(Math.random()*90)+10;const c=Math.floor(Math.random()*90)+10;const d=Math.floor(Math.random()*90)+10; p.push({dividend:`${a}+${b}+${c}`,divisor:d,ans:a+b+c+d,symbol:'+'});} return p;} },
  'triplePlus': { name: '三进位加', title: '三进位加完成！', hintNote: '个位十位百位均需进位', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ let a,b,a1,a2,a3,b1,b2,b3; do{a=Math.floor(Math.random()*900)+100;b=Math.floor(Math.random()*900)+100;a1=Math.floor(a/100);a2=Math.floor((a%100)/10);a3=a%10;b1=Math.floor(b/100);b2=Math.floor((b%100)/10);b3=b%10;}while(a3+b3<10||a2+b2<10||a1+b1<10); p.push({dividend:a,divisor:b,ans:a+b,symbol:'+'});} return p;} },
  'tripleMinus': { name: '三退位减', title: '三退位减完成！', hintNote: '个十退，百不退', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ let a,b,a1,a2,a3,b1,b2,b3; do{a=Math.floor(Math.random()*900)+100;b=Math.floor(Math.random()*900)+100;a1=Math.floor(a/100);a2=Math.floor((a%100)/10);a3=a%10;b1=Math.floor(b/100);b2=Math.floor((b%100)/10);b3=b%10;}while(!(a3<b3&&(a2-1)<b2&&(a1-1)>=b1)); p.push({dividend:a,divisor:b,ans:a-b,symbol:'-'});} return p;} },
  'tripleAnyPlus': { name: '任意加', title: '任意三数加完成！', hintNote: '任意三位数加法', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const a=Math.floor(Math.random()*900)+100;const b=Math.floor(Math.random()*900)+100; p.push({dividend:a,divisor:b,ans:a+b,symbol:'+'});} return p;} },
  'tripleAnyMinus': { name: '任意减', title: '任意三数减完成！', hintNote: '任意三位数减法', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ let a=Math.floor(Math.random()*900)+100;let b=Math.floor(Math.random()*900)+100;if(a<b)[a,b]=[b,a]; p.push({dividend:a,divisor:b,ans:a-b,symbol:'-'});} return p;} },
  'tripleMix': { name: '加减混合', title: '三数加减混合完成！', hintNote: '三数加减混合 (结果为正)', isSmallFont:true, gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ let a,b,c,op1,op2,ans; do{a=Math.floor(Math.random()*900)+100;b=Math.floor(Math.random()*900)+100;c=Math.floor(Math.random()*900)+100;op1=Math.random()>0.5?'+':'-';op2=Math.random()>0.5?'+':'-';let step1=(op1==='+')?(a+b):(a-b);ans=(op2==='+')?(step1+c):(step1-c);}while(ans<0); p.push({dividend:`${a}${op1}${b}`,divisor:c,ans:ans,symbol:op2});} return p;} },
  'tripleMult': { name: '三乘一', title: '三乘一完成！', hintNote: '计算准确积', gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const a=Math.floor(Math.random()*900)+100;const b=Math.floor(Math.random()*8)+2; p.push({dividend:a,divisor:b,ans:a*b,symbol:'×'});} return p;} },
  'tripleDiv': { name: '三除一', title: '三除一完成！', hintNote: '若为小数，填相邻整数均对', check: (v, t) => { if(Number.isInteger(t)){ return {ok:v===t,display:t}; }else{ const f=Math.floor(t),c=Math.ceil(t); return {ok:(v===f||v===c),display:`${f}或${c} (${t.toFixed(2)})`}; } }, gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const a=Math.floor(Math.random()*900)+100;const b=Math.floor(Math.random()*8)+2; p.push({dividend:a,divisor:b,ans:a/b,symbol:'÷'});} return p;} },
  'divSpecA': { name: '反向放缩', title: '反向放缩完成！', hintNote: '除数111-199 (误差3%内)', check:(v,t)=>{const r=Math.abs(v-t)/t; return {ok:r<=0.03,display:Math.round(t)};}, gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const dr=Math.floor(Math.random()*(199-111+1))+111;const dd=Math.floor(Math.random()*(99999-10000+1))+10000; p.push({dividend:dd,divisor:dr,ans:dd/dr,symbol:'÷'});} return p;} },
  'divSpecB': { name: '平移法', title: '平移法完成！', hintNote: '商90-111 (误差3%内)', check:(v,t)=>{const r=Math.abs(v-t)/t; return {ok:r<=0.03,display:Math.round(t)};}, gen: (n)=>{ const p=[]; let c=0; while(c<n){ const dr=Math.floor(Math.random()*900)+100;const tq=Math.floor(Math.random()*(111-90+1))+90;const dd=dr*tq+Math.floor(Math.random()*dr); if(dd>=10000&&dd<=99999){ p.push({dividend:dd,divisor:dr,ans:dd/dr,symbol:'÷'}); c++;} } return p;} }
};

const MODE_GROUPS = {
  basic: { label: '大九九/除法', modes: ['train', 'speed', 'first'] },
  divSelect: { label: '商首位专项', modes: [] }, 
  single: { label: '一位数专项 (仅填尾数)', modes: ['plus', 'minus'] },
  double: { label: '两位数专项 (完整答案)', modes: ['doublePlus', 'doubleMinus', 'fourSum'] },
  triple: { label: '三位数专项 (完整答案)', modes: ['triplePlus', 'tripleMinus', 'tripleAnyPlus', 'tripleAnyMinus', 'tripleMix', 'tripleMult', 'tripleDiv'] },
  spec: { label: '五除三专项 (允许3%误差)', modes: ['divSpecA', 'divSpecB'] }
};

export default {
  data() {
    return {
      viewState: 'home', currentModeKey: 'train', selectedDivisor: 0,
      pool: [], idx: 0, current: null, input: '', uiHint: 'Ready?', totalText: '0:00.0', progressText: '1/81', qText: '—', leftText: '跳过', 
      totalStartTs: 0, qStartTs: 0, timer: null, trainWrong: 0, trainSkip: 0, curWrongTries: 0, trainLog: [], results: [], 
      historyList: [], showChart: false, chartInstance: null, chartTab: '', availableModes: [], isHistoryReview: false,
      toast: { show: false, title: '' },
      modeGroups: MODE_GROUPS, divisorList: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
      
      // 3D 模式状态
      isDeleteMode: false,
      // 修改：增加了黑色 #000000 和 白色 #ffffff
      colors: ['#007aff', '#ff3b30', '#34c759', '#ff9500', '#000000', '#ffffff'], 
      selectedColor: '#007aff'
      // 注意：threeApp 已移出 data，避免 Vue 代理导致的性能和交互 Bug
    }
  },
  computed: {
    activeConfig() {
      if(this.currentModeKey === 'firstSpec') {
        return { name: `商首位(除${this.selectedDivisor})`, title: `商首位(除${this.selectedDivisor})完成！`, hintNote: `除数${this.selectedDivisor}专项：只填商首位`, gen: GAME_MODES['firstSpec'].gen };
      }
      return GAME_MODES[this.currentModeKey] || {};
    },
    resultTitle() { return this.activeConfig.title || '训练完成！'; },
    resultMeta() {
       const totalSec = this.totalSec || 0;
       if(this.currentModeKey === 'train') {
         return `用时：${totalSec.toFixed(1)}s｜错误：${this.trainWrong}｜跳过：${this.trainSkip}`;
       } else {
         const correctCount = this.results.filter(x=>x.ok).length;
         const totalCount = this.results.length;
         return `正确：${correctCount}/${totalCount}｜总用时：${totalSec.toFixed(1)}s`;
       }
    },
    isSmallFont() { return this.activeConfig.isSmallFont || (this.currentModeKey === 'fourSum' || this.currentModeKey === 'tripleMix'); }
  },
  mounted() {
    const history = localStorage.getItem('calc_history');
    if(history) { try { this.historyList = JSON.parse(history); } catch(e){ console.error(e) } }
    window.addEventListener('resize', () => { if(this.chartInstance) this.chartInstance.resize(); });
  },
  beforeUnmount() {
    this.cleanup3D(); 
  },
  created() {
    // 关键修复：将 Three.js 对象放在这里，不放入 data()，避免 Vue 响应式代理造成的性能问题和 Bug
    this.threeApp = { scene: null, camera: null, renderer: null, controls: null, raycaster: null, pointer: null, objects: [], animationId: null };
  },
  methods: {
    now() { return Date.now(); },
    getModeConfig(key) { return GAME_MODES[key] || { name: key }; },
    setMode(mode){ this.currentModeKey = mode; },
    toSelectDivisor(){ this.viewState = 'selectDivisor'; },
    selectDivisorAndStart(d){ this.currentModeKey = 'firstSpec'; this.selectedDivisor = d; this.startGame(); },
    showToast(title) { this.toast.title = title; this.toast.show = true; setTimeout(() => { this.toast.show = false; }, 1500); },
    
    // --- 游戏核心逻辑 (保持不变) ---
    startGame(){
      const config = this.activeConfig;
      if (!config.gen) return;
      this.pool = config.gen(10, { divisor: this.selectedDivisor });
      if(this.timer) clearInterval(this.timer);
      const totalStartTs = this.now();
      this.viewState = 'game'; this.idx = 0; this.input = ''; this.uiHint = '请输入答案'; this.leftText = (this.currentModeKey === 'train' ? '跳过' : '重开');
      this.totalStartTs = totalStartTs; this.qStartTs = 0; this.trainWrong = 0; this.trainSkip = 0; this.curWrongTries = 0; this.trainLog = []; this.results = []; this.isHistoryReview = false;
      this.$nextTick(() => { this._nextQuestion(); this.timer = setInterval(()=> this._tick(), 100); });
    },
    _tick(){ const diff = this.now() - this.totalStartTs; this.totalText = this.msToMMSS(diff); },
    _setQuestion(q, shownIdx){ this.current = q; this.qStartTs = this.now(); this.input = ''; this.curWrongTries = 0; this.qText = `${q.dividend}${q.symbol}${q.divisor}`; this.progressText = `${shownIdx}/${this.pool.length}`; },
    _nextQuestion(){ const { idx, pool } = this; if(idx >= pool.length){ this._finish(); return; } this._setQuestion(pool[idx], idx + 1); this.idx = idx + 1; },
    pressDigit(d){ let input = this.input || ''; if(input.length >= 6) return; input += String(d); this.input = input; },
    clearInput(){ this.input = ''; },
    backspace(){ this.input = (this.input || '').slice(0, -1); },
    leftAction(){ if(this.currentModeKey !== 'train'){ this.startGame(); return; } const cur = this.current; const used = (this.now() - this.qStartTs)/1000; const log = this.trainLog.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, usedStr: used.toFixed(1) + 's', wrong: this.curWrongTries, skipped: true }]); this.trainSkip++; this.trainLog = log; this._nextQuestion(); },
    confirmAnswer(){
      const { current: cur, input, currentModeKey: mode, activeConfig } = this; if(!input) return; const n = parseFloat(input); const used = (this.now() - this.qStartTs)/1000;
      let correct = false; let realAnsDisplay = cur.ans;
      if (activeConfig.check) { const checkResult = activeConfig.check(n, cur.ans); correct = checkResult.ok; realAnsDisplay = checkResult.display; } else { correct = (parseInt(input) === cur.ans); }
      if(mode === 'train'){ if(correct){ const log = this.trainLog.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, usedStr: used.toFixed(1) + 's', wrong: this.curWrongTries, skipped: false }]); this.trainLog = log; this.showToast('正确'); this._nextQuestion(); } else { this.trainWrong++; this.curWrongTries++; this.input = ''; this.uiHint = `错误！答案是：${realAnsDisplay}`; } return; }
      const results = this.results.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, ok: correct, yourAns: input, realAns: realAnsDisplay, usedStr: used.toFixed(1) + 's' }]); this.results = results; this.showToast(correct ? '正确' : `错误(${realAnsDisplay})`); this._nextQuestion();
    },
    _finish(){ if(this.timer) clearInterval(this.timer); this.totalSec = (this.now() - this.totalStartTs)/1000; let recordSummary = ''; let detailLog = []; if(this.currentModeKey === 'train'){ recordSummary = `错${this.trainWrong}/跳${this.trainSkip}`; detailLog = this.trainLog; } else { const correctCount = this.results.filter(x=>x.ok).length; const totalCount = this.results.length; recordSummary = `正确率 ${Math.round(correctCount/totalCount*100)}%`; detailLog = this.results; } this.viewState = 'result'; this.isHistoryReview = false; this._saveRecord({ totalSec: this.totalSec }, recordSummary, detailLog); },
    _saveRecord(meta, summary, detailLog){ const modeName = (this.currentModeKey === 'firstSpec') ? `商首位(除${this.selectedDivisor})` : (GAME_MODES[this.currentModeKey]?.name || '未知模式'); const record = { ts: this.now(), timeStr: this.formatTime(this.now()), mode: this.currentModeKey, modeName: modeName, duration: meta.totalSec.toFixed(1) + 's', summary: summary, detail: detailLog }; let history = this.historyList; history.unshift(record); if(history.length > 5000) history = history.slice(0, 5000); this.historyList = history; localStorage.setItem('calc_history', JSON.stringify(history)); },
    msToMMSS(ms){ const totalSec = ms / 1000; const m = Math.floor(totalSec / 60); const s = (totalSec % 60).toFixed(1); return `${m}:${s < 10 ? '0' + s : s}`; },
    formatTime(ts) { const date = new Date(ts); const m = date.getMonth() + 1; const d = date.getDate(); const h = date.getHours(); const min = date.getMinutes(); const pad = n => n < 10 ? '0' + n : n; return `${m}/${d} ${pad(h)}:${pad(min)}`; },
    goHome(){ if(this.timer) clearInterval(this.timer); this.viewState = 'home'; },
    openHistory(){ this.viewState = 'history'; if(this.showChart) this.$nextTick(() => this.renderChart(this.chartTab)); },
    viewHistoryDetail(index){ const record = this.historyList[index]; if(!record) return; this.currentModeKey = record.mode; this.totalSec = parseFloat(record.duration.replace('s','')); if(record.mode === 'train'){ this.trainLog = record.detail || []; this.results = []; } else { this.results = record.detail || []; this.trainLog = []; } this.viewState = 'result'; this.isHistoryReview = true; },
    backToHistory(){ this.viewState = 'history'; if(this.showChart) this.$nextTick(() => this.renderChart(this.chartTab)); },
    closeHistory(){ this.viewState = 'home'; },
    clearOldest() { if(confirm(`当前共有 ${this.historyList.length} 条记录。\n确定要清除【最早的 1000 条】数据吗？`)){ const keepCount = this.historyList.length - 1000; this.historyList = this.historyList.slice(0, keepCount); localStorage.setItem('calc_history', JSON.stringify(this.historyList)); this.showToast('清理成功'); if(this.showChart) this.initChart(); } },
    clearHistory(){ if(confirm('【严重警告】\n确定要清空【所有】历史记录吗？\n此操作不可恢复！')){ localStorage.removeItem('calc_history'); this.historyList = []; this.showToast('所有记录已清空'); } },
    initChart() { this.showChart = true; const modeSet = new Set(this.historyList.map(item => item.modeName)); this.availableModes = Array.from(modeSet); if(this.historyList.length > 0 && !this.chartTab) { this.chartTab = this.historyList[0].modeName; } else if (this.availableModes.length > 0 && !this.chartTab) { this.chartTab = this.availableModes[0]; } this.$nextTick(() => { this.renderChart(this.chartTab); }); },
    switchChartTab(modeName) { this.chartTab = modeName; this.renderChart(modeName); },
    renderChart(targetModeName) { const chartDom = document.getElementById('accChart'); if(!chartDom) return; if(this.chartInstance) this.chartInstance.dispose(); this.chartInstance = echarts.init(chartDom); const allData = JSON.parse(JSON.stringify(this.historyList)).reverse(); const filteredData = allData.filter(item => item.modeName === targetModeName); const dateList = []; const accuracyList = []; const timeList = []; filteredData.forEach(item => { let accuracy = 0; if(item.mode === 'train') { let wrong = 0; if(item.detail && item.detail.length > 0) { wrong = item.detail.filter(x => x.wrong > 0).length; } else { const match = item.summary.match(/错(\d+)/); if(match) wrong = parseInt(match[1]); } accuracy = ((81 - wrong) / 81) * 100; } else { if(item.detail && item.detail.length > 0) { const correctCount = item.detail.filter(x => x.ok).length; accuracy = (correctCount / item.detail.length) * 100; } else { const match = item.summary.match(/(\d+)%/); if(match) accuracy = parseInt(match[1]); } } let duration = 0; if(item.duration) { duration = parseFloat(item.duration.replace('s', '')); } dateList.push(item.timeStr); accuracyList.push(accuracy.toFixed(0)); timeList.push(duration.toFixed(1)); }); if(dateList.length === 0) { this.chartInstance.setOption({ title: { text: '该模式暂无数据', left: 'center', top: 'center', textStyle: { color: '#999' } } }); return; } const option = { grid: { top: 30, bottom: 20, left: 30, right: 30, containLabel: true }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: dateList, axisLabel: { color: '#333', fontSize: 10, interval: 'auto', hideOverlap: true } }, yAxis: [ { type: 'value', min: 0, max: 100, position: 'left', splitLine: { show:true, lineStyle: { type: 'dashed', opacity: 0.1 } }, axisLabel: {color: '#007aff', formatter: '{value}%'} }, { type: 'value', position: 'right', splitLine: { show: false }, axisLabel: {color: '#ff3b30', formatter: '{value}s'} } ], series: [ { name: '正确率', type: 'line', yAxisIndex: 0, smooth: true, lineStyle: { color: '#007aff', width: 3 }, itemStyle: { color: '#007aff' }, data: accuracyList }, { name: '耗时', type: 'line', yAxisIndex: 1, smooth: true, lineStyle: { color: '#ff3b30', width: 2, type: 'dashed' }, itemStyle: { color: '#ff3b30' }, data: timeList } ] }; this.chartInstance.setOption(option); },
    closeChart() { this.showChart = false; if(this.chartInstance) { this.chartInstance.dispose(); this.chartInstance = null; } },

    // =================================================================
    // 3D 模块逻辑 (增强版)
    // =================================================================
    startCubicMode() { this.viewState = 'cubic'; this.$nextTick(() => { this.initThree(); }); },
    quitCubicMode() { this.cleanup3D(); this.viewState = 'home'; },
    switchColor(c) { 
      this.selectedColor = c; 
      this.isDeleteMode = false; // 选颜色时自动退出删除模式
    },
    // 新增：设置相机视角
    setCameraView(type) {
      const { camera, controls } = this.threeApp;
      if (!camera || !controls) return;
      const d = 16; // 观察距离

      switch (type) {
        case 'front': camera.position.set(0, 0, d); break;
        case 'back': camera.position.set(0, 0, -d); break;
        case 'left': camera.position.set(-d, 0, 0); break;
        case 'right': camera.position.set(d, 0, 0); break;
        case 'top': camera.position.set(0, d, 0); break;
        case 'iso': camera.position.set(8, 8, 8); break; // 默认等轴测
      }
      
      // 重置观察中心点为原点，确保切换视角后不会看偏
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
      controls.update();
    },

    initThree() {
      const container = document.getElementById('three-container'); 
      if (!container) return;
      const width = container.clientWidth; 
      const height = container.clientHeight;

      // 1. 场景
      const scene = new THREE.Scene(); 
      scene.background = new THREE.Color('#f2f2f7'); 
      scene.fog = new THREE.Fog('#f2f2f7', 20, 50);

      // 2. 相机
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000); 
      camera.position.set(8, 8, 8); 
      camera.lookAt(0, 0, 0);

      // 3. 渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
      renderer.setSize(width, height); 
      renderer.setPixelRatio(window.devicePixelRatio); 
      container.appendChild(renderer.domElement);

      // 4. 灯光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.7); 
      dirLight.position.set(10, 20, 10); 
      scene.add(dirLight);

      // 5. 辅助网格
      const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xdddddd); 
      scene.add(gridHelper);

      // 地面 (不可见，用于点击)
      const planeGeometry = new THREE.PlaneGeometry(20, 20); 
      planeGeometry.rotateX(-Math.PI / 2);
      const planeMaterial = new THREE.MeshBasicMaterial({ 
        visible: true,      
        transparent: true, 
        opacity: 0          
      }); 
      const plane = new THREE.Mesh(planeGeometry, planeMaterial); 
      plane.name = 'ground'; 
      scene.add(plane);

      // 6. 控制器
      const controls = new OrbitControls(camera, renderer.domElement); 
      controls.enableDamping = true; 
      controls.dampingFactor = 0.05;

      // 7. 交互
      const raycaster = new THREE.Raycaster(); 
      const pointer = new THREE.Vector2();
      let downTime = 0;

      renderer.domElement.addEventListener('pointerdown', () => { downTime = Date.now(); });
      
      renderer.domElement.addEventListener('pointerup', (event) => {
        if (Date.now() - downTime < 200) {
          const rect = renderer.domElement.getBoundingClientRect(); 
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; 
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          this.handle3DClick(raycaster, pointer, scene, camera, plane);
        }
      });

      this.threeApp.scene = scene;
      this.threeApp.camera = camera;
      this.threeApp.renderer = renderer;
      this.threeApp.controls = controls;
      this.threeApp.objects = [plane]; 
      
      this.animate3D();
    },
    animate3D() { 
      const { scene, camera, renderer, controls } = this.threeApp; 
      if (!renderer) return; 
      this.threeApp.animationId = requestAnimationFrame(this.animate3D); 
      controls.update(); 
      renderer.render(scene, camera); 
    },
    handle3DClick(raycaster, pointer, scene, camera, plane) {
      raycaster.setFromCamera(pointer, camera); 
      const intersects = raycaster.intersectObjects(this.threeApp.objects, false);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        
        if (this.isDeleteMode) {
          if (intersect.object.name !== 'ground') {
             scene.remove(intersect.object);
             const idx = this.threeApp.objects.indexOf(intersect.object);
             if (idx > -1) this.threeApp.objects.splice(idx, 1);
             intersect.object.geometry.dispose();
             intersect.object.material.dispose();
          }
        } else {
          const voxelPos = new THREE.Vector3().copy(intersect.point).addScaledVector(intersect.face.normal, 0.5);
          voxelPos.divideScalar(1).floor().multiplyScalar(1).addScalar(0.5);
          
          if (voxelPos.y < 0) return;
          this.addCubeAt(scene, voxelPos);
        }
      }
    },
    addCubeAt(scene, position) {
      const geometry = new THREE.BoxGeometry(1, 1, 1); 
      
      // 优化 1：使用 polygonOffset 防止边线与面重叠（Z-fighting），让边线更清晰
      const material = new THREE.MeshLambertMaterial({ 
        color: this.selectedColor,
        polygonOffset: true,
        polygonOffsetFactor: 1, // 将面稍微向后推
        polygonOffsetUnits: 1
      }); 
      
      const cube = new THREE.Mesh(geometry, material); 
      cube.position.copy(position);
      
      // 优化 2：智能边线颜色。如果是黑色方块，用白线；否则用黑线
      const isBlackBlock = this.selectedColor === '#000000';
      const lineColor = isBlackBlock ? 0xffffff : 0x000000;

      const edges = new THREE.EdgesGeometry(geometry); 
      // 优化 3：LineBasicMaterial 在 WebGL 中宽度通常固定为 1px，
      // 但配合 polygonOffset 后会显得更“实”更黑
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: lineColor })); 
      cube.add(line);

      scene.add(cube); 
      this.threeApp.objects.push(cube);
    },
    clearCubes() { 
      const { scene, objects } = this.threeApp; 
      for (let i = objects.length - 1; i >= 0; i--) { 
        const obj = objects[i]; 
        if (obj.name !== 'ground') { 
          scene.remove(obj); 
          obj.geometry.dispose(); 
          obj.material.dispose(); 
          objects.splice(i, 1); 
        } 
      } 
    },
    cleanup3D() { 
      if (this.threeApp.animationId) { cancelAnimationFrame(this.threeApp.animationId); } 
      if (this.threeApp.renderer) { 
        this.threeApp.renderer.dispose(); 
        const container = document.getElementById('three-container'); 
        if (container) container.innerHTML = ''; 
      } 
      this.threeApp = { scene: null, camera: null, renderer: null, controls: null, objects: [] }; 
    }
  }
}
</script>

<style scoped>
.homeStartBtn{ margin-top: 14px; }
.page { height: 100vh; min-height: 100vh; background: radial-gradient(at 0% 0%, hsla(210,100%,94%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(260,100%,94%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(300,100%,94%,1) 0, transparent 50%), radial-gradient(at 0% 100%, hsla(180,100%,94%,1) 0, transparent 50%); background-color: #f2f2f7; color: #1c1c1e; display: flex; flex-direction: column; max-width: 480px; margin: 0 auto; box-shadow: 0 0 40px rgba(0,0,0,0.08); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; position: relative; overflow: hidden; }
.mesh-bg { position: absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.7; animation: float 10s infinite alternate ease-in-out; }
.orb-1 { width: 350px; height: 350px; background: #a2d2ff; top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: #e2c2ff; bottom: -50px; right: -80px; animation-delay: -3s; }
.orb-3 { width: 200px; height: 200px; background: #ffdfba; top: 40%; left: 30%; opacity:0.5; animation-delay: -6s; }
@keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(20px, 30px); } }
.toast-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; z-index: 999; pointer-events: none; }
.toast-content { background: rgba(0,0,0,0.7); backdrop-filter: blur(20px); color: #fff; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.wrap { padding: 20px 16px 24px; box-sizing: border-box; position: relative; z-index: 1; }
.homeWrap { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-top: max(60px, env(safe-area-inset-top)); padding-bottom: 40px; scrollbar-width: none; }
.homeWrap::-webkit-scrollbar { display: none; }
.full-height { flex: 1; display: flex; flex-direction: column; height: 100vh; }
.full-flex { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-bottom: 20px; }
.header-area { margin-bottom: 20px; text-align: center; flex-shrink: 0; }
.title { font-size: 34px; font-weight: 900; margin: 0 0 6px; color: #000; letter-spacing: -0.5px; }
.subtitle { font-size: 15px; color: #8e8e93; font-weight: 500; }
.glass-panel { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(50px) saturate(200%); -webkit-backdrop-filter: blur(50px) saturate(200%); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5); }
.card { border-radius: 28px; padding: 16px; }
.rowLabel { font-size: 13px; font-weight: 700; color: #007aff; margin: 16px 0 8px 6px; opacity: 0.9; letter-spacing: 0.5px; }
.modeRow { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.modeItem { flex: 1 0 30%; padding: 14px 4px; border-radius: 16px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); text-align: center; box-sizing: border-box; transition: all 0.1s; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.modeItem:active { transform: scale(0.97); }
.modeItem.active { background: #007aff; border-color: transparent; box-shadow: 0 8px 20px rgba(0,122,255,0.3); }
.modeTitle { display: block; font-size: 16px; font-weight: 700; color: #1c1c1e; }
.modeItem.active .modeTitle { color: #fff; }
button { border: none; outline: none; cursor: pointer; font-family: inherit; }
.btnPrimary { width: 100%; height: 50px; line-height: 50px; border-radius: 16px; background: linear-gradient(135deg, #34c759 0%, #28a745 100%); color: #fff; font-size: 20px; font-weight: 700; box-shadow: 0 10px 25px rgba(0,122,255,0.25); transition: transform 0.1s; }
.btnPrimary:active { transform: scale(0.98); opacity: 0.9; }
.btnGhost { width: 100%; height: 48px; line-height: 48px; border-radius: 16px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); color: #007aff; font-size: 18px; font-weight: 600; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: background 0.2s; }
.btnGhost:active { background: rgba(255,255,255,0.8); }
.btnHistory { width: 100%; height: 48px; line-height: 48px; margin-top: 9px; border-radius: 16px; background: rgba(88, 86, 214, 0.1); color: #5856d6; font-size: 20px; font-weight: 700; border: 1px solid rgba(88, 86, 214, 0.2); }
.btnHistory:active { background: rgba(88, 86, 214, 0.2); }
.btnDanger { width: 100%; height: 48px; line-height: 48px; border-radius: 16px; background: rgba(255, 59, 48, 0.1); color: #ff3b30; font-size: 20px; font-weight: 700; border: 1px solid rgba(255, 59, 48, 0.2); }
.btnDanger:active { background: rgba(255, 59, 48, 0.2); }
.main-action-btn { font-size: 20px !important; height: 54px !important; line-height: 54px !important; }
.gameRoot { min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; }
.safe-top { padding-top: max(44px, env(safe-area-inset-top)); padding-bottom: 12px; height: auto; box-sizing: content-box; display: flex; align-items: center; gap: 12px; margin-bottom: 5px; }
.safe-header { padding-top: max(44px, env(safe-area-inset-top)); margin-bottom: 20px; }
.btnBack { width: 80px; height: 44px; line-height: 44px; border-radius: 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.05); font-weight: 700; font-size: 16px; margin: 0; color: #1c1c1e; backdrop-filter: blur(10px); }
.topStats { flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; color: #333; }
.glass-pill { background: rgba(255,255,255,0.5); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.03); backdrop-filter: blur(10px); }
.gameMain { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.qCard { text-align: center; padding: 30px 20px; }
.qText { font-size: 64px; font-weight: 800; margin-top: 0; color: #1c1c1e; letter-spacing: -2px; }
.qNote { margin-top: 8px; font-size: 16px; color: #8e8e93; font-weight: 500; }
.ansBox { margin-top: 20px; padding: 15px; border-radius: 20px; background: rgba(255,255,255,0.5); font-size: 44px; font-weight: 800; min-height: 44px; color: #007aff; box-shadow: inset 0 2px 6px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03); }
.hint { margin-top: 15px; color: #8e8e93; font-size: 15px; font-weight: 600; }
.keypad { border-radius: 28px; overflow: hidden; clip-path: inset(0 0 0 0 round 28px); margin-bottom: calc( 6px + env(safe-area-inset-bottom)); }
.fnRow { display: flex; gap: 9px; margin-bottom: 9px; }
.kFn { flex: 1; height: 65px; line-height: 65px; border-radius: 14px; font-size: 20px; font-weight: 900; margin: 0; color: #fff; border: 1px solid rgba(0,0,0,0.05); backdrop-filter: blur(10px); }
.style-skip { background: #34c759; border-color: #248a3d; } 
.style-clear { background: #ff9500; border-color: #e08600; } 
.style-del { background: #ff3b30; border-color: #d63329; } 
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.k { width: 100%; height: 70px; line-height: 70px; border-radius: 14px; background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.03); font-size: 30px; font-weight: 900; margin: 0; color: #000; box-shadow: 0 4px 0 rgba(0,0,0,0.04); transition: all 0.1s; }
.k:active { transform: translateY(4px); box-shadow: none; background: #fff; }
.glass-key-confirm { background: #34c759; color: #fff; border:none; font-size: 28px; box-shadow: 0 4px 0 #248a3d; border-radius: 11px; }
.glass-key-confirm:active { background: #28a745; box-shadow: none; transform: translateY(4px); }
.k.wide { grid-column: 1 / 2; }
.k.wide2 { grid-column: 2 / 4; }
.chart-container { background: rgba(255,255,255,0.4); border-radius: 20px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.5); }
.chart-tabs { display: flex; gap: 4px; overflow-x: auto; padding: 4px; margin-bottom: 12px; background: rgba(118, 118, 128, 0.12); border-radius: 12px; scrollbar-width: none; }
.chart-tabs::-webkit-scrollbar { display: none; }
.chart-tab-item { flex-shrink: 0; font-size: 13px; padding: 6px 14px; border-radius: 8px; color: #666; cursor: pointer; font-weight: 600; border: 1px solid transparent; }
.chart-tab-item.active { background: #fff; color: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.resultScroll { width: 100%; flex: 1; overflow-y: auto; padding-right: 4px; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-weight: 600; white-space: nowrap; color: #1c1c1e; }
.hover-row:active { background: rgba(0,0,0,0.03); border-radius: 12px; }
.rowLeft { flex: 1; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
.rowRight { flex-shrink: 0; display: flex; align-items: center; text-align: right; justify-content: flex-end; }
.qText-small { font-size: 52px !important; letter-spacing: -1px !important; white-space: nowrap; margin-top: 10px; overflow: visible; }

.cubic-ui { position: absolute; top: 0; left: 0; width: 100%; padding-left: 10px; padding-right: 10px; padding-bottom: 10px; padding-top: max(60px, calc(env(safe-area-inset-top) + 10px)); box-sizing: border-box; pointer-events: none; z-index: 10; display: flex; flex-direction: column; align-items: center; }
.cubic-ui > * { pointer-events: auto; }
.small-btn { width: auto !important; height: 36px !important; line-height: 36px !important; padding: 0 16px !important; font-size: 14px !important; }
.btnIcon { background: rgba(255,255,255,0.4); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 8px 12px; font-size: 14px; font-weight: 600; color: #333; transition: all 0.2s; }
.btnIcon.active { background: #007aff; color: white; box-shadow: 0 4px 10px rgba(0,122,255,0.3); }
.divider { width: 1px; height: 20px; background: rgba(0,0,0,0.1); margin: 0 5px; }
.tip-toast { margin-top: 10px; background: rgba(0,0,0,0.6); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; backdrop-filter: blur(4px); }

/* 颜色选择小圆点 */
.color-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.color-dot:active { transform: scale(0.9); }
.color-dot.active {
  transform: scale(1.1);
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(255,255,255,0.8);
}

/* 视图切换按钮样式 */
.view-btn {
  background: rgba(255,255,255,0.3);
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  transition: background 0.2s;
}
.view-btn:active {
  background: rgba(255,255,255,0.6);
  transform: scale(0.95);
}
.small-text { font-size: 11px; padding: 4px 8px; color: #666; }
</style>
