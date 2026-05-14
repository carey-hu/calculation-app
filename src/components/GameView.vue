<template>
  <div class="wrap gameRoot">
    <div class="topbar safe-top">
      <button class="btnBack glass-btn" @click="$emit('goHome')">返回</button>
      <div class="topStats">
        <div class="stat glass-pill">{{ progressText }}</div>
        <div class="stat glass-pill timer">⏱ {{ totalText }}</div>
      </div>
    </div>
    <div class="gameMain">
      <div class="card qCard glass-panel">
        <div :class="['qText', isSmallFont ? 'qText-small' : '']">{{ qText }}</div>
        <div class="qNote">{{ activeConfig.hintNote || activeConfig.hint || '精确到整数' }}</div>

        <!-- divScale: 3-digit dividend + 1-digit divisor -->
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

        <!-- carryJudge / borrowJudge: two-box input -->
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

        <!-- digitDetermine: 4-slot input -->
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

        <!-- decompAdd: 3-step input -->
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
          <div class="ansBox glass-input">答案：{{ input ? input : '—' }}</div>
        </template>

        <div class="hint" v-if="uiHint">{{ uiHint }}</div>
      </div>
    </div>
    <div class="keypad card glass-panel">
      <div class="fnRow">
        <button class="kFn style-skip" @click="$emit('leftAction')">{{ leftText }}</button>
        <button class="kFn style-clear" @click="$emit('clearInput')">清空</button>
        <button class="kFn style-del" @click="$emit('backspace')">退格</button>
      </div>

      <!-- carryJudge keypad -->
      <div class="grid" v-if="currentModeKey === 'carryJudge'" style="grid-template-columns: 1fr 1fr;">
        <button class="k glass-key" style="height: 140px; font-size: 48px; color: #34c759;" @click="$emit('pressDigit', '1')">1<span style="font-size:16px; display:block;">(进位)</span></button>
        <button class="k glass-key" style="height: 140px; font-size: 48px; color: #ff3b30;" @click="$emit('pressDigit', '0')">0<span style="font-size:16px; display:block;">(不进)</span></button>
        <button class="k confirm glass-key-confirm" style="grid-column: 1 / 3;" @click="$emit('confirmAnswer')">确认</button>
      </div>

      <!-- borrowJudge keypad -->
      <div class="grid" v-else-if="currentModeKey === 'borrowJudge'" style="grid-template-columns: 1fr 1fr;">
        <button class="k glass-key" style="height: 140px; font-size: 48px; color: #ff3b30;" @click="$emit('pressDigit', '-1')">-1<span style="font-size:16px; display:block;">(退位)</span></button>
        <button class="k glass-key" style="height: 140px; font-size: 48px; color: #34c759;" @click="$emit('pressDigit', '0')">0<span style="font-size:16px; display:block;">(不退)</span></button>
        <button class="k confirm glass-key-confirm" style="grid-column: 1 / 3;" @click="$emit('confirmAnswer')">确认</button>
      </div>

      <!-- standard keypad -->
      <div class="grid" v-else>
        <button v-for="item in [1,2,3,4,5,6,7,8,9]" :key="item" class="k glass-key" @click="$emit('pressDigit', item)">{{ item }}</button>
        <button class="k glass-key" @click="$emit('pressDot')">.</button>
        <button class="k glass-key" @click="$emit('pressDigit', 0)">0</button>
        <button class="k confirm glass-key-confirm" @click="$emit('confirmAnswer')">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameModeConfig } from '../types';

defineProps<{
  currentModeKey: string;
  input: string;
  inputArray: string[];
  decompStep: number;
  uiHint: string;
  totalText: string;
  progressText: string;
  qText: string;
  leftText: string;
  activeConfig: GameModeConfig;
  isSmallFont: boolean;
}>();

defineEmits<{
  goHome: [];
  pressDigit: [d: number | string];
  pressDot: [];
  clearInput: [];
  backspace: [];
  leftAction: [];
  confirmAnswer: [];
}>();
</script>
