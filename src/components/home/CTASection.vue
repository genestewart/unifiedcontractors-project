<template>
  <section class="cta-section">
    <div class="container">
      <div class="cta-wrapper">
        <div class="cta-content">
          <h2>Ready to Start Your Project?</h2>
          <p>
            Get a free consultation and estimate from Park City's most trusted construction experts. 
            We're here to bring your vision to life.
          </p>
          <div class="cta-features">
            <span><i class="pi pi-check" /> Free Estimates</span>
            <span><i class="pi pi-check" /> Licensed & Insured</span>
            <span><i class="pi pi-check" /> 25+ Years Experience</span>
          </div>
          <div class="cta-actions">
            <RouterLink
              to="/contact"
              class="btn-cta-primary"
            >
              Start Your Project
            </RouterLink>
            <a
              href="tel:435-555-0100"
              class="btn-cta-secondary"
            >
              <i class="pi pi-phone" /> Call Now: (435) 555-0100
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="cta-background" />
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.cta-section {
  position: relative;
  padding: 5rem 0;
  overflow: hidden;
}

.cta-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--uc-primary), var(--uc-primary-dark));
  z-index: -1;
}

.cta-wrapper {
  background: white;
  border-radius: var(--uc-radius-lg);
  padding: 4rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.cta-content h2 {
  color: var(--uc-dark);
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-content p {
  color: var(--uc-gray);
  font-size: 1.25rem;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-features {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.cta-features span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--uc-dark);
  font-weight: 500;
}

.cta-features i {
  color: var(--uc-primary);
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-cta-primary {
  background: var(--uc-secondary);
  color: white;
  padding: 1rem 2.5rem;
  border-radius: var(--uc-radius);
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s;
  display: inline-block;
}

.btn-cta-primary:hover {
  background: var(--uc-secondary-dark);
  transform: translateY(-2px);
  box-shadow: var(--uc-shadow-md);
}

.btn-cta-secondary {
  background: transparent;
  color: var(--uc-primary);
  padding: 1rem 2rem;
  border: 2px solid var(--uc-primary);
  border-radius: var(--uc-radius);
  font-size: 1.1rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.btn-cta-secondary:hover {
  background: var(--uc-primary);
  color: white;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .cta-wrapper {
    padding: 2rem;
  }
  
  .cta-content h2 {
    font-size: 2rem;
  }
  
  .cta-content p {
    font-size: 1.1rem;
  }
  
  .cta-actions {
    flex-direction: column;
  }
  
  .btn-cta-primary,
  .btn-cta-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>