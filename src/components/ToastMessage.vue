<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="show" class="toast-mask">
        <div class="toast-content">{{ message }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  message: String
})
</script>

<style scoped>
.toast-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  pointer-events: none;
}

.toast-content {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #fff;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
