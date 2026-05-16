<script setup>
import { onMounted, ref } from 'vue'
import { supplierApi } from '@/services/api'

const suppliers = ref([])
const form = ref({ name: '', phone: '', address: '', email: '' })
const editingId = ref(null)
const error = ref('')

async function loadSuppliers() {
  suppliers.value = await supplierApi.list()
}

function startEdit(supplier) {
  editingId.value = supplier.id
  form.value = {
    name: supplier.name || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    email: supplier.email || '',
  }
}

function resetForm() {
  editingId.value = null
  form.value = { name: '', phone: '', address: '', email: '' }
}

async function submit() {
  error.value = ''
  try {
    if (editingId.value) {
      await supplierApi.update(editingId.value, form.value)
    } else {
      await supplierApi.create(form.value)
    }
    resetForm()
    await loadSuppliers()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadSuppliers)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Manajemen Supplier</p>
        <h2>Data vendor</h2>
      </div>
    </header>

    <section class="split-layout">
      <form class="panel form-panel" @submit.prevent="submit">
        <h3>{{ editingId ? 'Ubah Supplier' : 'Tambah Supplier' }}</h3>
        <label>Nama<input v-model="form.name" required /></label>
        <label>Telepon<input v-model="form.phone" /></label>
        <label>Email<input v-model="form.email" type="email" /></label>
        <label>Alamat<textarea v-model="form.address" rows="3" /></label>
        <p v-if="error" class="feedback error">{{ error }}</p>
        <div class="button-row">
          <button>{{ editingId ? 'Simpan Perubahan' : 'Tambah Supplier' }}</button>
          <button v-if="editingId" type="button" class="secondary" @click="resetForm">Batal</button>
        </div>
      </form>

      <section class="panel">
        <div class="panel-heading">
          <h3>Daftar Supplier</h3>
          <span>{{ suppliers.length }} supplier</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="supplier in suppliers" :key="supplier.id">
                <td>{{ supplier.name }}</td>
                <td>{{ supplier.email || '-' }}</td>
                <td>{{ supplier.phone || '-' }}</td>
                <td>
                  <button class="table-action" @click="startEdit(supplier)">Ubah</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>
