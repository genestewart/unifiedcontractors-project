<template>
  <footer class="footer">
    <div class="footer-top">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="footer-brand">
              <img
                :src="logoUrl"
                alt="Unified Contractors"
                class="footer-logo"
              >
              <h3>Unified Contractors</h3>
              <p>Building dreams and protecting homes in Park City for over 25 years.</p>
              <div class="social-links">
                <a
                  href="#"
                  aria-label="Facebook"
                ><i class="pi pi-facebook" /></a>
                <a
                  href="#"
                  aria-label="Instagram"
                ><i class="pi pi-instagram" /></a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                ><i class="pi pi-linkedin" /></a>
              </div>
            </div>
          </div>
          
          <div class="col-lg-2 col-md-6">
            <div class="footer-links">
              <h4>Services</h4>
              <ul>
                <li><a href="#custom-homes">Custom Homes</a></li>
                <li><a href="#design">Design Services</a></li>
                <li><a href="#remodeling">Remodeling</a></li>
                <li><a href="#water-mitigation">Water Mitigation</a></li>
                <li><a href="#sump-pumps">Sump Pumps</a></li>
              </ul>
            </div>
          </div>
          
          <div class="col-lg-2 col-md-6">
            <div class="footer-links">
              <h4>Company</h4>
              <ul>
                <li>
                  <RouterLink to="/about">
                    About Us
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/portfolio">
                    Portfolio
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/contact">
                    Contact
                  </RouterLink>
                </li>
                <li><a href="#testimonials">Testimonials</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="footer-contact">
              <h4>Get In Touch</h4>
              <div class="contact-item">
                <i class="pi pi-map-marker" />
                <div>
                  <strong>Office Location</strong><br>
                  8343 N Silver Creek Rd<br>
                  Park City, UT 84098
                </div>
              </div>
              <div class="contact-item">
                <i class="pi pi-phone" />
                <div>
                  <strong>24/7 Emergency</strong><br>
                  <a href="tel:435-555-0100">(435) 555-0100</a>
                </div>
              </div>
              <div class="contact-item">
                <i class="pi pi-envelope" />
                <div>
                  <strong>Email Us</strong><br>
                  <a href="mailto:info@unifiedcontractors.com">info@unifiedcontractors.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <p class="copyright">
              © 2025 Unified Contractors. All rights reserved.
            </p>
          </div>
          <div class="col-md-6">
            <div class="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#license">License Info</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logoUrl from '@/assets/logo.svg'
</script>

<style scoped>
.footer {
  background: var(--uc-dark);
  color: var(--uc-light);
  margin-top: auto;
}

.footer-top {
  padding: 4rem 0 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-brand {
  margin-bottom: 2rem;
}

.footer-logo {
  height: 60px;
  margin-bottom: 1rem;
  filter: brightness(0) invert(1);
}

.footer-brand h3 {
  color: var(--uc-light);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.footer-brand p {
  color: var(--uc-gray);
  margin-bottom: 1.5rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-links a {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--uc-light);
  transition: all 0.3s;
}

.social-links a:hover {
  background: var(--uc-primary);
  transform: translateY(-3px);
}

.footer-links h4,
.footer-contact h4 {
  color: var(--uc-light);
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.75rem;
}

.footer-links a {
  color: var(--uc-gray);
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--uc-primary);
}

.contact-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.contact-item i {
  color: var(--uc-primary);
  font-size: 1.25rem;
  margin-top: 0.25rem;
}

.contact-item a {
  color: var(--uc-light);
  transition: color 0.3s;
}

.contact-item a:hover {
  color: var(--uc-primary);
}

.footer-bottom {
  padding: 1.5rem 0;
  background: rgba(0, 0, 0, 0.2);
}

.copyright {
  color: var(--uc-gray);
  margin: 0;
}

.footer-legal {
  display: flex;
  gap: 2rem;
  justify-content: flex-end;
}

.footer-legal a {
  color: var(--uc-gray);
  transition: color 0.3s;
}

.footer-legal a:hover {
  color: var(--uc-primary);
}

@media (max-width: 768px) {
  .footer-legal {
    justify-content: flex-start;
    margin-top: 1rem;
  }
}
</style>