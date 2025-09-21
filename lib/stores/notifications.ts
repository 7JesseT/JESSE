import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { 
  Notification, 
  NotificationStore, 
  NotificationState, 
  NotificationActions 
} from '@/lib/types/notifications'

const STORAGE_KEY = 'base-daily-notifications'
const MAX_NOTIFICATIONS = 20

const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      isOpen: false,

      // Actions
      addNotification: (notificationData) => {
        const newNotification: Notification = {
          ...notificationData,
          id: uuidv4(),
          timestamp: Date.now(),
          read: false,
        }

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications]
            .slice(0, MAX_NOTIFICATIONS) // Keep only the last 20 notifications
          
          const unreadCount = updatedNotifications.filter(n => !n.read).length

          return {
            notifications: updatedNotifications,
            unreadCount,
          }
        })

        // Auto-dismiss if configured
        if (newNotification.autoDismiss && newNotification.dismissAfter) {
          setTimeout(() => {
            get().removeNotification(newNotification.id)
          }, newNotification.dismissAfter)
        }
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notification =>
            notification.id === id 
              ? { ...notification, read: true }
              : notification
          )
          
          const unreadCount = updatedNotifications.filter(n => !n.read).length

          return {
            notifications: updatedNotifications,
            unreadCount,
          }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        }))
      },

      removeNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(n => n.id !== id)
          const unreadCount = updatedNotifications.filter(n => !n.read).length

          return {
            notifications: updatedNotifications,
            unreadCount,
          }
        })
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        })
      },

      toggleDropdown: () => {
        set((state) => ({
          isOpen: !state.isOpen,
        }))
      },

      closeDropdown: () => {
        set({
          isOpen: false,
        })
      },

      loadFromStorage: () => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.state) {
              set({
                notifications: parsed.state.notifications || [],
                unreadCount: parsed.state.unreadCount || 0,
                isOpen: false, // Always start with dropdown closed
              })
            }
          }
        } catch (error) {
          console.error('Failed to load notifications from storage:', error)
        }
      },

      saveToStorage: () => {
        try {
          const state = get()
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            state: {
              notifications: state.notifications,
              unreadCount: state.unreadCount,
            },
            version: 1,
          }))
        } catch (error) {
          console.error('Failed to save notifications to storage:', error)
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)

export { useNotificationStore }
