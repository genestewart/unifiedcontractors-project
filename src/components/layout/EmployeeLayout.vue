<template>
  <div class="employee-layout">
    <!-- Employee layout placeholder - will be implemented later -->
    <div class="placeholder-content">
      <h1>Employee Layout</h1>
      <p>This layout will contain the employee dashboard, sidebar, and navigation.</p>
      <router-view />
    </div>
  </div>
</template>

<script setup>
// Placeholder component for employee layout
// This will be fully implemented in the next phases
</script>

<style scoped>
.employee-layout {
  min-height: 100vh;
  background: var(--surface-ground, #f8f9fa);
}

.placeholder-content {
  padding: 2rem;
  text-align: center;
}
</style>