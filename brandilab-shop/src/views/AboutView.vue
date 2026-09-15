<script setup lang="ts">
</script>

<template>
  <main class="about-view">
    <header class="about-header">
      <div class="container">
        <h1 class="title">About BrandiLab</h1>
        <p class="subtitle">Crafting the future, one layer at a time.</p>
      </div>
    </header>

    <section class="section story-section">
      <div class="container">
        <div class="story-grid">
          <div class="story-text">
            <h2>Our Story</h2>
            <p>
              Based in the heart of Italy, BrandiLab is a passionate 3D printing studio dedicated to transforming digital concepts into physical realities. What started as a fascination with additive manufacturing has grown into a specialized service creating unique, high-quality products.
            </p>
            <p>
              We believe that good design should be accessible, sustainable, and crafted with care. Whether it's functional tools, aesthetic home decor, or custom parts, we approach every print with the same level of dedication and precision.
            </p>
          </div>
          <div class="story-image">
            <div class="image-placeholder">
              <span>Studio Image</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section process-section">
      <div class="container">
        <h2 class="section-title">Our Process</h2>
        <div class="process-steps">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-icon">✏️</div>
            <h3>Design</h3>
            <p>We design each product digitally with precision CAD tools</p>
          </div>
          <div class="step-connector"></div>
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-icon">🖨️</div>
            <h3>Print</h3>
            <p>Printed layer by layer using premium materials on pro-grade printers</p>
          </div>
          <div class="step-connector"></div>
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-icon">📦</div>
            <h3>Ship</h3>
            <p>Quality checked and carefully packaged for delivery</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section values-section">
      <div class="container">
        <div class="mission-box">
          <h2>Our Mission</h2>
          <p>
            To provide innovative, durable, and sustainable 3D printed solutions that inspire creativity and solve everyday problems, while maintaining the highest standards of craftsmanship and environmental responsibility.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.about-view {
  background-color: var(--color-bg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section {
  padding: 5rem 0;
}

.about-header {
  background-color: var(--color-primary);
  color: white;
  padding: 6rem 1rem;
  text-align: center;
}

.title {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  font-weight: 300;
}

.story-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 768px) {
  .story-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.story-text h2 {
  font-size: 2.2rem;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

.story-text p {
  color: var(--color-text-light);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.image-placeholder {
  background-color: var(--color-border);
  border-radius: var(--radius-md);
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  font-size: 1.2rem;
  font-weight: 500;
}

.process-section {
  background-color: var(--color-surface);
}

.section-title {
  text-align: center;
  font-size: 2.2rem;
  color: var(--color-primary);
  margin-bottom: 4rem;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

@media (min-width: 768px) {
  .process-steps {
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
  }
}

.step-card {
  text-align: center;
  max-width: 300px;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  background-color: var(--color-accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 auto 1rem;
}

.step-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.step-card h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.step-card p {
  color: var(--color-text-light);
  line-height: 1.6;
}

.step-connector {
  display: none;
}

@media (min-width: 768px) {
  .step-connector {
    display: block;
    width: 100px;
    height: 2px;
    background-color: var(--color-border);
    margin-top: 20px;
  }
}

.values-section {
  background-color: var(--color-bg);
}

.mission-box {
  background-color: var(--color-primary);
  color: white;
  padding: 4rem 2rem;
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.mission-box h2 {
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
}

.mission-box p {
  font-size: 1.25rem;
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
  opacity: 0.9;
}
</style>
