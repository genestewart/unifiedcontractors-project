<template>
  <div class="client-layout-wrapper">
    <!-- Direct router-view for client routes -->
    <!-- The actual layout is handled by ClientReviewLayout within each client view -->
    <router-view />
  </div>
</template>

<script setup>
// This component serves as a simple wrapper for client routes
// The actual layout styling and functionality is handled by ClientReviewLayout
// which is used within each client view component
</script>

<style scoped>
.client-layout-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}
</style>