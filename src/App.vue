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

          <template v-else-if="['carryJudge', 'borrowJudge'].includes(currentModeKey)">
            <div class="ansBox glass-input" style="display: flex; justify-content: center; align-items: center; gap: 15px; padding: 12px; background: transparent; border: none; box-shadow: none;">
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">百位</div>
                <div style="width: 60px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 16px; height: 60px; line-height: 60px; font-size: 30px; color: #1c1c1e;">{{ inputArray[0] !== undefined ? inputArray[0] : '_' }}</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">十位</div>
                <div style="width: 60px; background: rgba(0,122,255,0.08); border: 2px solid rgba(0,122,255,0.2); border-radius: 16px; height: 60px; line-height: 60px; font-size: 30px; color: #1c1c1e;">{{ inputArray[1] !== undefined ? inputArray[1] : '_' }}</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:14px; color:#8e8e93; margin-bottom:6px;">个位</div>
                <div style="width: 60px; background: rgba(0,0,0,0.03); border: 2px solid rgba(0,0,0,0.1); border-radius: 16px; height: 60px; line-height: 60px; font-size: 30px; color: #8e8e93;">0</div>
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

          <template v-else-if="currentModeKey === 'decompAdd'">
            <div class="ansBox glass-input" style="display: flex; flex-direction: column; gap: 8px; padding: 10px; background: transparent; border: none; box-shadow: none;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size:15px; color:#8e8e93; width: 75px; text-align: left;">十位之和</div>
                <div :style="{ flex: 1, height: '40px', lineHeight: '40px', background: decompStep === 0 ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.03)', border: decompStep === 0 ? '2px solid rgba(0,122,255,0.2)' : '2px solid rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '22px', color: '#1c1c1e', textAlign: 'center', fontWeight: 800 }">
                  {{ decompStep === 0 ? (input || '_') : (inputArray[0] !== undefined ? inputArray[0] : '') }}
                </div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size:15px; color:#8e8e93; width: 75px; text-align: left;">个位之和</div>
                <div :style="{ flex: 1, height: '40px', lineHeight: '40px', background: decompStep === 1 ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.03)', border: decompStep === 1 ? '2px solid rgba(0,122,255,0.2)' : '2px solid rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '22px', color: '#1c1c1e', textAlign: 'center', fontWeight: 800 }">
                  {{ decompStep === 1 ? (input || '_') : (inputArray[1] !== undefined ? inputArray[1] : '') }}
                </div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size:15px; color:#8e8e93; width: 75px; text-align: left;">总和</div>
                <div :style="{ flex: 1, height: '40px', lineHeight: '40px', background: decompStep === 2 ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.03)', border: decompStep === 2 ? '2px solid rgba(0,122,255,0.2)' : '2px solid rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '22px', color: '#1c1c1e', textAlign: 'center', fontWeight: 800 }">
                  {{ decompStep === 2 ? (input || '_') : (inputArray[2] !== undefined ? inputArray[2] : '') }}
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="ansBox glass-input">答案：{{input ? input : '—'}}</div>
          </template>

          <div class="hint" v-if="uiHint">{{uiHint}}</div>
        </div>
      </div>
      <div class="keypad card glass-panel">
        <div class="fnRow">
          <button class="kFn style-skip" @click="leftAction">{{leftText}}</button>
          <button class="kFn style-clear" @click="clearInput">清空</button>
          <button class="kFn style-del" @click="backspace">退格</button>
        </div>

        <div class="grid" v-if="currentModeKey === 'carryJudge'" style="grid-template-columns: 1fr 1fr;">
          <button class="k glass-key" style="height: 140px; font-size: 48px; color: #34c759;" @click="pressDigit('1')">1<span style="font-size:16px; display:block;">(进位)</span></button>
          <button class="k glass-key" style="height: 140px; font-size: 48px; color: #ff3b30;" @click="pressDigit('0')">0<span style="font-size:16px; display:block;">(不进)</span></button>
          <button class="k confirm glass-key-confirm" style="grid-column: 1 / 3;" @click="confirmAnswer">确认</button>
        </div>

        <div class="grid" v-else-if="currentModeKey === 'borrowJudge'" style="grid-template-columns: 1fr 1fr;">
          <button class="k glass-key" style="height: 140px; font-size: 48px; color: #ff3b30;" @click="pressDigit('-1')">-1<span style="font-size:16px; display:block;">(退位)</span></button>
          <button class="k glass-key" style="height: 140px; font-size: 48px; color: #34c759;" @click="pressDigit('0')">0<span style="font-size:16px; display:block;">(不退)</span></button>
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
              <span class="rowLeft" style="white-space: normal; word-break: break-all; overflow: visible; line-height: 1.4;">{{index+1}}. {{item.q}}</span>
              <span class="rowRight">
                <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff3b30' : 'inherit' }">{{item.usedStr}}</span> / 错{{item.wrong}}{{item.skipped?'(跳)':''}}
              </span>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, index) in results" :key="index" class="row">
              <span class="rowLeft" style="white-space: normal; word-break: break-all; overflow: visible; line-height: 1.4;">{{index+1}}. {{item.q}} = {{item.yourAns}}</span>
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
        <div v-if="showExport" class="chart-container glass-inner">
           <div style="font-weight:700; color:#1d1d1f; font-size:14px; margin-bottom:10px;">📥 导出区间数据</div>
           <div class="export-tabs">
             <div :class="['export-tab', exportFormat === 'csv' ? 'active' : '']" @click="setExportFormat('csv')">数据表格 (CSV)</div>
             <div :class="['export-tab', exportFormat === 'text' ? 'active' : '']" @click="setExportFormat('text')">练习统计 (文本)</div>
           </div>
           <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
             <input type="date" v-model="exportStart" class="export-date-input" />
             <span style="font-size:13px; color:#8e8e93;">至</span>
             <input type="date" v-model="exportEnd" class="export-date-input" />
           </div>
           <div style="font-size:12px; color:#8e8e93; margin-bottom:6px;">所选区间共 {{filteredCount}} 条记录</div>
           <div v-if="exportFormat === 'csv'" style="font-size:11px; color:#8e8e93; margin-bottom:10px; line-height:1.5;">
             CSV 通用格式，手机可直接预览，电脑用 Excel/WPS/Numbers 打开。
           </div>
           <div v-else style="font-size:11px; color:#8e8e93; margin-bottom:10px; line-height:1.5;">
             文本报告，按日汇总练习时间、组数和各模式正确率。
           </div>
           <div style="display:flex; gap:8px;">
             <button class="btnGhost small" style="font-size:13px; flex:1; height:40px; line-height:40px;" @click="closeExport">收起</button>
             <button class="btnPrimary" style="height:40px; line-height:40px; font-size:14px; flex:2; box-shadow:none;" @click="doExport">
               {{ exportFormat === 'text' ? '导出 .txt' : '导出 .csv' }}
             </button>
           </div>
        </div>
        <div v-else>
           <button class="btnGhost glass-btn" style="height:44px; line-height:44px; font-size:16px; margin-bottom:15px; color:#34c759;" @click="openExport">📥 导出区间数据 (表格 / 文本)</button>
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

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { MODE_GROUPS, DIVISOR_LIST, getModeConfig } from './lib/game-modes';
import { useToast } from './composables/useToast';
import { useHistory } from './composables/useHistory';
import { useChart } from './composables/useChart';
import { useGame } from './composables/useGame';
import { useThreeScene } from './composables/useThreeScene';
import { useExport } from './composables/useExport';

const viewState = ref('home');

const { toast, showToast } = useToast();
const history = useHistory();
const chart = useChart(history.list);
const game = useGame({ viewState, history });
const three = useThreeScene({ viewState });
const exportTool = useExport({ historyListRef: history.list, showToast });

// Game state + actions (exposed to template)
const {
  currentModeKey, input, inputArray, decompStep,
  uiHint, totalText, progressText, qText, leftText,
  trainLog, results, isHistoryReview,
  activeConfig, isSmallFont, resultTitle, resultMeta,
  setMode, toSelectDivisor, selectDivisorAndStart,
  startGame,
  pressDigit, pressDot, clearInput, backspace, leftAction,
  confirmAnswer,
  goHome,
} = game;

// History list + chart
const historyList = history.list;
const {
  showChart, chartTab, availableModes,
  switchChartTab, closeChart, initChart,
} = chart;

// Export to CSV / Text report
const {
  showExport, exportFormat, exportStart, exportEnd, filteredCount,
  openExport, closeExport, setExportFormat, doExport,
} = exportTool;

// 3D mode
const {
  cubicMode, isDeleteMode, showShapeMenu, sliceMenuCollapsed,
  currentShapeName, colors, selectedColor, sliceConfig,
  examShapes,
  startCubicMode, quitCubicMode,
  switchColor, toggleDeleteMode,
  setCameraView, lookAtSection,
  loadExamShape, clearCubes, resetSlice,
} = three;

// Static menu data
const modeGroups = MODE_GROUPS;
const divisorList = DIVISOR_LIST;

// View-orchestrating actions that wire multiple composables.
const openHistory = () => {
  viewState.value = 'history';
  chart.reopenIfActive();
};

const backToHistory = () => {
  viewState.value = 'history';
  chart.reopenIfActive();
};

const closeHistory = () => { viewState.value = 'home'; };

const viewHistoryDetail = (index) => {
  game.viewHistoryDetail(history.list.value[index]);
};

const clearOldest = () => {
  if (!confirm(`当前共有 ${history.list.value.length} 条记录。\n确定要清除【最早的 1000 条】数据吗？`)) return;
  history.clearOldest(1000);
  showToast('清理成功');
  if (chart.showChart.value) chart.initChart();
};

const clearHistory = () => {
  if (!confirm('【严重警告】\n确定要清空【所有】历史记录吗？\n此操作不可恢复！')) return;
  history.clearAll();
  showToast('所有记录已清空');
};

onBeforeUnmount(() => {
  three.cleanup();
});
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

.export-date-input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-size: 14px;
  color: #1c1c1e;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}
.export-date-input:focus {
  border-color: rgba(0, 122, 255, 0.4);
  background: rgba(255, 255, 255, 0.85);
}

.export-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 10px;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 12px;
}
.export-tab {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 7px 6px;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.export-tab.active {
  background: #fff;
  color: #000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}
</style>
