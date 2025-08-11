<template>
  <section class="testimonials section section-gray">
    <div class="container">
      <div class="text-center mb-5">
        <h2>What Our Clients Say</h2>
        <p class="lead">
          Real stories from satisfied Park City homeowners
        </p>
      </div>
      
      <div class="row g-4">
        <div
          v-for="testimonial in testimonials"
          :key="testimonial.id"
          class="col-lg-4"
        >
          <div class="testimonial-card">
            <div class="rating">
              <i
                v-for="n in 5"
                :key="n"
                class="pi pi-star-fill"
              />
            </div>
            <p class="testimonial-text">
              {{ testimonial.text }}
            </p>
            <div class="testimonial-author">
              <div class="author-avatar">
                {{ testimonial.initials }}
              </div>
              <div class="author-info">
                <h5>{{ testimonial.name }}</h5>
                <p>{{ testimonial.project }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="testimonial-stats">
        <div class="stat-item">
          <i class="pi pi-star-fill" />
          <h3>4.9/5</h3>
          <p>Average Rating</p>
        </div>
        <div class="stat-item">
          <i class="pi pi-users" />
          <h3>95%</h3>
          <p>Referral Rate</p>
        </div>
        <div class="stat-item">
          <i class="pi pi-heart-fill" />
          <h3>300+</h3>
          <p>Happy Families</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const testimonials = [
  {
    id: 1,
    text: "Unified Contractors transformed our vision into reality. Their attention to detail and commitment to quality exceeded all expectations. The team was professional, punctual, and a pleasure to work with throughout our custom home build.",
    name: "Sarah Mitchell",
    initials: "SM",
    project: "Custom Mountain Home"
  },
  {
    id: 2,
    text: "When our basement flooded, they responded within an hour at 2 AM. Their water mitigation team saved our home from extensive damage. The insurance claim assistance was invaluable. True professionals in every sense.",
    name: "Robert Johnson",
    initials: "RJ",
    project: "Water Damage Restoration"
  },
  {
    id: 3,
    text: "Our kitchen and bathroom remodel completely transformed our home. The design team's creativity and the construction crew's craftsmanship were outstanding. They finished on time and within budget - a rare find!",
    name: "Emily Chen",
    initials: "EC",
    project: "Complete Home Remodel"
  }
]
</script>

<style scoped>
.testimonials {
  position: relative;
  overflow: hidden;
}

.lead {
  color: var(--uc-gray);
  max-width: 600px;
  margin: 0 auto;
}

.testimonial-card {
  background: white;
  padding: 2rem;
  border-radius: var(--uc-radius-lg);
  height: 100%;
  box-shadow: var(--uc-shadow-sm);
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--uc-shadow-lg);
}

.rating {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
}

.rating i {
  color: #ffc107;
  font-size: 1.2rem;
}

.testimonial-text {
  color: var(--uc-dark);
  font-size: 1.05rem;
  line-height: 1.7;
  margin-bottom: 2rem;
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.author-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--uc-primary), var(--uc-primary-dark));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
}

.author-info h5 {
  color: var(--uc-dark);
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.author-info p {
  color: var(--uc-gray);
  margin: 0;
  font-size: 0.9rem;
}

.testimonial-stats {
  display: flex;
  justify-content: center;
  gap: 4rem;
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid #dee2e6;
}

.stat-item {
  text-align: center;
}

.stat-item i {
  font-size: 2rem;
  color: var(--uc-primary);
  margin-bottom: 1rem;
}

.stat-item h3 {
  font-size: 2.5rem;
  color: var(--uc-secondary);
  margin-bottom: 0.5rem;
}

.stat-item p {
  color: var(--uc-gray);
  margin: 0;
}

@media (max-width: 768px) {
  .testimonial-stats {
    flex-direction: column;
    gap: 2rem;
  }
}
</style>