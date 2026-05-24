<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMode } from '@/services/api'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''

  try {
    await auth.login({
      username: form.value.username,
      password: form.value.password,
    })
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-card">
      <p class="eyebrow">Smart Inventory</p>
      <h1>Masuk ke sistem</h1>
      <p class="muted">
        {{
          apiMode === 'legacy'
            ? 'Autentikasi terhubung ke backend yang sama dengan aplikasi mobile.'
            : 'Autentikasi terhubung ke identity service.'
        }}
      </p>

      <form @submit.prevent="submit">
        <label>
          Username
          <input v-model="form.username" required minlength="3" />
        </label>
        <label>
          Password
          <input v-model="form.password" type="password" required minlength="8" />
        </label>
        <p v-if="error" class="feedback error">{{ error }}</p>

        <button :disabled="loading">
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </section>
</template>
