<template>
  <main>
    <HeroSection />
    <ServicesOverview />
    <CredibilitySection />
    <TestimonialsSection />
    <CTASection />
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import HeroSection from '@/components/home/HeroSection.vue'
import ServicesOverview from '@/components/home/ServicesOverview.vue'
import CredibilitySection from '@/components/home/CredibilitySection.vue'
import TestimonialsSection from '@/components/home/TestimonialsSection.vue'
import CTASection from '@/components/home/CTASection.vue'
import { useSEO, pageMeta } from '@/composables/useSEO'

const { setMeta, setStructuredData } = useSEO()

onMounted(() => {
  setMeta(pageMeta.home)
  setStructuredData()
})
</script>