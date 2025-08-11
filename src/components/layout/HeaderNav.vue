<template>
  <header
    class="header-nav"
    role="banner"
  >
    <nav
      class="navbar"
      role="navigation"
      aria-label="Main navigation"
    >
      <div class="container">
        <div class="nav-wrapper">
          <RouterLink
            to="/"
            class="nav-brand"
            aria-label="Unified Contractors - Home"
          >
            <img
              :src="logoUrl"
              alt="Unified Contractors logo"
              class="logo"
            >
            <span class="brand-text">Unified Contractors</span>
          </RouterLink>

          <button
            class="nav-toggle"
            type="button"
            :aria-expanded="mobileMenuOpen.toString()"
            :aria-pressed="mobileMenuOpen.toString()"
            aria-controls="main-navigation-menu"
            aria-label="Toggle main navigation menu"
            @click="toggleMobileMenu"
            @keydown.escape="closeMobileMenu"
          >
            <span class="toggle-bar" />
            <span class="toggle-bar" />
            <span class="toggle-bar" />
          </button>

          <div
            id="main-navigation-menu"
            class="nav-menu"
            :class="{ active: mobileMenuOpen }"
            :aria-hidden="(!mobileMenuOpen).toString()"
          >
            <ul
              class="nav-list"
              role="menubar"
            >
              <li
                class="nav-item"
                role="none"
              >
                <RouterLink
                  to="/"
                  class="nav-link"
                  role="menuitem"
                  @click="closeMobileMenu"
                  @keydown.escape="closeMobileMenu"
                >
                  Home
                </RouterLink>
              </li>
              <li
                class="nav-item dropdown"
                role="none"
              >
                <button
                  type="button"
                  class="nav-link dropdown-toggle"
                  role="menuitem"
                  :aria-expanded="dropdownOpen.toString()"
                  :aria-pressed="dropdownOpen.toString()"
                  aria-controls="services-dropdown"
                  aria-haspopup="true"
                  @click="toggleDropdown"
                  @keydown.escape="closeDropdown"
                  @keydown.arrow-down.prevent="focusFirstDropdownItem"
                >
                  Services <i
                    class="pi pi-chevron-down"
                    aria-hidden="true"
                  />
                </button>
                <ul
                  v-show="dropdownOpen"
                  id="services-dropdown"
                  class="dropdown-menu"
                  role="menu"
                  :aria-hidden="(!dropdownOpen).toString()"
                >
                  <li role="none">
                    <RouterLink
                      to="/services#custom-homes"
                      role="menuitem"
                      @click="closeMobileMenu"
                      @keydown.escape="closeDropdown"
                    >
                      Custom Homes
                    </RouterLink>
                  </li>
                  <li role="none">
                    <RouterLink
                      to="/services#design"
                      role="menuitem"
                      @click="closeMobileMenu"
                      @keydown.escape="closeDropdown"
                    >
                      Design Services
                    </RouterLink>
                  </li>
                  <li role="none">
                    <RouterLink
                      to="/services#remodeling"
                      role="menuitem"
                      @click="closeMobileMenu"
                      @keydown.escape="closeDropdown"
                    >
                      Remodeling
                    </RouterLink>
                  </li>
                  <li role="none">
                    <RouterLink
                      to="/services#water-mitigation"
                      role="menuitem"
                      @click="closeMobileMenu"
                      @keydown.escape="closeDropdown"
                    >
                      Water Mitigation
                    </RouterLink>
                  </li>
                  <li role="none">
                    <RouterLink
                      to="/services#sump-pumps"
                      role="menuitem"
                      @click="closeMobileMenu"
                      @keydown.escape="closeDropdown"
                    >
                      Sump Pump Systems
                    </RouterLink>
                  </li>
                </ul>
              </li>
              <li
                class="nav-item"
                role="none"
              >
                <RouterLink
                  to="/about"
                  class="nav-link"
                  role="menuitem"
                  @click="closeMobileMenu"
                  @keydown.escape="closeMobileMenu"
                >
                  About
                </RouterLink>
              </li>
              <li
                class="nav-item"
                role="none"
              >
                <RouterLink
                  to="/portfolio"
                  class="nav-link"
                  role="menuitem"
                  @click="closeMobileMenu"
                  @keydown.escape="closeMobileMenu"
                >
                  Portfolio
                </RouterLink>
              </li>
              <li
                class="nav-item"
                role="none"
              >
                <RouterLink
                  to="/contact"
                  class="nav-link"
                  role="menuitem"
                  @click="closeMobileMenu"
                  @keydown.escape="closeMobileMenu"
                >
                  Contact
                </RouterLink>
              </li>
            </ul>

            <div
              class="nav-cta"
              role="group"
              aria-label="Contact actions"
            >
              <a
                href="tel:435-555-0100"
                class="btn-phone"
                aria-label="Call us at 4 3 5 5 5 0 1 0 0"
              >
                <i
                  class="pi pi-phone"
                  aria-hidden="true"
                /> (435) 555-0100
              </a>
              <RouterLink
                to="/contact"
                class="btn-quote"
                aria-label="Get free construction quote"
              >
                Get Free Quote
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import logoUrl from '@/assets/logo.svg'

const mobileMenuOpen = ref(false)
const dropdownOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    // Focus first menu item when opening mobile menu
    setTimeout(() => {
      const firstMenuItem = document.querySelector('.nav-list [role="menuitem"]')
      if (firstMenuItem) {
        firstMenuItem.focus()
      }
    }, 100)
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  dropdownOpen.value = false
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    // Focus first dropdown item when opening
    setTimeout(() => {
      focusFirstDropdownItem()
    }, 100)
  }
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const focusFirstDropdownItem = () => {
  const firstDropdownItem = document.querySelector('#services-dropdown [role="menuitem"]')
  if (firstDropdownItem) {
    firstDropdownItem.focus()
  }
}
</script>

<style scoped>
.header-nav {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar {
  padding: 1rem 0;
}

.nav-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--uc-dark);
}

.logo {
  height: 70px;
  width: auto;
}

.brand-text {
  color: var(--uc-primary);
}

.nav-toggle {
  display: none;
  flex-direction: column;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.toggle-bar {
  width: 25px;
  height: 3px;
  background: var(--uc-dark);
  margin: 3px 0;
  transition: 0.3s;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.nav-list {
  display: flex;
  list-style: none;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-item {
  position: relative;
}

.nav-link {
  color: var(--uc-dark);
  font-weight: 500;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-size: inherit;
  font-family: inherit;
}

.nav-link:hover {
  color: var(--uc-primary);
}

.nav-link:focus {
  outline: 2px solid var(--uc-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  list-style: none;
  padding: 1rem 0;
  margin: 0.5rem 0 0;
  min-width: 200px;
  box-shadow: var(--uc-shadow-lg);
  border-radius: var(--uc-radius);
}

.dropdown-menu li {
  padding: 0.5rem 1.5rem;
}

.dropdown-menu a {
  color: var(--uc-dark);
  transition: color 0.3s;
}

.dropdown-menu a:hover {
  color: var(--uc-primary);
}

.nav-cta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-phone {
  color: var(--uc-primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-quote {
  background: var(--uc-secondary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--uc-radius);
  font-weight: 600;
  transition: all 0.3s;
}

.btn-quote:hover {
  background: var(--uc-secondary-dark);
  transform: translateY(-2px);
}

@media (max-width: 1200px) {
  .nav-toggle {
    display: flex;
  }

  .nav-menu {
    position: fixed;
    left: -100%;
    top: 70px;
    flex-direction: column;
    background: white;
    width: 100%;
    text-align: center;
    transition: 0.3s;
    box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
    padding: 2rem 0;
  }

  .nav-menu.active {
    left: 0;
  }

  .nav-list {
    flex-direction: column;
  }

  .dropdown-menu {
    position: static;
    box-shadow: none;
    background: #f8f9fa;
  }
}
</style>