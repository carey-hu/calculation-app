<template>
  <div class="wrap full-height">
    <div class="header-area safe-header">
      <div class="title">{{ resultTitle }}</div>
      <div class="subtitle">{{ resultMeta }}</div>
    </div>
    <div class="card full-flex glass-panel">
      <div class="resultScroll">
        <!-- train mode log -->
        <template v-if="currentModeKey === 'train'">
          <div v-for="(item, index) in trainLog" :key="index" class="row">
            <span class="rowLeft" style="white-space: normal; word-break: break-all; overflow: visible; line-height: 1.4;">{{ index + 1 }}. {{ item.q }}</span>
            <span class="rowRight">
              <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff3b30' : 'inherit' }">{{ item.usedStr }}</span> / 错{{ item.wrong }}{{ item.skipped ? '(跳)' : '' }}
            </span>
          </div>
        </template>
        <!-- non-train mode results -->
        <template v-else>
          <div v-for="(item, index) in results" :key="index" class="row">
            <span class="rowLeft" style="white-space: normal; word-break: break-all; overflow: visible; line-height: 1.4;">{{ index + 1 }}. {{ item.q }} = {{ item.yourAns }}</span>
            <span class="rowRight" style="display:flex; flex-direction:column; align-items:flex-end;">
              <div>
                <span style="margin-right:4px; font-size:13px; color:#666;">{{ item.usedStr }}</span>
                <span>{{ item.ok ? '✅' : '❌' }}</span>
                <span v-if="!item.ok" style="color:#ff3b30; font-size:13px; margin-left:2px; font-weight:700;">({{ item.realAns }})</span>
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
          <button class="btnPrimary glass-primary main-action-btn" @click="$emit('backToHistory')">返回列表</button>
        </div>
        <div v-else>
          <button class="btnPrimary glass-primary main-action-btn" @click="$emit('goHome')">返回主页</button>
          <button class="btnGhost glass-btn main-action-btn" @click="$emit('startGame')" style="margin-top:10px;">再来一局</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResultItem, TrainLogItem } from '../types';

defineProps<{
  currentModeKey: string;
  resultTitle: string;
  resultMeta: string;
  trainLog: TrainLogItem[];
  results: ResultItem[];
  isHistoryReview: boolean;
}>();

defineEmits<{
  goHome: [];
  startGame: [];
  backToHistory: [];
}>();
</script>
