<template>
  <main class="about-page">
    <div class="page-header">
      <div class="container">
        <h1>About Unified Contractors</h1>
        <p class="lead">
          Building Park City's future for over 25 years
        </p>
      </div>
    </div>

    <section class="about-intro section">
      <div class="container">
        <div class="row align-items-center g-5">
          <div class="col-lg-6">
            <h2>Our Story</h2>
            <p>
              Founded in 1998, Unified Contractors has grown from a small family operation 
              to one of Park City's most trusted construction companies. Our journey began 
              with a simple mission: deliver exceptional quality and unmatched service to 
              every client.
            </p>
            <p>
              Today, we're proud to have completed over 500 projects throughout Summit and 
              Wasatch counties, ranging from luxury custom homes to emergency water damage 
              restoration. Our team of skilled professionals brings together decades of 
              combined experience in construction, design, and restoration.
            </p>
            <p>
              As a family-owned business, we understand the importance of home. That's why 
              we treat every project as if we were building for our own family, ensuring 
              the highest standards of quality, safety, and craftsmanship.
            </p>
          </div>
          <div class="col-lg-6">
            <div class="about-stats">
              <div class="stat-card">
                <i class="pi pi-calendar" />
                <h3>25+</h3>
                <p>Years of Excellence</p>
              </div>
              <div class="stat-card">
                <i class="pi pi-home" />
                <h3>500+</h3>
                <p>Projects Completed</p>
              </div>
              <div class="stat-card">
                <i class="pi pi-users" />
                <h3>50+</h3>
                <p>Team Members</p>
              </div>
              <div class="stat-card">
                <i class="pi pi-star-fill" />
                <h3>98%</h3>
                <p>Customer Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="values section section-gray">
      <div class="container">
        <div class="text-center mb-5">
          <h2>Our Core Values</h2>
          <p class="lead">
            The principles that guide everything we do
          </p>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="value-card">
              <i class="pi pi-shield" />
              <h3>Integrity</h3>
              <p>We believe in honest communication, transparent pricing, and standing behind our work with comprehensive warranties.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="value-card">
              <i class="pi pi-star" />
              <h3>Excellence</h3>
              <p>We pursue perfection in every detail, using premium materials and proven techniques to deliver superior results.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="value-card">
              <i class="pi pi-heart" />
              <h3>Community</h3>
              <p>As local residents, we're invested in Park City's growth and committed to building a stronger community together.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="team section">
      <div class="container">
        <div class="text-center mb-5">
          <h2>Leadership Team</h2>
          <p class="lead">
            Meet the experts behind Unified Contractors
          </p>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="team-member">
              <div class="member-avatar">
                JD
              </div>
              <h4>John Davidson</h4>
              <p class="title">
                Founder & CEO
              </p>
              <p>30+ years experience in construction and project management</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="team-member">
              <div class="member-avatar">
                SR
              </div>
              <h4>Sarah Reynolds</h4>
              <p class="title">
                Chief Design Officer
              </p>
              <p>Award-winning architect with expertise in mountain home design</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="team-member">
              <div class="member-avatar">
                MG
              </div>
              <h4>Mike Garcia</h4>
              <p class="title">
                Operations Director
              </p>
              <p>Specializes in water mitigation and emergency response services</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSEO, pageMeta } from '@/composables/useSEO'

const { setMeta, setBreadcrumbStructuredData } = useSEO()

onMounted(() => {
  setMeta(pageMeta.about)
  setBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' }
  ])
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

.about-intro h2 {
  color: var(--uc-dark);
  margin-bottom: 1.5rem;
}

.about-intro p {
  color: var(--uc-gray);
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.about-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: var(--uc-radius-lg);
  text-align: center;
  box-shadow: var(--uc-shadow-md);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card i {
  font-size: 2.5rem;
  color: var(--uc-primary);
  margin-bottom: 1rem;
}

.stat-card h3 {
  font-size: 2.5rem;
  color: var(--uc-secondary);
  margin-bottom: 0.5rem;
}

.stat-card p {
  color: var(--uc-gray);
  margin: 0;
}

.values {
  background: #f8f9fa;
}

.value-card {
  background: white;
  padding: 2rem;
  border-radius: var(--uc-radius-lg);
  text-align: center;
  height: 100%;
  box-shadow: var(--uc-shadow-sm);
  transition: all 0.3s;
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--uc-shadow-lg);
}

.value-card i {
  font-size: 3rem;
  color: var(--uc-primary);
  margin-bottom: 1.5rem;
}

.value-card h3 {
  color: var(--uc-dark);
  margin-bottom: 1rem;
}

.value-card p {
  color: var(--uc-gray);
  line-height: 1.6;
}

.team-member {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: var(--uc-radius-lg);
  box-shadow: var(--uc-shadow-sm);
  transition: all 0.3s;
}

.team-member:hover {
  transform: translateY(-5px);
  box-shadow: var(--uc-shadow-lg);
}

.member-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, var(--uc-primary), var(--uc-primary-dark));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 600;
}

.team-member h4 {
  color: var(--uc-dark);
  margin-bottom: 0.5rem;
}

.team-member .title {
  color: var(--uc-primary);
  font-weight: 600;
  margin-bottom: 1rem;
}

.team-member p {
  color: var(--uc-gray);
  line-height: 1.6;
}

.lead {
  color: var(--uc-gray);
  max-width: 600px;
  margin: 0 auto;
}
</style>