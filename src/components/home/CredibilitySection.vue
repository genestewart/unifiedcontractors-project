<template>
  <section class="credibility section">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-lg-6">
          <div class="credibility-content">
            <h2>Why Choose <span class="text-primary">Unified Contractors</span></h2>
            <p class="lead">
              For over 25 years, we've been Park City's trusted partner in construction excellence, 
              combining traditional craftsmanship with modern innovation.
            </p>
            
            <div class="credibility-points">
              <div class="point">
                <div class="point-icon">
                  <i class="pi pi-users" />
                </div>
                <div class="point-content">
                  <h4>Family-Owned Heritage</h4>
                  <p>Multi-generational expertise with a personal touch and commitment to our community.</p>
                </div>
              </div>
              
              <div class="point">
                <div class="point-icon">
                  <i class="pi pi-verified" />
                </div>
                <div class="point-content">
                  <h4>Fully Licensed & Insured</h4>
                  <p>Complete peace of mind with comprehensive licensing, bonding, and insurance coverage.</p>
                </div>
              </div>
              
              <div class="point">
                <div class="point-icon">
                  <i class="pi pi-trophy" />
                </div>
                <div class="point-content">
                  <h4>Award-Winning Excellence</h4>
                  <p>Recognized as Park City's Best Contractor for quality craftsmanship and service.</p>
                </div>
              </div>
              
              <div class="point">
                <div class="point-icon">
                  <i class="pi pi-leaf" />
                </div>
                <div class="point-content">
                  <h4>Green Building Expertise</h4>
                  <p>LEED certified professionals delivering sustainable, energy-efficient solutions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-6">
          <div class="certifications">
            <div class="cert-grid">
              <div class="cert-item">
                <i class="pi pi-star-fill" />
                <h3>25+</h3>
                <p>Years in Business</p>
              </div>
              <div class="cert-item">
                <i class="pi pi-home" />
                <h3>500+</h3>
                <p>Homes Built</p>
              </div>
              <div class="cert-item">
                <i class="pi pi-percentage" />
                <h3>98%</h3>
                <p>Customer Satisfaction</p>
              </div>
              <div class="cert-item">
                <i class="pi pi-clock" />
                <h3>24/7</h3>
                <p>Emergency Response</p>
              </div>
            </div>
            
            <div class="associations">
              <h4>Professional Associations</h4>
              <ul>
                <li><i class="pi pi-check-circle" /> National Association of Home Builders</li>
                <li><i class="pi pi-check-circle" /> Park City Building Association</li>
                <li><i class="pi pi-check-circle" /> Utah Construction Alliance</li>
                <li><i class="pi pi-check-circle" /> Green Building Council Member</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.credibility {
  background: white;
}

.credibility-content {
  padding-right: 3rem;
}

.lead {
  font-size: 1.125rem;
  color: var(--uc-gray);
  margin-bottom: 2rem;
}

.credibility-points {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.point {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.point-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(5, 179, 242, 0.1), rgba(5, 179, 242, 0.05));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.point-icon i {
  font-size: 1.5rem;
  color: var(--uc-primary);
}

.point-content h4 {
  color: var(--uc-dark);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.point-content p {
  color: var(--uc-gray);
  margin: 0;
}

.certifications {
  background: linear-gradient(135deg, #f8f9fa, white);
  padding: 2rem;
  border-radius: var(--uc-radius-lg);
}

.cert-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

.cert-item {
  text-align: center;
  padding: 1.5rem;
  background: white;
  border-radius: var(--uc-radius);
  box-shadow: var(--uc-shadow-sm);
}

.cert-item i {
  font-size: 2rem;
  color: var(--uc-primary);
  margin-bottom: 1rem;
}

.cert-item h3 {
  font-size: 2.5rem;
  color: var(--uc-secondary);
  margin-bottom: 0.5rem;
}

.cert-item p {
  color: var(--uc-gray);
  margin: 0;
  font-size: 0.9rem;
}

.associations h4 {
  color: var(--uc-dark);
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.associations ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.associations li {
  padding: 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--uc-dark);
  border-bottom: 1px solid #eee;
}

.associations li:last-child {
  border-bottom: none;
}

.associations i {
  color: var(--uc-primary);
}

@media (max-width: 992px) {
  .credibility-content {
    padding-right: 0;
    margin-bottom: 3rem;
  }
}

@media (max-width: 576px) {
  .cert-grid {
    grid-template-columns: 1fr;
  }
}
</style>