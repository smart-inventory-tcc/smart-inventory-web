<script setup>
import { computed, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { markNotificationAsRead } from '@/services/notification'

const store = useNotificationStore()

const primaryAlert = computed(() => {
  const danger = store.dangerNotifications[0]
  if (danger) return { ...danger, level: 'danger' }
  return store.warningNotifications[0] || null
})

const secondaryCount = computed(() => {
  if (!primaryAlert.value) return store.totalCount
  return store.totalCount - 1
})

async function dismissAlert() {
  if (primaryAlert.value) {
    try {
      await markNotificationAsRead(primaryAlert.value.id)
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }
}

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<template>
  <div v-if="primaryAlert" class="notification-alert-container">
    <div :class="['notification-alert', `alert-${primaryAlert.level}`]">
      <div class="alert-header">
        <span class="alert-badge">{{ primaryAlert.level.toUpperCase() }}</span>
        <h4 class="alert-title">{{ primaryAlert.itemName }}</h4>
      </div>

      <div class="alert-body">
        <p class="alert-message">{{ primaryAlert.message }}</p>
        <div class="alert-details">
          <div class="detail-row">
            <span class="detail-label">Current Stock:</span>
            <span class="detail-value">{{ primaryAlert.currentStock }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Min Stock:</span>
            <span class="detail-value">{{ primaryAlert.minStock }}</span>
          </div>
          <div v-if="primaryAlert.barcode" class="detail-row">
            <span class="detail-label">Barcode:</span>
            <span class="detail-value">{{ primaryAlert.barcode }}</span>
          </div>
        </div>
      </div>

      <div class="alert-footer">
        <span v-if="secondaryCount > 0" class="alert-count">+{{ secondaryCount }} more</span>
        <button class="btn-dismiss" @click="dismissAlert">Dismiss</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-alert-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(450px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-alert {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  background: white;
  border-left: 5px solid;
}

.notification-alert.alert-danger {
  border-left-color: #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.notification-alert.alert-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.alert-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.alert-danger .alert-badge {
  background-color: #dc2626;
  color: white;
}

.alert-warning .alert-badge {
  background-color: #f59e0b;
  color: white;
}

.alert-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.alert-body {
  padding: 12px 16px;
}

.alert-message {
  margin: 0 0 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}

.alert-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.detail-label {
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
}

.alert-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(0, 0, 0, 0.02);
}

.alert-count {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.btn-dismiss {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-alert.alert-danger .btn-dismiss {
  background-color: #dc2626;
  color: white;
}

.notification-alert.alert-danger .btn-dismiss:hover {
  background-color: #b91c1c;
}

.notification-alert.alert-warning .btn-dismiss {
  background-color: #f59e0b;
  color: white;
}

.notification-alert.alert-warning .btn-dismiss:hover {
  background-color: #d97706;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .notification-alert-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .alert-body {
    padding: 10px 12px;
  }

  .alert-header {
    padding: 10px 12px;
  }

  .alert-footer {
    padding: 10px 12px;
  }
}
</style>
