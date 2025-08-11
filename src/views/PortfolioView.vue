<template>
  <main class="portfolio-page">
    <div class="page-header">
      <div class="container">
        <h1>Our Portfolio</h1>
        <p class="lead">
          Showcasing excellence in Park City construction
        </p>
      </div>
    </div>

    <section class="portfolio section">
      <div class="container">
        <div class="filter-buttons">
          <button 
            v-for="category in categories" 
            :key="category"
            :class="['filter-btn', { active: activeFilter === category }]"
            @click="activeFilter = category"
          >
            {{ category }}
          </button>
        </div>

        <div class="row g-4">
          <div 
            v-for="project in filteredProjects" 
            :key="project.id"
            class="col-lg-4 col-md-6"
          >
            <div class="portfolio-card">
              <div class="portfolio-image">
                <div class="image-placeholder">
                  <i :class="project.icon" />
                </div>
                <div class="portfolio-overlay">
                  <h4>{{ project.title }}</h4>
                  <p>{{ project.location }}</p>
                </div>
              </div>
              <div class="portfolio-content">
                <span class="project-category">{{ project.category }}</span>
                <h3>{{ project.title }}</h3>
                <p>{{ project.description }}</p>
                <ul class="project-details">
                  <li><strong>Size:</strong> {{ project.size }}</li>
                  <li><strong>Duration:</strong> {{ project.duration }}</li>
                  <li><strong>Year:</strong> {{ project.year }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="portfolio-cta section-dark">
      <div class="container text-center">
        <h2>Ready to Create Something Amazing?</h2>
        <p class="lead">
          Let's discuss your project and bring your vision to life
        </p>
        <RouterLink
          to="/contact"
          class="btn-light"
        >
          Start Your Project
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSEO, pageMeta } from '@/composables/useSEO'

const { setMeta, setBreadcrumbStructuredData } = useSEO()

onMounted(() => {
  setMeta(pageMeta.portfolio)
  setBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Portfolio', url: '/portfolio' }
  ])
})

const activeFilter = ref('All')

const categories = ['All', 'Custom Homes', 'Remodeling', 'Commercial', 'Restoration']

const projects = [
  {
    id: 1,
    title: 'Mountain Modern Retreat',
    category: 'Custom Homes',
    location: 'Deer Valley',
    description: 'Luxury 6,500 sq ft custom home with panoramic mountain views',
    size: '6,500 sq ft',
    duration: '12 months',
    year: '2024',
    icon: 'pi pi-home'
  },
  {
    id: 2,
    title: 'Historic Main Street Renovation',
    category: 'Remodeling',
    location: 'Park City',
    description: 'Complete renovation of 1890s historic property maintaining original character',
    size: '3,200 sq ft',
    duration: '8 months',
    year: '2024',
    icon: 'pi pi-building'
  },
  {
    id: 3,
    title: 'Flood Damage Recovery',
    category: 'Restoration',
    location: 'Summit Park',
    description: 'Emergency water damage restoration and complete basement rebuild',
    size: '2,000 sq ft',
    duration: '3 months',
    year: '2024',
    icon: 'pi pi-shield'
  },
  {
    id: 4,
    title: 'Ski-In/Ski-Out Chalet',
    category: 'Custom Homes',
    location: 'Canyons Village',
    description: 'Custom mountain chalet with direct ski access and sustainable features',
    size: '5,200 sq ft',
    duration: '14 months',
    year: '2023',
    icon: 'pi pi-home'
  },
  {
    id: 5,
    title: 'Boutique Hotel Expansion',
    category: 'Commercial',
    location: 'Park City',
    description: 'Added 20 luxury suites to existing boutique hotel property',
    size: '12,000 sq ft',
    duration: '10 months',
    year: '2023',
    icon: 'pi pi-building'
  },
  {
    id: 6,
    title: 'Contemporary Kitchen & Bath',
    category: 'Remodeling',
    location: 'Snyderville',
    description: 'Complete kitchen and master bath renovation with modern finishes',
    size: '800 sq ft',
    duration: '2 months',
    year: '2023',
    icon: 'pi pi-wrench'
  }
]

const filteredProjects = computed(() => {
  if (activeFilter.value === 'All') {
    return projects
  }
  return projects.filter(p => p.category === activeFilter.value)
})
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

.filter-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: white;
  color: var(--uc-dark);
  border: 2px solid #dee2e6;
  padding: 0.75rem 1.5rem;
  border-radius: var(--uc-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: var(--uc-primary);
  color: var(--uc-primary);
}

.filter-btn.active {
  background: var(--uc-primary);
  color: white;
  border-color: var(--uc-primary);
}

.portfolio-card {
  background: white;
  border-radius: var(--uc-radius-lg);
  overflow: hidden;
  box-shadow: var(--uc-shadow-md);
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.portfolio-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--uc-shadow-lg);
}

.portfolio-image {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder i {
  font-size: 4rem;
  color: white;
  opacity: 0.3;
}

.portfolio-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  padding: 1.5rem;
  color: white;
}

.portfolio-overlay h4 {
  color: white;
  margin-bottom: 0.25rem;
}

.portfolio-overlay p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.portfolio-content {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.project-category {
  color: var(--uc-primary);
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.portfolio-content h3 {
  color: var(--uc-dark);
  margin: 0.5rem 0 1rem;
}

.portfolio-content p {
  color: var(--uc-gray);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.project-details {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.project-details li {
  padding: 0.25rem 0;
  color: var(--uc-gray);
  font-size: 0.9rem;
}

.project-details strong {
  color: var(--uc-dark);
  margin-right: 0.5rem;
}

.portfolio-cta {
  background: var(--uc-dark);
  color: white;
  padding: 5rem 0;
  text-align: center;
}

.portfolio-cta h2 {
  color: white;
  margin-bottom: 1rem;
}

.portfolio-cta .lead {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.btn-light {
  background: white;
  color: var(--uc-primary);
  padding: 1rem 2.5rem;
  border-radius: var(--uc-radius);
  font-weight: 600;
  display: inline-block;
  transition: all 0.3s;
}

.btn-light:hover {
  transform: translateY(-2px);
  box-shadow: var(--uc-shadow-lg);
}

@media (max-width: 768px) {
  .filter-buttons {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 1rem;
  }
}
</style>