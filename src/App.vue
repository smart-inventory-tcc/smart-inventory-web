<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/AppSidebar.vue'

const auth = useAuthStore()
</script>

<template>
  <main v-if="auth.isAuthenticated" class="app-shell">
    <AppSidebar />
    <section class="content">
      <RouterView />
    </section>
  </main>
  <RouterView v-else />
</template>
