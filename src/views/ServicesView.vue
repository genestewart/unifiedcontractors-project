<template>
  <main class="services-page">
    <div class="page-header">
      <div class="container">
        <h1>Our Services</h1>
        <p class="lead">
          Comprehensive construction and restoration solutions
        </p>
      </div>
    </div>

    <section class="services-detail section">
      <div class="container">
        <div
          v-for="service in services"
          :id="service.slug"
          :key="service.id"
          class="service-block"
        >
          <div class="row align-items-center g-5">
            <div
              class="col-lg-6"
              :class="{ 'order-lg-2': service.id % 2 === 0 }"
            >
              <div class="service-image">
                <div class="image-placeholder">
                  <i :class="service.icon" />
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="service-content">
                <h2>{{ service.title }}</h2>
                <p class="service-description">
                  {{ service.fullDescription }}
                </p>
                <ul class="service-list">
                  <li
                    v-for="item in service.details"
                    :key="item"
                  >
                    <i class="pi pi-check-circle" /> {{ item }}
                  </li>
                </ul>
                <RouterLink
                  to="/contact"
                  class="btn-primary"
                >
                  Get Free Quote
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSEO, pageMeta } from '@/composables/useSEO'

const { setMeta, setBreadcrumbStructuredData } = useSEO()

onMounted(() => {
  setMeta(pageMeta.services)
  setBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' }
  ])
})

const services = [
  {
    id: 1,
    title: 'Custom Home Construction',
    slug: 'custom-homes',
    icon: 'pi pi-home',
    fullDescription: 'Build your dream home with our expert team. From luxury mountain retreats to modern family homes, we bring over 25 years of experience in high-altitude construction, working with top architects and designers to create homes that stand the test of time.',
    details: [
      'Complete architectural design services',
      'LEED certification and green building',
      'Mountain and high-altitude expertise',
      'Luxury finishes and custom details',
      'Project management from concept to completion'
    ]
  },
  {
    id: 2,
    title: 'Professional Design Services',
    slug: 'design',
    icon: 'pi pi-palette',
    fullDescription: 'Our in-house design team works closely with you to create spaces that reflect your style and meet your needs. We combine aesthetic excellence with practical functionality.',
    details: [
      '3D visualization and rendering',
      'Space planning and optimization',
      'Material and finish selection',
      'Interior and exterior design',
      'Permit and code compliance'
    ]
  },
  {
    id: 3,
    title: 'Complete Remodeling',
    slug: 'remodeling',
    icon: 'pi pi-wrench',
    fullDescription: 'Transform your existing space with our comprehensive remodeling services. Whether it\'s a single room or your entire home, we deliver quality renovations on time and within budget.',
    details: [
      'Kitchen and bathroom renovations',
      'Basement finishing and conversion',
      'Whole home remodeling',
      'Room additions and expansions',
      'Historic home restoration'
    ]
  },
  {
    id: 4,
    title: 'Water Damage Restoration',
    slug: 'water-mitigation',
    icon: 'pi pi-shield',
    fullDescription: '24/7 emergency response for water damage. Our certified restoration team provides fast, professional service to minimize damage and restore your property.',
    details: [
      '60-minute emergency response',
      'Water extraction and drying',
      'Mold prevention and remediation',
      'Insurance claim assistance',
      'Complete property restoration'
    ]
  },
  {
    id: 5,
    title: 'Sump Pump Systems',
    slug: 'sump-pumps',
    icon: 'pi pi-bolt',
    fullDescription: 'Protect your property from water damage with professional sump pump installation and maintenance. We offer comprehensive waterproofing solutions for Park City homes.',
    details: [
      'Professional installation',
      'Battery backup systems',
      'Annual maintenance programs',
      'Basement waterproofing',
      'Crawl space encapsulation'
    ]
  }
]
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--uc-primary), var(--uc-primary-dark));
  padding: 4rem 0;
  color: white;
  text-align: center;
}

.page-header h1 {
  color: white;
  margin-bottom: 1rem;
}

.page-header .lead {
  font-size: 1.25rem;
  opacity: 0.9;
}

.service-block {
  padding: 4rem 0;
  border-bottom: 1px solid #eee;
}

.service-block:last-child {
  border-bottom: none;
}

.service-image {
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  border-radius: var(--uc-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder i {
  font-size: 8rem;
  color: var(--uc-primary);
  opacity: 0.3;
}

.service-content h2 {
  color: var(--uc-dark);
  margin-bottom: 1.5rem;
}

.service-description {
  color: var(--uc-gray);
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.7;
}

.service-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
}

.service-list li {
  padding: 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--uc-dark);
}

.service-list i {
  color: var(--uc-primary);
  font-size: 1.2rem;
}
</style>