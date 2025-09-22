export type NotificationType = 'success' | 'warning' | 'error' | 'info'

export type NotificationCategory = 
  | 'payment' 
  | 'shipment' 
  | 'refund' 
  | 'mint' 
  | 'admin'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  timestamp: number
  read: boolean
  autoDismiss?: boolean
  dismissAfter?: number // milliseconds
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
}

export interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  toggleDropdown: () => void
  closeDropdown: () => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

export type NotificationStore = NotificationState & NotificationActions

// Notification templates for different events
export const NOTIFICATION_TEMPLATES = {
  PAYMENT_CONFIRMED: {
    type: 'success' as const,
    category: 'payment' as const,
    title: 'Payment Confirmed',
    message: 'Payment confirmed for [item].',
    autoDismiss: true,
    dismissAfter: 5000,
  },
  SHIPMENT_UPDATED: {
    type: 'info' as const,
    category: 'shipment' as const,
    title: 'Shipment Update',
    message: 'Your item is now [status].',
    autoDismiss: true,
    dismissAfter: 7000,
  },
  REFUND_REQUESTED: {
    type: 'info' as const,
    category: 'refund' as const,
    title: 'Refund Request Submitted',
    message: 'Your refund request has been submitted and is under review.',
    autoDismiss: true,
    dismissAfter: 5000,
  },
  REFUND_PROCESSED: {
    type: 'success' as const,
    category: 'refund' as const,
    title: 'Refund Processed',
    message: 'Refund processed successfully.',
    autoDismiss: true,
    dismissAfter: 5000,
  },
  REFUND_DENIED: {
    type: 'warning' as const,
    category: 'refund' as const,
    title: 'Refund Request Denied',
    message: 'Your refund request has been denied.',
    autoDismiss: true,
    dismissAfter: 7000,
  },
  ADMIN_NEW_PAYMENT: {
    type: 'info' as const,
    category: 'admin' as const,
    title: 'New Payment',
    message: 'A new payment has been received.',
    autoDismiss: false,
  },
  ADMIN_REFUND_REQUEST: {
    type: 'warning' as const,
    category: 'admin' as const,
    title: 'New Refund Request',
    message: 'A refund has been requested.',
    autoDismiss: false,
  },
  ADMIN_REFUND_APPROVED: {
    type: 'success' as const,
    category: 'admin' as const,
    title: 'Refund Approved',
    message: 'Refund request has been approved and processed.',
    autoDismiss: true,
    dismissAfter: 5000,
  },
  ADMIN_REFUND_DENIED: {
    type: 'info' as const,
    category: 'admin' as const,
    title: 'Refund Denied',
    message: 'Refund request has been denied.',
    autoDismiss: true,
    dismissAfter: 5000,
  },
  ADMIN_MINT_SUCCESS: {
    type: 'success' as const,
    category: 'mint' as const,
    title: 'NFT Minted',
    message: 'NFT minting completed successfully.',
    autoDismiss: true,
    dismissAfter: 5000,
  },
  ADMIN_MINT_FAILED: {
    type: 'error' as const,
    category: 'mint' as const,
    title: 'Mint Failed',
    message: 'NFT minting failed.',
    autoDismiss: false,
  },
} as const
