<template>
  <section class="hero">
    <div class="hero-background">
      <div class="hero-overlay" />
    </div>
    <div class="container">
      <div class="row align-items-center min-vh-100">
        <div class="col-lg-6">
          <div class="hero-content">
            <h1 class="hero-title">
              Building Dreams,<br>
              <span class="text-primary">Protecting Homes</span>
            </h1>
            <p class="hero-subtitle">
              Park City's trusted construction and restoration experts with 25+ years 
              of excellence in custom homes, remodeling, and water mitigation services.
            </p>
            <div class="hero-badges">
              <span class="badge"><i class="pi pi-check-circle" /> Licensed & Insured</span>
              <span class="badge"><i class="pi pi-star-fill" /> Family-Owned</span>
              <span class="badge"><i class="pi pi-shield" /> 25+ Years Experience</span>
            </div>
            <div class="hero-actions">
              <RouterLink
                to="/contact"
                class="btn-primary btn-lg"
              >
                Get Free Estimate
              </RouterLink>
              <a
                href="tel:435-555-0100"
                class="btn-outline"
              >
                <i class="pi pi-phone" /> Call (435) 555-0100
              </a>
            </div>
            <div class="hero-stats">
              <div class="stat">
                <h3>500+</h3>
                <p>Projects Completed</p>
              </div>
              <div class="stat">
                <h3>98%</h3>
                <p>Customer Satisfaction</p>
              </div>
              <div class="stat">
                <h3>24/7</h3>
                <p>Emergency Service</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="hero-image-wrapper">
            <div class="hero-card">
              <h3>Our Services</h3>
              <ul class="service-list">
                <li><i class="pi pi-home" /> Custom Home Construction</li>
                <li><i class="pi pi-pencil" /> Professional Design Services</li>
                <li><i class="pi pi-wrench" /> Complete Remodeling</li>
                <li><i class="pi pi-shield" /> Water Damage Restoration</li>
                <li><i class="pi pi-bolt" /> Sump Pump Systems</li>
              </ul>
              <RouterLink
                to="/services"
                class="learn-more"
              >
                View All Services <i class="pi pi-arrow-right" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  z-index: -1;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(5, 179, 242, 0.1) 0%, rgba(227, 4, 20, 0.05) 100%);
}

.hero-content {
  padding: 2rem 0;
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  color: var(--uc-dark);
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--uc-gray);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--uc-dark);
  box-shadow: var(--uc-shadow-sm);
}

.badge i {
  color: var(--uc-primary);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 3rem;
}

.btn-lg {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.btn-outline {
  background: white;
  color: var(--uc-primary);
  padding: 1rem 2rem;
  border: 2px solid var(--uc-primary);
  border-radius: var(--uc-radius);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: var(--uc-primary);
  color: white;
  transform: translateY(-2px);
}

.hero-stats {
  display: flex;
  gap: 3rem;
}

.stat h3 {
  font-size: 2.5rem;
  color: var(--uc-primary);
  margin-bottom: 0.25rem;
}

.stat p {
  font-size: 0.9rem;
  color: var(--uc-gray);
  margin: 0;
}

.hero-card {
  background: white;
  padding: 2.5rem;
  border-radius: var(--uc-radius-lg);
  box-shadow: var(--uc-shadow-lg);
  max-width: 450px;
  margin: 0 auto;
}

.hero-card h3 {
  color: var(--uc-dark);
  margin-bottom: 1.5rem;
}

.service-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
}

.service-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--uc-dark);
}

.service-list li:last-child {
  border-bottom: none;
}

.service-list i {
  color: var(--uc-primary);
  font-size: 1.2rem;
}

.learn-more {
  color: var(--uc-primary);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: gap 0.3s;
}

.learn-more:hover {
  gap: 1rem;
}

@media (max-width: 992px) {
  .hero-content {
    text-align: center;
  }

  .hero-badges,
  .hero-actions,
  .hero-stats {
    justify-content: center;
  }

  .hero-stats {
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 4rem 0;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .hero-card {
    margin-top: 3rem;
  }
}
</style>