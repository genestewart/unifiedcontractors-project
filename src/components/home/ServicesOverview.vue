<template>
  <section class="services-overview section">
    <div class="container">
      <div class="text-center mb-5">
        <h2>Our Comprehensive Services</h2>
        <p class="lead">
          Full-spectrum construction and restoration solutions for Park City homes
        </p>
      </div>
      
      <div class="row g-4">
        <div
          v-for="service in services"
          :key="service.id"
          class="col-md-6 col-lg-4"
        >
          <div class="service-card">
            <div class="service-icon">
              <i :class="service.icon" />
            </div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
            <ul class="service-features">
              <li
                v-for="feature in service.features"
                :key="feature"
              >
                <i class="pi pi-check" /> {{ feature }}
              </li>
            </ul>
            <RouterLink
              :to="`/services#${service.slug}`"
              class="service-link"
            >
              Learn More <i class="pi pi-arrow-right" />
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="text-center mt-5">
        <RouterLink
          to="/services"
          class="btn-primary"
        >
          View All Services
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const services = [
  {
    id: 1,
    title: 'Custom Home Construction',
    slug: 'custom-homes',
    icon: 'pi pi-home',
    description: 'Build your dream home with our expert team. From luxury mountain retreats to modern family homes.',
    features: ['Architectural Design', 'LEED Certification', 'Mountain Expertise']
  },
  {
    id: 2,
    title: 'Design Services',
    slug: 'design',
    icon: 'pi pi-palette',
    description: 'Professional architectural and interior design services to bring your vision to life.',
    features: ['3D Visualization', 'Space Planning', 'Material Selection']
  },
  {
    id: 3,
    title: 'Complete Remodeling',
    slug: 'remodeling',
    icon: 'pi pi-wrench',
    description: 'Transform your existing space with our comprehensive remodeling services.',
    features: ['Kitchen & Bath', 'Basement Finishing', 'Whole Home Renovations']
  },
  {
    id: 4,
    title: 'Water Damage Restoration',
    slug: 'water-mitigation',
    icon: 'pi pi-shield',
    description: '24/7 emergency response for water damage. Fast, professional restoration services.',
    features: ['60-Minute Response', 'Insurance Claims Help', 'Mold Prevention']
  },
  {
    id: 5,
    title: 'Sump Pump Systems',
    slug: 'sump-pumps',
    icon: 'pi pi-bolt',
    description: 'Protect your property with professional sump pump installation and maintenance.',
    features: ['Backup Systems', 'Waterproofing', 'Annual Maintenance']
  },
  {
    id: 6,
    title: 'Emergency Services',
    slug: 'emergency',
    icon: 'pi pi-exclamation-triangle',
    description: 'Round-the-clock emergency response for urgent construction and water damage needs.',
    features: ['24/7 Availability', 'Rapid Response', 'Insurance Coordination']
  }
]
</script>

<style scoped>
.services-overview {
  background: #f8f9fa;
}

.lead {
  font-size: 1.25rem;
  color: var(--uc-gray);
  max-width: 600px;
  margin: 0 auto;
}

.service-card {
  background: white;
  padding: 2rem;
  border-radius: var(--uc-radius-lg);
  height: 100%;
  transition: all 0.3s ease;
  box-shadow: var(--uc-shadow-sm);
  display: flex;
  flex-direction: column;
}

.service-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--uc-shadow-lg);
}

.service-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, var(--uc-primary), var(--uc-primary-dark));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.service-icon i {
  font-size: 2rem;
  color: white;
}

.service-card h3 {
  color: var(--uc-dark);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.service-card p {
  color: var(--uc-gray);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.service-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
}

.service-features li {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--uc-dark);
}

.service-features i {
  color: var(--uc-primary);
  font-size: 0.9rem;
}

.service-link {
  color: var(--uc-primary);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: gap 0.3s;
}

.service-link:hover {
  gap: 1rem;
}
</style>