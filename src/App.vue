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

      <div class="menu-area-fixed">
        <div class="card glass-panel full-menu-card">
          <div class="menu-scroll-container">
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
            
            <div class="rowLabel">空间思维专项 (公考行测)</div>
            <div class="modeRow">
               <div class="modeItem" style="flex: 1 0 45%; background: rgba(0,122,255,0.08); border-color: rgba(0,122,255,0.2);" @click="startCubicMode('block')">
                  <span class="modeTitle" style="color: #007aff;">🧱 立体拼合</span>
               </div>
               <div class="modeItem" style="flex: 1 0 45%; background: rgba(88,86,214,0.1); border-color: rgba(88,86,214,0.2);" @click="startCubicMode('section')">
                  <span class="modeTitle" style="color: #5856d6;">🔪 立体截面</span>
               </div>
            </div>
            <div style="height: 20px;"></div>
          </div>

          <div class="card-bottom-actions">
            <div class="separator-line"></div>
            <button class="btnPrimary main-action-btn" @click="startGame">开始练习</button>
            <button class="btnHistory main-action-btn" @click="openHistory">历史记录</button>
          </div>

        </div>
      </div>

    </div>

    <div v-if="viewState==='selectDivisor'" class="wrap homeWrap">
      <div class="header-area">
        <div class="title">选择除数</div>
        <div class="subtitle">点击下方数字开始练习商首位</div>
      </div>
      <div class="card glass-panel" style="flex:1; overflow-y:auto;">
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <button v-for="item in divisorList" :key="item" class="k glass-key" style="font-size:20px; height:50px; line-height:50px;" @click="selectDivisorAndStart(item)">{{item}}</button>
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
          
          <template v-if="currentModeKey === 'divScale'">
            <div class="ansBox glass-input" style="display: flex; justify-content: center; align-items: center; gap: 12px; padding: 12px;">
              <div style="flex: 1; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 16px; height: 54px; line-height: 54px; font-size: 36px;">
                {{ input.slice(0, 3) }}<span v-if="input.length < 3" style="color: #ccc;">_</span>
              </div>
              <div style="font-size: 32px; color: #1c1c1e;">÷</div>
              <div style="width: 70px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 16px; height: 54px; line-height: 54px; font-size: 36px;">
                {{ input.slice(3, 4) || '_' }}
              </div>
            </div>
          </template>
          
          <template v-else-if="currentModeKey === 'carryJudge'">
            <div class="ansBox glass-input" style="display: flex; justify-content: center; align-items: center; gap: 15px; padding: 12px; background: transparent; border: none; box-shadow: none;">
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">百位</div>
                <div style="width: 60px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 16px; height: 60px; line-height: 60px; font-size: 36px; color: #1c1c1e;">{{ input[0] || '_' }}</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">十位</div>
                <div style="width: 60px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 16px; height: 60px; line-height: 60px; font-size: 36px; color: #1c1c1e;">{{ input[1] || '_' }}</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">个位</div>
                <div style="width: 60px; background: rgba(0,0,0,0.03); border: 2px solid rgba(0,0,0,0.1); border-radius: 16px; height: 60px; line-height: 60px; font-size: 36px; color: #8e8e93;">N</div>
              </div>
            </div>
          </template>

          <template v-else-if="currentModeKey === 'digitDetermine'">
            <div class="ansBox glass-input" style="display: flex; justify-content: center; align-items: center; gap: 12px; padding: 12px; background: transparent; border: none; box-shadow: none;">
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">千/百位</div>
                <div style="display:flex; gap: 6px;">
                  <div style="width: 45px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 14px; height: 60px; line-height: 60px; font-size: 36px; color: #1c1c1e;">{{ input[0] || '_' }}</div>
                  <div style="width: 45px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 14px; height: 60px; line-height: 60px; font-size: 36px; color: #1c1c1e;">{{ input[1] || '_' }}</div>
                </div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">十位</div>
                <div style="width: 45px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 14px; height: 60px; line-height: 60px; font-size: 36px; color: #1c1c1e;">{{ input[2] || '_' }}</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">个位</div>
                <div style="width: 45px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 14px; height: 60px; line-height: 60px; font-size: 36px; color: #1c1c1e;">{{ input[3] || '_' }}</div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="ansBox glass-input">答案：{{input ? input : '—'}}</div>
          </template>

          <div class="hint">{{uiHint}}</div>
        </div>
      </div>
      <div class="keypad card glass-panel">
        <div class="fnRow">
          <button class="kFn style-skip" @click="leftAction">{{leftText}}</button>
          <button class="kFn style-clear" @click="clearInput">清空</button>
          <button class="kFn style-del" @click="backspace">退格</button>
        </div>
        
        <div class="grid" v-if="currentModeKey === 'carryJudge'" style="grid-template-columns: 1fr 1fr;">
          <button class="k glass-key" style="height: 180px; font-size: 48px; color: #34c759;" @click="pressDigit('Y')">Y<span style="font-size:16px; display:block;">(进位)</span></button>
          <button class="k glass-key" style="height: 180px; font-size: 48px; color: #ff3b30;" @click="pressDigit('N')">N<span style="font-size:16px; display:block;">(不进)</span></button>
          <button class="k confirm glass-key-confirm" style="grid-column: 1 / 3;" @click="confirmAnswer">确认</button>
        </div>
        
        <div class="grid" v-else>
          <button v-for="item in [1,2,3,4,5,6,7,8,9]" :key="item" class="k glass-key" @click="pressDigit(item)">{{item}}</button>
          <button class="k glass-key" @click="pressDot">.</button>
          <button class="k glass-key" @click="pressDigit(0)">0</button>
          <button class="k confirm glass-key-confirm" @click="confirmAnswer">确认</button>
        </div>
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
                <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff3b30' : 'inherit' }">{{item.usedStr}}</span> / 错{{item.wrong}}{{item.skipped?'(跳)':''}}
              </span>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, index) in results" :key="index" class="row">
              <span class="rowLeft">{{index+1}}. {{item.q}} = {{item.yourAns}}</span>
              <span class="rowRight" style="display:flex; flex-direction:column; align-items:flex-end;">
                  <div>
                      <span style="margin-right:4px; font-size:13px; color:#666;">{{item.usedStr}}</span>
                      <span>{{item.ok ? '✅' : '❌'}}</span>
                      <span v-if="!item.ok" style="color:#ff3b30; font-size:13px; margin-left:2px; font-weight:700;">({{item.realAns}})</span>
                  </div>
                  <div v-if="item.exactAns" :style="{ fontSize:'11px', color: item.ok ? '#007aff' : '#ff3b30', marginTop:'2px', fontWeight:500 }">
                      准:{{ item.exactAns }} 误:{{ item.errorRate }}
                      <span v-if="item.exactDividend" style="margin-left:4px;">准被除数:{{ item.exactDividend }}</span>
                  </div>
                  <div v-if="item.detailTimes" style="font-size:11px; color:#8e8e93; margin-top:2px;">
                      分步用时: {{ item.detailTimes }}
                  </div>
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
             <div v-for="m in availableModes" :key="m" :class="['chart-tab-item', chartTab === m ? 'active' : '']" @click="switchChartTab(m)">{{ m }}</div>
           </div>
           <div id="accChart" style="width: 100%; height: 220px;"></div>
           <button class="btnGhost small" style="margin-top:5px; font-size:13px;" @click="closeChart">收起图表</button>
        </div>
        <div v-else>
           <button class="btnGhost glass-btn" style="height:44px; line-height:44px; font-size:16px; margin-bottom:15px; color:#007aff;" @click="initChart">📊 按模块分析趋势</button>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding:0 8px; font-weight:700; color:#8e8e93; font-size:13px;">
           <span>时间 / 模式</span><span>成绩 / 耗时</span>
        </div>
        <div class="resultScroll">
          <div v-if="historyList.length === 0" style="text-align:center; padding: 20px; color:rgba(0,0,0,0.4);">暂无记录，快去练习吧！</div>
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
          <button v-if="historyList.length > 1000" class="btnGhost glass-btn" style="margin:0; height: 40px; font-size: 16px; color: #ff3b30; background: rgba(255,59,48,0.08); border-color: rgba(255,59,48,0.2);" @click="clearOldest">🗑️ 清理最早的 1000 条</button>
          <div style="display:flex; gap:10px;">
            <button class="btnDanger glass-btn main-action-btn" style="margin:0; flex:1;" @click="clearHistory">清空全部</button>
            <button class="btnPrimary glass-primary main-action-btn" style="margin:0; flex:1;" @click="closeHistory">返回主页</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewState==='cubic'" class="wrap full-height" style="padding:0; overflow:hidden;">
      <div id="three-container" style="width:100%; height:100%; display:block; outline:none; touch-action: none;"></div>

      <div class="cubic-ui safe-top">
        <div class="glass-panel" style="padding: 8px 12px; display: flex; gap: 8px; align-items: center; border-radius: 24px; max-width: 98%; overflow-x: auto;">
          <button class="btnBack glass-btn small-btn" @click="quitCubicMode">🔙</button>
          <div class="divider"></div>

          <template v-if="cubicMode === 'section'">
             <div style="position:relative;">
                <button class="btnGhost small-btn" @click="showShapeMenu = !showShapeMenu" style="font-size:13px; color:#5856d6; font-weight:700;">
                  📂 题库 ({{ currentShapeName }})
                </button>
             </div>
             <div class="divider"></div>
             <button class="view-btn" style="background:#000; color:#fff; border:none;" @click="lookAtSection">👀 正视切面</button>
          </template>

          <template v-else>
            <div style="display:flex; gap:4px;">
              <div v-for="c in colors" :key="c" 
                :style="{backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none'}"
                :class="['color-dot', selectedColor === c && !isDeleteMode ? 'active' : '']"
                @click="switchColor(c)"></div>
            </div>
            <div class="divider"></div>
            <button :class="['btnIcon', isDeleteMode ? 'active' : '']" @click="toggleDeleteMode">🗑️</button>
            <button class="btnIcon" @click="clearCubes">🔄</button>
          </template>
        </div>

        <div class="view-selector glass-panel">
          <button class="view-btn" @click="setCameraView('front')">正</button>
          <button class="view-btn" @click="setCameraView('left')">左</button>
          <button class="view-btn" @click="setCameraView('top')">俯</button>
          <button class="view-btn" @click="setCameraView('iso')">轴</button>
        </div>
        
        <div class="tip-toast" v-if="cubicMode === 'block'">点击地面放置，点击方块叠加</div>
        <div class="tip-toast" v-if="cubicMode === 'section'" style="background:rgba(88,86,214,0.85);">请调节下方滑块观察截面变化</div>
      </div>

      <div v-if="showShapeMenu && cubicMode === 'section'" class="shape-menu-container">
        <div class="shape-menu glass-panel">
          <div class="shape-group-title">基础柱体/多面体</div>
          <div class="shape-grid">
            <div v-for="s in examShapes.basic" :key="s.name" class="shape-item" @click="loadExamShape(s)">{{ s.name }}</div>
          </div>
          <div class="shape-group-title">曲面体 (锥/台/球)</div>
          <div class="shape-grid">
            <div v-for="s in examShapes.curved" :key="s.name" class="shape-item" @click="loadExamShape(s)">{{ s.name }}</div>
          </div>
          <div class="shape-group-title">高频挖空 (修复版)</div>
          <div class="shape-grid">
            <div v-for="s in examShapes.hollow" :key="s.name" class="shape-item" @click="loadExamShape(s)">{{ s.name }}</div>
          </div>
          <div class="shape-group-title">组合与拼接</div>
          <div class="shape-grid">
            <div v-for="s in examShapes.composite" :key="s.name" class="shape-item" @click="loadExamShape(s)">{{ s.name }}</div>
          </div>
          <div class="shape-group-title">异形构造</div>
          <div class="shape-grid">
            <div v-for="s in examShapes.special" :key="s.name" class="shape-item" @click="loadExamShape(s)">{{ s.name }}</div>
          </div>
        </div>
      </div>

      <div v-if="cubicMode === 'section'" :class="['slice-panel-container', sliceMenuCollapsed ? 'collapsed' : '']">
        <div class="glass-panel slice-panel-content">
            <div class="panel-header" @click="sliceMenuCollapsed = !sliceMenuCollapsed">
              <div class="sheet-handle"></div>
              <div class="header-row">
                <span class="header-title">📐 切面调节</span>
                <span class="header-toggle-text">{{ sliceMenuCollapsed ? '展开' : '收起' }}</span>
              </div>
            </div>
            
            <div v-if="!sliceMenuCollapsed" class="controls-body">
              <div class="slice-row">
                <span class="slice-label">位移</span>
                <input type="range" min="-8" max="8" step="0.1" v-model.number="sliceConfig.constant" class="slice-slider">
              </div>
              <div class="slice-row">
                <span class="slice-label">X旋转</span>
                <input type="range" min="0" max="180" step="1" v-model.number="sliceConfig.rotX" class="slice-slider">
              </div>
              <div class="slice-row">
                <span class="slice-label">Y旋转</span>
                <input type="range" min="0" max="180" step="1" v-model.number="sliceConfig.rotY" class="slice-slider">
              </div>
              <div class="slice-row">
                <span class="slice-label">Z旋转</span>
                <input type="range" min="0" max="180" step="1" v-model.number="sliceConfig.rotZ" class="slice-slider">
              </div>
              <div style="margin-top: 12px;">
                  <button class="btnGhost ios-reset-btn" @click="resetSlice">重置位置</button>
              </div>
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
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

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

// 游戏模式定义
const GAME_MODES = {
  'train': { name: '训练', title: '基础训练完成！', hintNote: '精确到整数', gen: () => shuffle(buildBasePool()) },
  'speed': { name: '竞速', title: '竞速完成！', hintNote: '精确到整数', gen: () => shuffle(buildBasePool()).slice(0, 10) },
  'first': { name: '首位(随机)', title: '商首位完成！', hintNote: '目标：输入商的第一位数字', gen: (n) => { const pool=[]; for(let i=0;i<n;i++){ const dr=11+Math.floor(Math.random()*9); const dd=100+Math.floor(Math.random()*900); const fd=parseInt(String(Math.floor(dd/dr))[0],10); pool.push({dividend:dd,divisor:dr,ans:fd,symbol:'÷'}); } return pool; } },
  'firstSpec': { name: '商首位专项', title: '商首位专项完成！', gen: (n, ex) => { const d=ex.divisor||12; const pool=[]; for(let i=0;i<n;i++){ const dd=Math.floor(Math.random()*(999-d+1))+d; const fq=Math.floor(dd/d); const fd=parseInt(String(fq)[0],10); pool.push({dividend:dd,divisor:d,ans:fd,symbol:'÷'}); } return pool; } },
  'plus': { name: '进位加', title: '一位数进位加完成！', hintNote: '只填个位尾数', gen: (n) => { const p=[]; for(let i=0;i<n;i++){ let a,b; do{a=Math.floor(Math.random()*9)+1;b=Math.floor(Math.random()*9)+1;let a1=a%10;let b1=b%10;}while(a+b<10); p.push({dividend:a,divisor:b,ans:(a+b)%10,symbol:'+'});} return p;} },
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
  
  // 修正后：判进位（只需输入前两位）
  'carryJudge': { 
    name: '判进位', 
    title: '判进位完成！', 
    hintNote: '百位、十位是否接收低位进位(Y/N)', 
    check: (v, t, inputStr) => {
        // 修改：用户只输入2个字符，系统自动补N对比
        if (!inputStr || inputStr.length < 2) return { ok: false, display: t };
        const finalInput = inputStr.toUpperCase() + 'N';
        return { ok: finalInput === t.toUpperCase(), display: t };
    },
    gen: (n) => { 
        const p = []; 
        for(let i=0; i<n; i++){ 
            const a = Math.floor(Math.random()*900)+100; 
            const b = Math.floor(Math.random()*900)+100; 
            
            const c1 = 'N';
            const c10 = ((a % 10) + (b % 10) >= 10) ? 'Y' : 'N';
            const c100 = ((a % 100) + (b % 100) >= 100) ? 'Y' : 'N';
            
            const ansStr = `${c100}${c10}${c1}`;
            p.push({dividend: a, divisor: b, ans: ansStr, symbol: '+'});
        } 
        return p;
    } 
  },
  
  // 确本位
  'digitDetermine': { 
    name: '确本位', 
    title: '确本位完成！', 
    hintNote: '依次输入:千/百位(1~2位), 十位, 个位', 
    check: (v, t, inputStr) => {
        if (!inputStr) return { ok: false, display: t.toString() };
        return { ok: parseInt(inputStr, 10) === t, display: t.toString() };
    },
    gen: (n) => { 
        const p = []; 
        for(let i=0; i<n; i++){ 
            const a = Math.floor(Math.random()*900)+100; 
            const b = Math.floor(Math.random()*900)+100; 
            p.push({dividend: a, divisor: b, ans: a+b, symbol: '+'});
        } 
        return p;
    } 
  },

  'divSpecA': { name: '反向放缩', title: '反向放缩完成！', hintNote: '除数111-199 (误差3%内)', check:(v,t)=>{const r=Math.abs(v-t)/t; return {ok:r<=0.03,display:Math.round(t)};}, gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const dr=Math.floor(Math.random()*(199-111+1))+111;const dd=Math.floor(Math.random()*(99999-10000+1))+10000; p.push({dividend:dd,divisor:dr,ans:dd/dr,symbol:'÷'});} return p;} },
  'divSpecB': { name: '平移法', title: '平移法完成！', hintNote: '商90-111 (误差3%内)', check:(v,t)=>{const r=Math.abs(v-t)/t; return {ok:r<=0.03,display:Math.round(t)};}, gen: (n)=>{ const p=[]; let c=0; while(c<n){ const dr=Math.floor(Math.random()*900)+100;const tq=Math.floor(Math.random()*(111-90+1))+90;const dd=dr*tq+Math.floor(Math.random()*dr); if(dd>=10000&&dd<=99999){ p.push({dividend:dd,divisor:dr,ans:dd/dr,symbol:'÷'}); c++;} } return p;} },
  'divSpecC': { name: '任意五除三', title: '任意五除三完成！', hintNote: '五位数除以三位数 (误差3%内)', check:(v,t)=>{const r=Math.abs(v-t)/t; return {ok:r<=0.03,display:Math.round(t)};}, gen: (n)=>{ const p=[]; for(let i=0;i<n;i++){ const dr=Math.floor(Math.random()*900)+100;const dd=Math.floor(Math.random()*(99999-10000+1))+10000; p.push({dividend:dd,divisor:dr,ans:dd/dr,symbol:'÷'});} return p;} },
  
  'divScale': { 
    name: '放缩被除数', 
    title: '放缩被除数完成！', 
    hintNote: '估算并连续输入三位数和一位数', 
    check: (v, t, inputStr) => {
        if (!inputStr || inputStr.length < 4) {
            return { ok: false, display: '需填满三位数和一位数', exactAns: t.toFixed(2), errorRate: '格式错' };
        }
        const a = parseInt(inputStr.slice(0, 3));
        const b = parseInt(inputStr.slice(3, 4));
        
        if (b === 0) {
            return { ok: false, display: '除数不能为0', exactAns: t.toFixed(2), errorRate: '无效' };
        }

        const userVal = a / b;
        let ratio = userVal / t;
        
        let p10 = Math.round(Math.log10(ratio));
        let adjustedExact = t * Math.pow(10, p10);
        
        const r = Math.abs(userVal - adjustedExact) / adjustedExact;

        const exactDividend = (b * adjustedExact).toFixed(1);

        return { 
            ok: r <= 0.03, 
            display: t.toFixed(2),
            exactAns: t.toFixed(2),
            exactDividend: exactDividend,
            errorRate: (r * 100).toFixed(2) + '%' 
        };
    }, 
    gen: (n) => { 
        const p = []; 
        for(let i=0; i<n; i++){ 
            const dr = Math.floor(Math.random()*(999-201+1))+201; 
            const dd = Math.floor(Math.random()*(99999-10000+1))+10000; 
            p.push({dividend:dd, divisor:dr, ans:dd/dr, symbol:'÷'});
        } 
        return p;
    } 
  }
};

const MODE_GROUPS = {
  basic: { label: '大九九/除法', modes: ['train', 'speed', 'first'] },
  divSelect: { label: '商首位专项', modes: [] }, 
  single: { label: '一位数专项 (仅填尾数)', modes: ['plus', 'minus'] },
  double: { label: '两位数专项 (完整答案)', modes: ['doublePlus', 'doubleMinus', 'fourSum'] },
  triple: { label: '三位数专项 (完整答案)', modes: ['carryJudge', 'digitDetermine', 'triplePlus', 'tripleMinus', 'tripleAnyPlus', 'tripleAnyMinus', 'tripleMix', 'tripleMult', 'tripleDiv'] },
  spec: { label: '五除三专项 (允许3%误差)', modes: ['divSpecA', 'divSpecB', 'divSpecC', 'divScale'] }
};

// --- 以下 THREE.JS 造型定义保持不变 ---
const createHollowCylinder = () => { const shape = new THREE.Shape(); shape.absarc(0, 0, 4, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 2, 0, Math.PI * 2, true); shape.holes.push(hole); return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false, curveSegments: 64 }); };
const createHollowPrism = () => { const shape = new THREE.Shape(); shape.moveTo(-4, -4); shape.lineTo(4, -4); shape.lineTo(4, 4); shape.lineTo(-4, 4); shape.lineTo(-4, -4); const hole = new THREE.Path(); hole.moveTo(-2, -2); hole.lineTo(-2, 2); hole.lineTo(2, 2); hole.lineTo(2, -2); hole.lineTo(-2, -2); shape.holes.push(hole); return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false }); };
const createFrameShape = () => { const shape = new THREE.Shape(); shape.moveTo(-4, -4); shape.lineTo(4, -4); shape.lineTo(4, 4); shape.lineTo(-4, 4); shape.lineTo(-4, -4); const hole = new THREE.Path(); hole.moveTo(-3, -3); hole.lineTo(-3, 3); hole.lineTo(3, 3); hole.lineTo(3, -3); hole.lineTo(-3, -3); shape.holes.push(hole); return new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false }); };
const createUShape = () => { const shape = new THREE.Shape(); shape.moveTo(-3, -3); shape.lineTo(3, -3); shape.lineTo(3, 3); shape.lineTo(1, 3); shape.lineTo(1, -1); shape.lineTo(-1, -1); shape.lineTo(-1, 3); shape.lineTo(-3, 3); shape.lineTo(-3, -3); return new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false }); };
const createLShape = () => { const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(4, 0); shape.lineTo(4, 2); shape.lineTo(2, 2); shape.lineTo(2, 6); shape.lineTo(0, 6); shape.lineTo(0, 0); return new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false }); };
const createCrossShape = () => { const shape = new THREE.Shape(); const w = 2, l = 6; shape.moveTo(-w/2, -l/2); shape.lineTo(w/2, -l/2); shape.lineTo(w/2, -w/2); shape.lineTo(l/2, -w/2); shape.lineTo(l/2, w/2); shape.lineTo(w/2, w/2); shape.lineTo(w/2, l/2); shape.lineTo(-w/2, l/2); shape.lineTo(-w/2, w/2); shape.lineTo(-l/2, w/2); shape.lineTo(-l/2, -w/2); shape.lineTo(-w/2, -w/2); return new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false }); };
const createNotchedCube = () => { const shape = new THREE.Shape(); shape.moveTo(-3, -3); shape.lineTo(3, -3); shape.lineTo(3, 1); shape.lineTo(1, 3); shape.lineTo(-3, 3); return new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false }); };
const createTShape = () => { const shape = new THREE.Shape(); shape.moveTo(-1.5, -4); shape.lineTo(1.5, -4); shape.lineTo(1.5, 2); shape.lineTo(4, 2); shape.lineTo(4, 4); shape.lineTo(-4, 4); shape.lineTo(-4, 2); shape.lineTo(-1.5, 2); shape.lineTo(-1.5, -4); return new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false }); };
const createCubeWithHole = () => { const shape = new THREE.Shape(); shape.moveTo(-3,-3); shape.lineTo(3,-3); shape.lineTo(3,3); shape.lineTo(-3,3); const hole = new THREE.Path(); hole.absarc(0,0,2,0,Math.PI*2,true); shape.holes.push(hole); return new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false, curveSegments: 64 }); };
const createCylinderWithRectHole = () => { const shape = new THREE.Shape(); shape.absarc(0, 0, 4, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.moveTo(-1.5, -1.5); hole.lineTo(-1.5, 1.5); hole.lineTo(1.5, 1.5); hole.lineTo(1.5, -1.5); hole.lineTo(-1.5, -1.5); shape.holes.push(hole); return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false, curveSegments: 64 }); };
const createArchShape = () => { const shape = new THREE.Shape(); shape.moveTo(-3, 0); shape.lineTo(3, 0); shape.lineTo(3, 4); shape.absarc(0, 4, 3, 0, Math.PI, false); shape.lineTo(-3, 4); const hole = new THREE.Path(); hole.moveTo(-1.5, 0); hole.lineTo(-1.5, 3); hole.absarc(0, 3, 1.5, Math.PI, 0, true); hole.lineTo(1.5, 0); hole.lineTo(-1.5, 0); shape.holes.push(hole); return new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false, curveSegments: 32 }); };
const createTrapezoidPrism = () => { const shape = new THREE.Shape(); shape.moveTo(-4, -2); shape.lineTo(4, -2); shape.lineTo(2, 2); shape.lineTo(-2, 2); shape.lineTo(-4, -2); return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false }); };
const createSemiCylinder = () => { const shape = new THREE.Shape(); shape.absarc(0, 0, 4, 0, Math.PI, false); shape.lineTo(-4, 0); return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false, curveSegments: 32 }); };
const createSectorPrism = () => { const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(4, 0); shape.absarc(0, 0, 4, 0, Math.PI / 2, false); shape.lineTo(0, 0); return new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false, curveSegments: 32 }); };
const createTwoHoleBrick = () => { const shape = new THREE.Shape(); shape.moveTo(-4, -2); shape.lineTo(4, -2); shape.lineTo(4, 2); shape.lineTo(-4, 2); shape.lineTo(-4, -2); const h1 = new THREE.Path(); h1.absarc(-2, 0, 1, 0, Math.PI*2, true); shape.holes.push(h1); const h2 = new THREE.Path(); h2.absarc(2, 0, 1, 0, Math.PI*2, true); shape.holes.push(h2); return new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false, curveSegments: 32 }); };

const EXAM_SHAPES = {
  basic: [
    { name: '正方体', create: () => new THREE.BoxGeometry(6, 6, 6) },
    { name: '长方体(扁)', create: () => new THREE.BoxGeometry(4, 8, 2) },
    { name: '圆柱', create: () => new THREE.CylinderGeometry(4, 4, 8, 32) },
    { name: '三棱柱', create: () => new THREE.CylinderGeometry(4, 4, 8, 3) },
    { name: '六棱柱', create: () => new THREE.CylinderGeometry(4, 4, 8, 6) },
    { name: '梯形柱', create: createTrapezoidPrism },
    { name: '半圆柱', create: createSemiCylinder },
    { name: '正四面体', create: () => new THREE.TetrahedronGeometry(6) },
    { name: '正八面体', create: () => new THREE.OctahedronGeometry(5) },
  ],
  curved: [
    { name: '圆锥', create: () => new THREE.CylinderGeometry(0, 4, 8, 64) },
    { name: '圆台', create: () => new THREE.CylinderGeometry(2, 4, 6, 64) },
    { name: '球体', create: () => new THREE.SphereGeometry(4, 64, 64) },
    { name: '半球', create: () => new THREE.SphereGeometry(4, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2) },
    { name: '扇形柱(1/4圆)', create: createSectorPrism },
  ],
  hollow: [
    { name: '空心圆柱(圆管)', create: createHollowCylinder },
    { name: '空心方柱(方管)', create: createHollowPrism },
    { name: '回字型(框体)', create: createFrameShape },
    { name: '正方体挖圆孔', create: createCubeWithHole },
    { name: '圆柱挖方孔', create: createCylinderWithRectHole },
    { name: '双孔砖', create: createTwoHoleBrick },
  ],
  composite: [
    { name: 'T型体', create: createTShape },
    { name: 'L型体', create: createLShape },
    { name: '十字体', create: createCrossShape },
    { name: '凹型体(U型)', create: createUShape },
    { name: '拱门造型', create: createArchShape },
  ],
  special: [
    { name: '缺角正方体', create: createNotchedCube },
    { name: '台阶(阶梯)', create: () => {
        const shape = new THREE.Shape();
        shape.moveTo(-3, -3);
        shape.lineTo(3, -3); shape.lineTo(3, -1);
        shape.lineTo(1, -1); shape.lineTo(1, 1);
        shape.lineTo(-1, 1); shape.lineTo(-1, 3);
        shape.lineTo(-3, 3);
        return new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false });
    }},
    { name: '三角楔形', create: () => new THREE.CylinderGeometry(0, 4, 6, 3, 1, false, 0, Math.PI) },
    { name: '四棱锥', create: () => new THREE.CylinderGeometry(0, 5, 6, 4) },
  ]
};

export default {
  data() {
    return {
      viewState: 'home', currentModeKey: 'train', selectedDivisor: 0,
      pool: [], idx: 0, current: null, input: '', uiHint: 'Ready?', totalText: '0:00.0', progressText: '1/81', qText: '—', leftText: '跳过', 
      totalStartTs: 0, qStartTs: 0, trainWrong: 0, trainSkip: 0, curWrongTries: 0, trainLog: [], results: [], 
      historyList: [], showChart: false, chartInstance: null, chartTab: '', availableModes: [], isHistoryReview: false,
      toast: { show: false, title: '' },
      modeGroups: MODE_GROUPS, divisorList: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
      
      // 分段计时逻辑状态
      boxTimes: [],
      lastInputTs: 0,

      // 3D 模式状态
      cubicMode: 'block',
      isDeleteMode: false,
      showShapeMenu: false, 
      sliceMenuCollapsed: false, 
      currentShapeName: '正方体',
      colors: ['#007aff', '#ff9500', '#333333', '#ffffff'], 
      selectedColor: '#007aff',
      examShapes: EXAM_SHAPES,
      
      // 切面配置
      sliceConfig: {
        constant: 0,
        rotX: 90, 
        rotY: 0,
        rotZ: 0
      }
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
    this.threeApp = { 
      scene: null, camera: null, renderer: null, controls: null, 
      raycaster: null, pointer: null, objects: [], animationId: null, 
      examGroup: null, gridHelper: null,
      csg: null, sliceHelper: null
    };
  },
  watch: {
    sliceConfig: {
       handler() { this.updateSlicePlane(); },
       deep: true
    }
  },
  methods: {
    now() { return Date.now(); },
    getModeConfig(key) { return GAME_MODES[key] || { name: key }; },
    setMode(mode){ this.currentModeKey = mode; },
    toSelectDivisor(){ this.viewState = 'selectDivisor'; },
    selectDivisorAndStart(d){ this.currentModeKey = 'firstSpec'; this.selectedDivisor = d; this.startGame(); },
    showToast(title) { this.toast.title = title; this.toast.show = true; setTimeout(() => { this.toast.show = false; }, 1500); },
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
    _setQuestion(q, shownIdx){ 
       this.current = q; 
       this.qStartTs = this.now(); 
       this.lastInputTs = this.now(); 
       this.boxTimes = [];
       this.input = ''; 
       this.curWrongTries = 0; 
       this.qText = `${q.dividend}${q.symbol}${q.divisor}`; 
       this.progressText = `${shownIdx}/${this.pool.length}`; 
    },
    _nextQuestion(){ const { idx, pool } = this; if(idx >= pool.length){ this._finish(); return; } this._setQuestion(pool[idx], idx + 1); this.idx = idx + 1; },
    
    pressDigit(d){ 
        let input = this.input || ''; 
        let maxLen = 6;
        if (this.currentModeKey === 'divScale') maxLen = 4;
        // 修改：判进位由于个位写死为N，只需要让用户输入百位和十位，所以长度限制为 2
        if (this.currentModeKey === 'carryJudge') maxLen = 2;
        if (this.currentModeKey === 'digitDetermine') maxLen = 4;

        if(input.length >= maxLen) return; 
        
        if (['carryJudge', 'digitDetermine'].includes(this.currentModeKey)) {
            const now = this.now();
            this.boxTimes.push(now - this.lastInputTs);
            this.lastInputTs = now;
        }

        input += String(d); 
        this.input = input; 
    },
    pressDot(){ 
        if (['divScale', 'carryJudge', 'digitDetermine'].includes(this.currentModeKey)) return; 
        let input = this.input || ''; 
        if(input.length >= 6) return; 
        if(input.includes('.')) return; 
        if(input === '') input += '0'; 
        input += '.'; 
        this.input = input; 
    },

    clearInput(){ 
        this.input = ''; 
        if (['carryJudge', 'digitDetermine'].includes(this.currentModeKey)) {
            this.boxTimes = [];
            this.lastInputTs = this.now();
        }
    },
    backspace(){ 
        if (['carryJudge', 'digitDetermine'].includes(this.currentModeKey) && (this.input || '').length > 0) {
            this.boxTimes.pop(); 
            this.lastInputTs = this.now(); 
        }
        this.input = (this.input || '').slice(0, -1); 
    },
    leftAction(){ if(this.currentModeKey !== 'train'){ this.startGame(); return; } const cur = this.current; const used = (this.now() - this.qStartTs)/1000; const log = this.trainLog.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, usedStr: used.toFixed(1) + 's', wrong: this.curWrongTries, skipped: true }]); this.trainSkip++; this.trainLog = log; this._nextQuestion(); },
    
    confirmAnswer(){
      const { current: cur, input, currentModeKey: mode, activeConfig } = this; 
      if(!input) return; 
      
      const n = parseFloat(input); 
      const used = (this.now() - this.qStartTs)/1000;
      let correct = false; 
      let realAnsDisplay = cur.ans;
      let extraInfo = {};
      let yourAnsStr = input;

      // 解析分步耗时并放入 extraInfo
      let detailTimesStr = '';
      if (mode === 'carryJudge') {
          // 判进位这里只校验是否填满了前两位
          if (input.length < 2) { this.uiHint = '请填满百位和十位选项'; return; }
          const t1 = (this.boxTimes[0] || 0) / 1000;
          const t2 = (this.boxTimes[1] || 0) / 1000;
          detailTimesStr = `百:${t1.toFixed(1)}s 十:${t2.toFixed(1)}s (个位默认N)`;
          yourAnsStr = input + 'N'; // 把显示在记录里的用户答案自动补上N
      } else if (mode === 'digitDetermine') {
          let tH = 0, tT = 0, tO = 0;
          if (this.input.length === 4) {
              tH = ((this.boxTimes[0]||0) + (this.boxTimes[1]||0)) / 1000;
              tT = (this.boxTimes[2]||0) / 1000;
              tO = (this.boxTimes[3]||0) / 1000;
          } else {
              tH = (this.boxTimes[0]||0) / 1000;
              tT = (this.boxTimes[1]||0) / 1000;
              tO = (this.boxTimes[2]||0) / 1000;
          }
          detailTimesStr = `千百:${tH.toFixed(1)}s 十:${tT.toFixed(1)}s 个:${tO.toFixed(1)}s`;
      }
      if (detailTimesStr) extraInfo.detailTimes = detailTimesStr;

      if (mode === 'divScale') {
          if (input.length < 4) {
              this.uiHint = '请填满三位数和一位数';
              return; 
          }
          yourAnsStr = `${input.slice(0,3)}÷${input.slice(3,4)}`;
      }

      if (activeConfig.check) { 
        const checkResult = activeConfig.check(n, cur.ans, input); 
        correct = checkResult.ok; 
        realAnsDisplay = checkResult.display; 
        
        if (checkResult.exactAns !== undefined) {
            extraInfo = { ...extraInfo, exactAns: checkResult.exactAns, errorRate: checkResult.errorRate };
            if (checkResult.exactDividend !== undefined) {
                extraInfo.exactDividend = checkResult.exactDividend;
            }
        }
      } else { 
        correct = (parseInt(input) === cur.ans); 
      }
      
      if(mode === 'train'){ 
        if(correct){ 
          const log = this.trainLog.concat([{ q: `${cur.dividend}${cur.symbol}${cur.divisor}`, usedStr: used.toFixed(1) + 's', wrong: this.curWrongTries, skipped: false }]); 
          this.trainLog = log; 
          this._nextQuestion(); 
        } else { 
          this.trainWrong++; 
          this.curWrongTries++; 
          this.input = ''; 
          if (mode === 'carryJudge') this.boxTimes = [];
          this.uiHint = `错误！答案是：${realAnsDisplay}`; 
        } 
        return; 
      }

      const estimateModes = ['tripleDiv', 'divSpecA', 'divSpecB', 'divSpecC'];
      if (estimateModes.includes(mode)) {
          const exact = cur.dividend / cur.divisor;
          const error = Math.abs(n - exact) / exact;
          const exactStr = Number.isInteger(exact) ? String(exact) : exact.toFixed(1);
          extraInfo = { ...extraInfo, exactAns: exactStr, errorRate: (error * 100).toFixed(2) + '%' };
      }

      const results = this.results.concat([{ 
        q: `${cur.dividend}${cur.symbol}${cur.divisor}`, ok: correct, yourAns: yourAnsStr, realAns: realAnsDisplay, usedStr: used.toFixed(1) + 's', ...extraInfo
      }]); 
      this.results = results; 
      this._nextQuestion();
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

    // 3D 模块
    startCubicMode(mode = 'block') {
      this.cubicMode = mode;
      this.viewState = 'cubic'; 
      this.sliceMenuCollapsed = false;
      this.resetSlice();
      this.$nextTick(() => { 
        this.initThree(); 
        if(mode === 'section') {
          this.loadExamShape(this.examShapes.basic[0]);
        }
        if(this.threeApp.gridHelper) {
          this.threeApp.gridHelper.visible = (mode === 'block');
        }
      }); 
    },
    quitCubicMode() { 
      this.cleanup3D(); 
      this.viewState = 'home'; 
      this.isDeleteMode = false; 
      this.showShapeMenu = false; 
    },
    switchColor(c) { this.selectedColor = c; this.isDeleteMode = false; },
    toggleDeleteMode() { this.isDeleteMode = !this.isDeleteMode; },
    
    updateSlicePlane() {
      if (!this.threeApp.csg || !this.threeApp.scene) return;
      const { baseBrush, cutterBrush, evaluator } = this.threeApp.csg;
      const { constant, rotX, rotY, rotZ } = this.sliceConfig;

      cutterBrush.position.set(0, 0, 0);
      cutterBrush.rotation.set(0, 0, 0);
      cutterBrush.updateMatrixWorld();

      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(rotX), 
        THREE.MathUtils.degToRad(rotY), 
        THREE.MathUtils.degToRad(rotZ)
      );
      const normal = new THREE.Vector3(0, -1, 0).applyEuler(euler).normalize();
      const cutterSize = 25; 
      const offset = normal.clone().multiplyScalar(constant - cutterSize);
      
      cutterBrush.position.copy(offset);
      cutterBrush.lookAt(offset.clone().add(normal)); 
      cutterBrush.updateMatrixWorld();
      
      baseBrush.updateMatrixWorld();

      const resultMesh = evaluator.evaluate(baseBrush, cutterBrush, SUBTRACTION);
      
      resultMesh.material = [
          baseBrush.material,
          cutterBrush.material 
      ];

      if (this.threeApp.examGroup) {
          this.threeApp.scene.remove(this.threeApp.examGroup);
          if (this.threeApp.examGroup.geometry) this.threeApp.examGroup.geometry.dispose();
      }
      
      this.threeApp.examGroup = resultMesh;
      this.threeApp.scene.add(resultMesh);

      if (this.threeApp.sliceHelper) {
         const h = this.threeApp.sliceHelper;
         h.visible = true;
         const planePos = normal.clone().multiplyScalar(constant);
         h.position.copy(planePos);
         h.lookAt(planePos.clone().add(normal));
      }
    },

    resetSlice() {
      this.sliceConfig = { constant: 0, rotX: 90, rotY: 0, rotZ: 0 };
    },

    lookAtSection() {
      if (!this.threeApp.controls || !this.threeApp.camera) return;
      const { rotX, rotY, rotZ } = this.sliceConfig;
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(rotX), 
        THREE.MathUtils.degToRad(rotY), 
        THREE.MathUtils.degToRad(rotZ)
      );
      const normal = new THREE.Vector3(0, -1, 0).applyEuler(euler).normalize();

      const target = this.threeApp.controls.target.clone();
      const dist = 20; 
      const eyePos = target.clone().add(normal.multiplyScalar(-dist));
      
      this.threeApp.camera.position.copy(eyePos);
      this.threeApp.camera.lookAt(target);
      this.threeApp.controls.update();
    },

    setCameraView(type) {
      if (!this.threeApp.camera || !this.threeApp.controls) return;
      const { camera, controls } = this.threeApp;
      const dist = 20; 
      const targetY = 0; 
      controls.target.set(0, targetY, 0);

      switch(type) {
        case 'front': camera.position.set(0, targetY, dist); break;
        case 'back': camera.position.set(0, targetY, -dist); break;
        case 'left': camera.position.set(-dist, targetY, 0); break;
        case 'right': camera.position.set(dist, targetY, 0); break;
        case 'top': camera.position.set(0, dist, 0); break; 
        case 'iso': camera.position.set(12, 12, 12); break;
      }
      camera.lookAt(0, targetY, 0);
      controls.update();
    },

    initThree() {
      const container = document.getElementById('three-container'); 
      if (!container) return;
      const width = container.clientWidth; 
      const height = container.clientHeight;

      const scene = new THREE.Scene(); 
      scene.background = new THREE.Color('#f2f2f7'); 
      scene.fog = new THREE.Fog('#f2f2f7', 30, 80);

      const aspect = width / height;
      const d = 16; 
      const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
      camera.position.set(12, 12, 12); 
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
      renderer.setSize(width, height); 
      renderer.setPixelRatio(window.devicePixelRatio); 
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); 
      dirLight.position.set(10, 20, 10); 
      scene.add(dirLight);

      const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe5e5e5); 
      gridHelper.visible = (this.cubicMode === 'block'); 
      scene.add(gridHelper);
      this.threeApp.gridHelper = gridHelper;
      
      const planeGeometry = new THREE.PlaneGeometry(20, 20); 
      planeGeometry.rotateX(-Math.PI / 2);
      const planeMaterial = new THREE.MeshBasicMaterial({ visible: false }); 
      const plane = new THREE.Mesh(planeGeometry, planeMaterial); 
      plane.name = 'ground'; 
      scene.add(plane);

      const sliceGeo = new THREE.PlaneGeometry(15, 15);
      const sliceMat = new THREE.MeshBasicMaterial({
         color: 0xff3b30, 
         opacity: 0.1,    
         transparent: true,
         side: THREE.DoubleSide,
         depthWrite: false,
      });
      const sliceHelper = new THREE.Mesh(sliceGeo, sliceMat);
      sliceHelper.visible = false; 
      scene.add(sliceHelper);
      this.threeApp.sliceHelper = sliceHelper;

      const controls = new OrbitControls(camera, renderer.domElement); 
      controls.enableDamping = true; 
      controls.dampingFactor = 0.05;
      controls.update();

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

    loadExamShape(shapeConf) {
       this.clearCubes(); 
       this.showShapeMenu = false;
       this.currentShapeName = shapeConf.name;
       this.resetSlice();

       const baseGeometry = shapeConf.create();
       baseGeometry.computeBoundingBox();
       baseGeometry.center();
       
       const baseMaterial = new THREE.MeshStandardMaterial({
           color: 0xFFFFFF,
           metalness: 0.1,
           roughness: 0.75,
           side: THREE.DoubleSide
       });
       
       const baseBrush = new Brush(baseGeometry, baseMaterial);
       const cutterGeometry = new THREE.BoxGeometry(50, 50, 50); 
       const cutterMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); 
       const cutterBrush = new Brush(cutterGeometry, cutterMaterial);

       this.threeApp.csg = {
           baseBrush: baseBrush,
           cutterBrush: cutterBrush,
           evaluator: new Evaluator()
       };
       this.threeApp.csg.evaluator.useGroups = true; 

       this.updateSlicePlane();
    },

    animate3D() { 
      const { scene, camera, renderer, controls } = this.threeApp; 
      if (!renderer) return; 
      this.threeApp.animationId = requestAnimationFrame(this.animate3D); 
      controls.update(); 
      renderer.render(scene, camera); 
    },

    handle3DClick(raycaster, pointer, scene, camera, plane) {
      if (this.cubicMode === 'section') return; 

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
      const material = new THREE.MeshLambertMaterial({ color: this.selectedColor }); 
      
      const cube = new THREE.Mesh(geometry, material); 
      cube.position.copy(position);
      
      const edges = new THREE.EdgesGeometry(geometry); 
      const lineMaterial = new THREE.LineBasicMaterial({ color: (this.selectedColor === '#333333') ? 0xffffff : 0x000000 });
      const line = new THREE.LineSegments(edges, lineMaterial); 
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
      if(this.threeApp.examGroup) {
         scene.remove(this.threeApp.examGroup);
         this.threeApp.examGroup = null;
      }
      if (this.threeApp.sliceHelper) {
         this.threeApp.sliceHelper.visible = false;
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
.shape-menu-container {
  position: absolute;
  top: 60px;
  left: 10px;
  z-index: 50; 
  pointer-events: auto; 
}

.shape-menu {
  width: 260px; 
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  border-radius: 24px;
  scrollbar-width: none; 
}
.shape-menu::-webkit-scrollbar { display: none; }

.shape-group-title {
  font-size: 12px;
  color: #8e8e93;
  font-weight: 700;
  margin-top: 4px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 2px;
}
.shape-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.shape-item {
  background: rgba(240,240,245,0.8);
  padding: 8px 4px;
  font-size: 13px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.2s;
}
.shape-item:active {
  background: #007aff;
  color: white;
  transform: scale(0.95);
}

.homeStartBtn{ margin-top: 14px; }
.page { height: 100vh; height: 100dvh; min-height: 100vh; background: radial-gradient(at 0% 0%, hsla(210,100%,94%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(260,100%,94%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(300,100%,94%,1) 0, transparent 50%), radial-gradient(at 0% 100%, hsla(180,100%,94%,1) 0, transparent 50%); background-color: #f2f2f7; color: #1c1c1e; display: flex; flex-direction: column; max-width: 480px; margin: 0 auto; box-shadow: 0 0 40px rgba(0,0,0,0.08); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; position: relative; overflow: hidden; }
.mesh-bg { position: absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.7; animation: float 10s infinite alternate ease-in-out; }
.orb-1 { width: 350px; height: 350px; background: #a2d2ff; top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: #e2c2ff; bottom: -50px; right: -80px; animation-delay: -3s; }
.orb-3 { width: 200px; height: 200px; background: #ffdfba; top: 40%; left: 30%; opacity:0.5; animation-delay: -6s; }
@keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(20px, 30px); } }
.toast-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; z-index: 999; pointer-events: none; }
.toast-content { background: rgba(0,0,0,0.7); backdrop-filter: blur(20px); color: #fff; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.wrap { padding: 20px 16px 24px; box-sizing: border-box; position: relative; z-index: 1; }

.homeWrap { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  justify-content: flex-start; 
  overflow: hidden; 
  padding-top: max(60px, env(safe-area-inset-top)); 
  padding-bottom: 0; 
  position: relative;
}

.header-area { 
  margin-bottom: 10px; 
  text-align: center; 
  flex-shrink: 0; 
}

.menu-area-fixed {
  flex: 1;
  overflow: hidden; 
  padding: 0 16px; 
  margin-bottom: 0; 
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
}

.full-menu-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  border-radius: 24px; 
  margin-bottom: 0 !important; 
  padding: 0 !important; 
}

.menu-scroll-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 16px 0 16px; 
  scrollbar-width: none;
}
.menu-scroll-container::-webkit-scrollbar { display: none; }

.card-bottom-actions {
  flex-shrink: 0; 
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.0); 
  z-index: 10;
  display: flex;
  flex-direction: column;
  position: relative;
}

.separator-line {
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
}

.fixed-bottom {
  position: absolute; 
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 16px; 
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 20; 
  pointer-events: none; 
}

.bottom-panel {
  padding: 16px;
  border-radius: 24px !important; 
  pointer-events: auto; 
  box-shadow: 0 -10px 40px rgba(0,0,0,0.1) !important;
}

.full-height { flex: 1; display: flex; flex-direction: column; height: 100vh; }
.full-flex { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-bottom: 20px; }
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
.color-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.5); box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
.color-dot:active { transform: scale(0.9); }
.color-dot.active { transform: scale(1.1); border-color: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(255,255,255,0.8); }
.view-selector { margin-top: 8px; padding: 6px; display: flex; gap: 6px; border-radius: 20px; flex-wrap: wrap; justify-content: center; }
.view-btn { background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #333; }
.view-btn:active, .view-btn.active-view { background: #007aff; color: white; }

.slice-panel-container {
  position: absolute;
  bottom: 24px; 
  left: 50%;
  transform: translateX(-50%);
  width: 92%; 
  max-width: 380px;
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1); 
  z-index: 100;
}

.slice-panel-container.collapsed {
  transform: translateX(-50%) translateY(calc(100% - 60px)); 
}

.slice-panel-content {
  pointer-events: auto;
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(30px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 28px !important; 
}

.panel-header {
  padding: 10px 20px 16px; 
  background: transparent; 
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sheet-handle {
  width: 36px;
  height: 5px;
  background: rgba(60, 60, 67, 0.3); 
  border-radius: 3px;
  margin-bottom: 12px;
}

.header-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
  letter-spacing: -0.4px;
}

.header-toggle-text {
  font-size: 13px;
  color: #007aff;
  font-weight: 600;
  background: rgba(0, 122, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.controls-body {
  padding: 0 20px 24px 20px; 
  display: flex;
  flex-direction: column;
  gap: 16px; 
}

.slice-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slice-label {
  width: 48px;
  text-align: right;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #8e8e93; 
}

.slice-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 24px;
  background: transparent;
  outline: none;
}

.slice-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px; 
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
}

.slice-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0,0,0,0.04); 
  margin-top: -9px; 
  cursor: pointer;
  transition: transform 0.1s;
}

.slice-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.ios-reset-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  color: #007aff;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.ios-reset-btn:active {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(0.98);
}
</style>