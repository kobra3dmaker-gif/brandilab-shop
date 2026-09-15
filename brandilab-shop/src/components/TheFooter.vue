<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-col brand-col">
          <h3 class="footer-brand">BrandiLab</h3>
          <p class="footer-text">
            Precision 3D printing for unique designs. We bring imagination to reality with high-quality materials and craftsmanship.
          </p>
        </div>
        
        <div class="footer-col">
          <h4 class="col-title">Quick Links</h4>
          <nav class="footer-nav">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/shop">Shop</RouterLink>
            <RouterLink to="/about">About</RouterLink>
            <RouterLink to="/contact">Contact</RouterLink>
          </nav>
        </div>

        <div class="footer-col">
          <h4 class="col-title">About</h4>
          <nav class="footer-nav">
            <RouterLink to="/about#story">Our Story</RouterLink>
            <RouterLink to="/about#materials">Materials</RouterLink>
            <RouterLink to="/faq">FAQ</RouterLink>
          </nav>
        </div>

        <div class="footer-col">
          <h4 class="col-title">Contact</h4>
          <address class="footer-address">
            <p>Email: <a href="mailto:info@brandilab.it">info@brandilab.it</a></p>
            <p>Location: Italy</p>
          </address>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="footer-container bottom-container">
        <p class="copyright">© 2026 BrandiLab. All rights reserved.</p>
        <div class="social-links">
          <a href="#" aria-label="Instagram">📸</a>
          <a href="#" aria-label="Twitter">🐦</a>
          <a href="#" aria-label="GitHub">🐙</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Footer component logic
</script>

<style scoped>
.footer {
  background-color: var(--color-primary, #1a1a2e);
  color: var(--color-surface, #ffffff);
  font-family: var(--font-family, sans-serif);
  padding-top: 64px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  margin-bottom: 64px;
}

@media (min-width: 640px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .footer-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
}

.footer-brand {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  color: var(--color-surface, #ffffff);
}

.footer-text {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.col-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--color-surface, #ffffff);
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-nav a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: var(--transition, all 0.3s ease);
  font-size: 0.95rem;
}

.footer-nav a:hover {
  color: var(--color-accent, #16a085);
}

.footer-address {
  font-style: normal;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  font-size: 0.95rem;
}

.footer-address p {
  margin: 0 0 8px 0;
}

.footer-address a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: var(--transition, all 0.3s ease);
}

.footer-address a:hover {
  color: var(--color-accent, #16a085);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 0;
}

.bottom-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

@media (min-width: 640px) {
  .bottom-container {
    flex-direction: row;
    justify-content: space-between;
  }
}

.copyright {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 1.25rem;
  transition: var(--transition, all 0.3s ease);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.social-links a:hover {
  transform: translateY(-2px);
  color: var(--color-surface, #ffffff);
}
</style>
