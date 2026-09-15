<template>
  <section class="hero">
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>
    
    <div class="hero-content">
      <h1 class="hero-title">3D Printed Creations</h1>
      <p class="hero-subtitle">Handcrafted with precision and unique designs.</p>
      <RouterLink to="/shop" class="hero-btn">Shop Now</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
// Hero component logic
</script>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary, #1a1a2e) 0%, var(--color-accent, #16a085) 100%);
  overflow: hidden;
  padding: 40px 24px;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.hero-title {
  font-family: var(--font-family, sans-serif);
  color: var(--color-surface, #ffffff);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -1px;
}

.hero-subtitle {
  font-family: var(--font-family, sans-serif);
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  font-weight: 400;
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
}

.hero-btn {
  display: inline-block;
  background-color: var(--color-surface, #ffffff);
  color: var(--color-primary, #1a1a2e);
  font-family: var(--font-family, sans-serif);
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  padding: 16px 32px;
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
  transition: var(--transition, all 0.3s ease);
  margin-top: 16px;
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.12));
  color: var(--color-accent, #16a085);
}

.hero-btn:active {
  transform: translateY(0);
}

/* Floating Shapes */
.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 20s infinite linear;
}

.shape-1 {
  width: 150px;
  height: 150px;
  top: 10%;
  left: 10%;
  animation-duration: 25s;
}

.shape-2 {
  width: 80px;
  height: 80px;
  top: 60%;
  left: 20%;
  animation-duration: 15s;
  animation-direction: reverse;
}

.shape-3 {
  width: 200px;
  height: 200px;
  top: 40%;
  right: 10%;
  animation-duration: 30s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 80%;
  right: 30%;
  animation-duration: 20s;
  animation-direction: reverse;
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -50px) rotate(120deg);
  }
  66% {
    transform: translate(-20px, 20px) rotate(240deg);
  }
  100% {
    transform: translate(0, 0) rotate(360deg);
  }
}
</style>
