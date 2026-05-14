<template>
  <div class="wrap homeWrap">
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
              <button class="btnGhost glass-btn" style="margin-top:0; height:45px; line-height:45px; font-size:16px;" @click="$emit('toSelectDivisor')">
                进入除数选择模式
              </button>
            </div>

            <div class="modeRow" v-else>
              <div
                v-for="modeKey in group.modes"
                :key="modeKey"
                :class="['modeItem', currentModeKey === modeKey ? 'active' : '']"
                @click="$emit('setMode', modeKey)"
              >
                <span class="modeTitle">{{ getModeConfig(modeKey).name }}</span>
              </div>
            </div>
          </template>

          <div class="rowLabel">空间思维专项 (公考行测)</div>
          <div class="modeRow">
            <div class="modeItem" style="flex: 1 0 45%; background: rgba(0,122,255,0.08); border-color: rgba(0,122,255,0.2);" @click="$emit('startCubicMode', 'block')">
              <span class="modeTitle" style="color: #007aff;">🧱 立体拼合</span>
            </div>
            <div class="modeItem" style="flex: 1 0 45%; background: rgba(88,86,214,0.1); border-color: rgba(88,86,214,0.2);" @click="$emit('startCubicMode', 'section')">
              <span class="modeTitle" style="color: #5856d6;">🔪 立体截面</span>
            </div>
          </div>
          <div style="height: 20px;"></div>
        </div>

        <div class="card-bottom-actions">
          <div class="separator-line"></div>
          <button class="btnPrimary main-action-btn" @click="$emit('startGame')">开始练习</button>
          <button class="btnHistory main-action-btn" @click="$emit('openHistory')">历史记录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModeGroup, GameModeConfig } from '../types';
import { GAME_MODES } from '../lib/game-modes';

defineProps<{
  modeGroups: Record<string, ModeGroup>;
  currentModeKey: string;
}>();

defineEmits<{
  setMode: [key: string];
  toSelectDivisor: [];
  startGame: [];
  openHistory: [];
  startCubicMode: [mode: 'block' | 'section'];
}>();

const getModeConfig = (key: string): GameModeConfig => GAME_MODES[key] || { name: key };
</script>
