<script setup>
import { onMounted, ref } from 'vue'
import { categoryApi } from '@/services/api'

const categories = ref([])
const form = ref({ name: '', description: '' })
const editingId = ref(null)
const error = ref('')

async function loadCategories() {
  try {
    categories.value = await categoryApi.list()
  } catch (err) {
    error.value = err.message
  }
}

function startEdit(category) {
  editingId.value = category.id
  form.value = {
    name: category.name || '',
    description: category.description || '',
  }
}

function resetForm() {
  editingId.value = null
  form.value = { name: '', description: '' }
}

async function submit() {
  error.value = ''
  try {
    if (editingId.value) {
      await categoryApi.update(editingId.value, form.value)
    } else {
      await categoryApi.create(form.value)
    }
    resetForm()
    await loadCategories()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(category) {
  const confirmed = window.confirm(`Hapus kategori "${category.name}"? Barang terkait akan menjadi tanpa kategori.`)
  if (!confirmed) return

  error.value = ''
  try {
    await categoryApi.remove(category.id)
    if (editingId.value === category.id) resetForm()
    await loadCategories()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Manajemen Kategori</p>
        <h2>Kelompok barang</h2>
      </div>
    </header>

    <section class="split-layout">
      <form class="panel form-panel" @submit.prevent="submit">
        <h3>{{ editingId ? 'Ubah Kategori' : 'Tambah Kategori' }}</h3>
        <label>Nama<input v-model="form.name" required /></label>
        <label>Deskripsi<textarea v-model="form.description" rows="3" /></label>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button>{{ editingId ? 'Simpan Perubahan' : 'Tambah Kategori' }}</button>
          <button v-if="editingId" type="button" class="secondary" @click="resetForm">Batal</button>
        </div>
      </form>

      <section class="panel">
        <div class="panel-heading">
          <h3>Daftar Kategori</h3>
          <span>{{ categories.length }} kategori</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Deskripsi</th>
                <th>Barang</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td>{{ category.name }}</td>
                <td>{{ category.description || '-' }}</td>
                <td>{{ category.itemCount }}</td>
                <td>
                  <button class="table-action" @click="startEdit(category)">Ubah</button>
                  <button class="table-action danger" @click="remove(category)">Hapus</button>
                </td>
              </tr>
              <tr v-if="categories.length === 0">
                <td colspan="4" class="empty-table">Belum ada kategori</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>
