import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase-init'
import { useNotificationStore } from '@/stores/notification'

let unsubscribe = null

export function startNotificationListener() {
  if (unsubscribe) {
    console.warn('Notification listener already active')
    return
  }

  const notificationsRef = collection(db, 'notifications')
  const q = query(notificationsRef, where('isRead', '==', false))

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const store = useNotificationStore()

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data()
        const docId = change.doc.id

        if (change.type === 'added') {
          store.addNotification({
            id: docId,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          })
          playNotificationSound()
        } else if (change.type === 'modified') {
          store.updateNotification(docId, data)
        } else if (change.type === 'removed') {
          store.removeNotification(docId)
        }
      })
    },
    (error) => {
      console.error('Error listening to notifications:', error)
      const store = useNotificationStore()
      store.setError(error.message)
    }
  )
}

export function stopNotificationListener() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      isRead: true,
    })
    const store = useNotificationStore()
    store.removeNotification(notificationId)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

function playNotificationSound() {
  try {
    // Play audio file from public/sounds/ directory
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(err => {
      console.warn('Could not play notification sound:', err)
      // Fallback to beep if audio file not found
      playBeepSound()
    })
  } catch (error) {
    console.warn('Could not play notification sound:', error)
  }
}

function playBeepSound() {
  try {
    // Fallback: Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.warn('Could not play fallback beep sound:', error)
  }
}
