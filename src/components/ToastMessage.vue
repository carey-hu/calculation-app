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
  background: rgba(30, 30, 30, 0.75);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  color: rgba(255, 255, 255, 0.95);
  padding: 14px 28px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
