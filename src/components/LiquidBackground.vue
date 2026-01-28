<template>
  <div class="liquid-bg">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
    <div class="blob blob-4"></div>
  </div>
</template>

<style scoped>
.liquid-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  animation: float 15s infinite ease-in-out;
}

.blob-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(100, 180, 255, 0.6) 0%, rgba(150, 200, 255, 0.4) 100%);
  top: -80px;
  left: -60px;
  animation-delay: 0s;
}

.blob-2 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, rgba(200, 150, 255, 0.5) 0%, rgba(230, 180, 255, 0.3) 100%);
  top: 30%;
  right: -50px;
  animation-delay: -4s;
  animation-duration: 18s;
}

.blob-3 {
  width: 280px;
  height: 280px;
  background: linear-gradient(135deg, rgba(255, 180, 200, 0.5) 0%, rgba(255, 200, 220, 0.3) 100%);
  bottom: 10%;
  left: -40px;
  animation-delay: -8s;
  animation-duration: 20s;
}

.blob-4 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(150, 230, 200, 0.5) 0%, rgba(180, 240, 220, 0.3) 100%);
  bottom: 30%;
  right: 20%;
  animation-delay: -12s;
  animation-duration: 22s;
}

@keyframes float {
  0%, 100% { 
    transform: translate(0, 0) scale(1); 
  }
  25% { 
    transform: translate(30px, -20px) scale(1.05); 
  }
  50% { 
    transform: translate(-20px, 30px) scale(0.95); 
  }
  75% { 
    transform: translate(20px, 20px) scale(1.02); 
  }
}
</style>
