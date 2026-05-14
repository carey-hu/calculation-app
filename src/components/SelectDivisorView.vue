<template>
  <div class="wrap homeWrap">
    <div class="header-area">
      <div class="title">选择除数</div>
      <div class="subtitle">点击下方数字开始练习商首位</div>
    </div>
    <div class="card glass-panel" style="flex:1; overflow-y:auto;">
      <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <button v-for="item in divisorList" :key="item" class="k glass-key" style="font-size:20px; height:50px; line-height:50px;" @click="$emit('selectDivisorAndStart', item)">{{ item }}</button>
      </div>
      <button class="btnGhost glass-btn main-action-btn" style="margin-top: 20px;" @click="$emit('goHome')">返回主页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  divisorList: number[];
}>();

defineEmits<{
  selectDivisorAndStart: [d: number];
  goHome: [];
}>();
</script>
