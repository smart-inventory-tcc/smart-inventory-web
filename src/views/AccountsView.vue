<script setup>
import { onMounted, ref } from 'vue'
import { userApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const users = ref([])
const form = ref({ username: '', password: '', role: 'STAFF' })
const passwordForm = ref({ id: null, username: '', password: '' })
const loading = ref(false)
const error = ref('')
const success = ref('')
const isCreateModalOpen = ref(false)
const isPasswordModalOpen = ref(false)

async function loadUsers() {
  error.value = ''
  try {
    users.value = await userApi.list()
  } catch (err) {
    error.value = err.message
  }
}

function resetForm() {
  form.value = { username: '', password: '', role: 'STAFF' }
}

function openCreateModal() {
  error.value = ''
  success.value = ''
  resetForm()
  isCreateModalOpen.value = true
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  resetForm()
}

function openPasswordModal(user) {
  error.value = ''
  success.value = ''
  passwordForm.value = { id: user.id, username: user.username, password: '' }
  isPasswordModalOpen.value = true
}

function closePasswordModal() {
  isPasswordModalOpen.value = false
  passwordForm.value = { id: null, username: '', password: '' }
}

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await userApi.create(form.value)
    success.value = 'Akun berhasil dibuat.'
    closeCreateModal()
    await loadUsers()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitPassword() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await userApi.updatePassword(passwordForm.value.id, passwordForm.value.password)
    success.value = `Password ${passwordForm.value.username} berhasil diperbarui.`
    closePasswordModal()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function removeUser(user) {
  const confirmed = window.confirm(`Hapus akun "${user.username}"?`)
  if (!confirmed) return

  error.value = ''
  success.value = ''
  try {
    await userApi.remove(user.id)
    success.value = `Akun ${user.username} berhasil dihapus.`
    await loadUsers()
  } catch (err) {
    error.value = err.message
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

onMounted(loadUsers)
</script>

<template>
  <div class="page">
    <header class="page-header accounts-header">
      <div>
        <p class="eyebrow">Manajemen Akun</p>
        <h2>Akun pengguna sistem</h2>
      </div>
      <button type="button" @click="openCreateModal">Tambah Akun</button>
    </header>

    <p v-if="error && !isCreateModalOpen && !isPasswordModalOpen" class="feedback error">{{ error }}</p>
    <p v-if="success && !isCreateModalOpen && !isPasswordModalOpen" class="feedback success">{{ success }}</p>

    <section class="panel">
      <div class="panel-heading">
        <h3>Daftar Akun</h3>
        <span>{{ users.length }} akun</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>#{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td><span class="badge in">{{ user.role }}</span></td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <button class="table-action" @click="openPasswordModal(user)">Edit Password</button>
                <button
                  class="table-action danger"
                  :disabled="user.id === auth.user?.id"
                  @click="removeUser(user)"
                >
                  Hapus
                </button>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="5" class="empty-table">Belum ada akun</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="isCreateModalOpen" class="modal-backdrop" role="presentation" @click.self="closeCreateModal">
      <form class="account-modal" role="dialog" aria-modal="true" @submit.prevent="submit">
        <div class="modal-heading">
          <h3>Tambah Akun</h3>
          <button type="button" class="secondary" @click="closeCreateModal">Tutup</button>
        </div>
        <label>Username<input v-model="form.username" required minlength="3" /></label>
        <label>Password<input v-model="form.password" type="password" required minlength="8" /></label>
        <label>
          Role
          <select v-model="form.role">
            <option value="STAFF">STAFF</option>
            <option value="OWNER">OWNER</option>
          </select>
        </label>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button :disabled="loading">{{ loading ? 'Menyimpan...' : 'Tambah Akun' }}</button>
          <button type="button" class="secondary" @click="closeCreateModal">Batal</button>
        </div>
      </form>
    </div>

    <div v-if="isPasswordModalOpen" class="modal-backdrop" role="presentation" @click.self="closePasswordModal">
      <form class="account-modal" role="dialog" aria-modal="true" @submit.prevent="submitPassword">
        <div class="modal-heading">
          <h3>Edit Password</h3>
          <button type="button" class="secondary" @click="closePasswordModal">Tutup</button>
        </div>
        <p class="muted password-target">{{ passwordForm.username }}</p>
        <label>Password Baru<input v-model="passwordForm.password" type="password" required minlength="8" /></label>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button :disabled="loading">{{ loading ? 'Menyimpan...' : 'Simpan Password' }}</button>
          <button type="button" class="secondary" @click="closePasswordModal">Batal</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.accounts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.empty-table {
  color: var(--muted);
  text-align: center;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(21, 25, 34, 0.55);
}

.account-modal {
  width: min(100%, 460px);
  max-height: min(88vh, 680px);
  display: grid;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
  border-radius: 1rem;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.modal-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.modal-heading h3,
.password-target {
  margin: 0;
}

@media (max-width: 640px) {
  .accounts-header,
  .modal-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
