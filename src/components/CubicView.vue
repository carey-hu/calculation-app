<template>
  <div class="wrap full-height" style="padding:0; overflow:hidden;">
    <div id="three-container" style="width:100%; height:100%; display:block; outline:none; touch-action: none;"></div>

    <div class="cubic-ui safe-top">
      <div class="glass-panel" style="padding: 8px 12px; display: flex; gap: 8px; align-items: center; border-radius: 24px; max-width: 98%; overflow-x: auto;">
        <button class="btnBack glass-btn small-btn" @click="$emit('quitCubicMode')">🔙</button>
        <div class="divider"></div>

        <template v-if="cubicMode === 'section'">
          <div style="position:relative;">
            <button class="btnGhost small-btn" @click="$emit('toggleShapeMenu')" style="font-size:13px; color:#5856d6; font-weight:700;">
              📂 题库 ({{ currentShapeName }})
            </button>
          </div>
          <div class="divider"></div>
          <button class="view-btn" style="background:#000; color:#fff; border:none;" @click="$emit('lookAtSection')">👀 正视切面</button>
        </template>

        <template v-else>
          <div style="display:flex; gap:4px;">
            <div v-for="c in colors" :key="c"
              :style="{backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none'}"
              :class="['color-dot', selectedColor === c && !isDeleteMode ? 'active' : '']"
              @click="$emit('switchColor', c)"></div>
          </div>
          <div class="divider"></div>
          <button :class="['btnIcon', isDeleteMode ? 'active' : '']" @click="$emit('toggleDeleteMode')">🗑️</button>
          <button class="btnIcon" @click="$emit('clearCubes')">🔄</button>
        </template>
      </div>

      <div class="view-selector glass-panel">
        <button class="view-btn" @click="$emit('setCameraView', 'front')">正</button>
        <button class="view-btn" @click="$emit('setCameraView', 'left')">左</button>
        <button class="view-btn" @click="$emit('setCameraView', 'top')">俯</button>
        <button class="view-btn" @click="$emit('setCameraView', 'iso')">轴</button>
      </div>

      <div class="tip-toast" v-if="cubicMode === 'block'">点击地面放置，点击方块叠加</div>
      <div class="tip-toast" v-if="cubicMode === 'section'" style="background:rgba(88,86,214,0.85);">请调节下方滑块观察截面变化</div>
    </div>

    <!-- Shape menu -->
    <div v-if="showShapeMenu && cubicMode === 'section'" class="shape-menu-container">
      <div class="shape-menu glass-panel">
        <template v-for="(shapes, groupName) in examShapes" :key="groupName">
          <div class="shape-group-title">{{ shapeGroupLabels[groupName as string] || groupName }}</div>
          <div class="shape-grid">
            <div v-for="s in shapes" :key="s.name" class="shape-item" @click="$emit('loadExamShape', s)">{{ s.name }}</div>
          </div>
        </template>
      </div>
    </div>

    <!-- Slice panel -->
    <div v-if="cubicMode === 'section'" :class="['slice-panel-container', sliceMenuCollapsed ? 'collapsed' : '']">
      <div class="glass-panel slice-panel-content">
        <div class="panel-header" @click="$emit('toggleSliceMenu')">
          <div class="sheet-handle"></div>
          <div class="header-row">
            <span class="header-title">📐 切面调节</span>
            <span class="header-toggle-text">{{ sliceMenuCollapsed ? '展开' : '收起' }}</span>
          </div>
        </div>

        <div v-if="!sliceMenuCollapsed" class="controls-body">
          <div class="slice-row">
            <span class="slice-label">位移</span>
            <input type="range" min="-8" max="8" step="0.1" :value="sliceConfig.constant" @input="$emit('update:sliceConstant', parseFloat(($event.target as HTMLInputElement).value))" class="slice-slider">
          </div>
          <div class="slice-row">
            <span class="slice-label">X旋转</span>
            <input type="range" min="0" max="180" step="1" :value="sliceConfig.rotX" @input="$emit('update:sliceRotX', parseInt(($event.target as HTMLInputElement).value, 10))" class="slice-slider">
          </div>
          <div class="slice-row">
            <span class="slice-label">Y旋转</span>
            <input type="range" min="0" max="180" step="1" :value="sliceConfig.rotY" @input="$emit('update:sliceRotY', parseInt(($event.target as HTMLInputElement).value, 10))" class="slice-slider">
          </div>
          <div class="slice-row">
            <span class="slice-label">Z旋转</span>
            <input type="range" min="0" max="180" step="1" :value="sliceConfig.rotZ" @input="$emit('update:sliceRotZ', parseInt(($event.target as HTMLInputElement).value, 10))" class="slice-slider">
          </div>
          <div style="margin-top: 12px;">
            <button class="btnGhost ios-reset-btn" @click="$emit('resetSlice')">重置位置</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SliceConfig, ExamShapeDef } from '../types';

const shapeGroupLabels: Record<string, string> = {
  basic: '基础柱体/多面体',
  curved: '曲面体 (锥/台/球)',
  hollow: '高频挖空 (修复版)',
  composite: '组合与拼接',
  special: '异形构造',
};

defineProps<{
  cubicMode: string;
  isDeleteMode: boolean;
  showShapeMenu: boolean;
  sliceMenuCollapsed: boolean;
  currentShapeName: string;
  colors: string[];
  selectedColor: string;
  sliceConfig: SliceConfig;
  examShapes: Record<string, ExamShapeDef[]>;
}>();

defineEmits<{
  quitCubicMode: [];
  toggleShapeMenu: [];
  toggleSliceMenu: [];
  switchColor: [c: string];
  toggleDeleteMode: [];
  setCameraView: [type: string];
  lookAtSection: [];
  loadExamShape: [shape: ExamShapeDef];
  clearCubes: [];
  resetSlice: [];
  'update:sliceConstant': [v: number];
  'update:sliceRotX': [v: number];
  'update:sliceRotY': [v: number];
  'update:sliceRotZ': [v: number];
}>();
</script>
