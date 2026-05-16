<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMode } from '@/services/api'

const router = useRouter()
const auth = useAuthStore()
const mode = ref('login')
const form = ref({ username: '', password: '', role: 'STAFF' })
const loading = ref(false)
const error = ref('')
const success = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (mode.value === 'register') {
      await auth.register(form.value)
      success.value = 'Akun berhasil dibuat. Silakan masuk.'
      mode.value = 'login'
      form.value.password = ''
    } else {
      await auth.login({
        username: form.value.username,
        password: form.value.password,
      })
      router.push('/')
    }
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
      <h1>{{ mode === 'login' ? 'Masuk ke sistem' : 'Buat akun baru' }}</h1>
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
        <label v-if="mode === 'register'">
          Role
          <select v-model="form.role">
            <option value="STAFF">STAFF</option>
            <option value="OWNER">OWNER</option>
          </select>
        </label>

        <p v-if="error" class="feedback error">{{ error }}</p>
        <p v-if="success" class="feedback success">{{ success }}</p>

        <button :disabled="loading">
          {{ loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar' }}
        </button>
      </form>

      <button class="text-button" type="button" @click="mode = mode === 'login' ? 'register' : 'login'">
        {{ mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk' }}
      </button>
    </div>
  </section>
</template>
