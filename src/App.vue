<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'

const auth = useAuthStore()
const sidebar = useSidebarStore()
const route = useRoute()
const shouldShowShell = computed(() => auth.isAuthenticated && route.meta.requiresAuth)
const shouldShowPublicRoute = computed(() => !route.meta.requiresAuth)
const appShellStyle = computed(() => ({
  gridTemplateColumns: sidebar.isOpen ? '280px 1fr' : '80px 1fr'
}))
</script>

<template>
  <main v-if="shouldShowShell" class="app-shell" :style="appShellStyle">
    <AppSidebar />
    <section class="content">
      <RouterView />
    </section>
  </main>
  <RouterView v-else-if="shouldShowPublicRoute" />
  <section v-else class="auth-page">
    <div class="auth-card">
      <p class="eyebrow">Smart Inventory</p>
      <h1>Mengalihkan...</h1>
    </div>
  </section>
</template>
