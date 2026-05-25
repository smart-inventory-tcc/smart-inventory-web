import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const error = ref(null)

  const dangerNotifications = computed(() =>
    notifications.value.filter((n) => n.level === 'danger')
  )

  const warningNotifications = computed(() =>
    notifications.value.filter((n) => n.level === 'warning')
  )

  const totalCount = computed(() => notifications.value.length)

  const hasNotifications = computed(() => notifications.value.length > 0)

  function addNotification(notification) {
    // Check if notification already exists (avoid duplicates)
    const exists = notifications.value.some((n) => n.id === notification.id)
    if (!exists) {
      notifications.value.unshift(notification)
    }
  }

  function removeNotification(notificationId) {
    const index = notifications.value.findIndex((n) => n.id === notificationId)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function updateNotification(notificationId, data) {
    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification) {
      Object.assign(notification, data)
    }
  }

  function clearNotifications() {
    notifications.value = []
  }

  function setError(errorMessage) {
    error.value = errorMessage
    setTimeout(() => {
      error.value = null
    }, 5000)
  }

  return {
    notifications,
    error,
    dangerNotifications,
    warningNotifications,
    totalCount,
    hasNotifications,
    addNotification,
    removeNotification,
    updateNotification,
    clearNotifications,
    setError,
  }
})
