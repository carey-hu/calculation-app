<template>
  <div class="mesh-bg">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
</template>

<style scoped>
.mesh-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.7;
  animation: float 10s infinite alternate ease-in-out;
}

.orb-1 {
  width: 350px;
  height: 350px;
  background: #a2d2ff;
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: #e2c2ff;
  bottom: -50px;
  right: -80px;
  animation-delay: -3s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: #ffdfba;
  top: 40%;
  left: 30%;
  opacity: 0.5;
  animation-delay: -6s;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, 30px); }
}
</style>
