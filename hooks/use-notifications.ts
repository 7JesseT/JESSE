"use client"

import { useNotificationStore } from '@/lib/stores/notifications'
import { NOTIFICATION_TEMPLATES } from '@/lib/types/notifications'

export function useNotifications() {
  const store = useNotificationStore()

  // Helper functions for common notification types
  const notifyPaymentConfirmed = (item: string) => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.PAYMENT_CONFIRMED,
      message: `✅ Payment confirmed for ${item}.`,
    })
  }

  const notifyShipmentUpdated = (status: string) => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.SHIPMENT_UPDATED,
      message: `📦 Your item is now ${status}.`,
    })
  }

  const notifyRefundProcessed = () => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.REFUND_PROCESSED,
      message: '💸 Refund processed successfully.',
    })
  }

  const notifyAdminNewPayment = () => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.ADMIN_NEW_PAYMENT,
      message: 'A new payment has been received.',
    })
  }

  const notifyAdminRefundRequest = () => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.ADMIN_REFUND_REQUEST,
      message: 'A refund has been requested.',
    })
  }

  const notifyAdminMintSuccess = () => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.ADMIN_MINT_SUCCESS,
      message: 'NFT minting completed successfully.',
    })
  }

  const notifyAdminMintFailed = (error?: string) => {
    store.addNotification({
      ...NOTIFICATION_TEMPLATES.ADMIN_MINT_FAILED,
      message: error ? `NFT minting failed: ${error}` : 'NFT minting failed.',
    })
  }

  // Generic notification function
  const notify = (
    type: 'success' | 'warning' | 'error' | 'info',
    category: 'payment' | 'shipment' | 'refund' | 'mint' | 'admin',
    title: string,
    message: string,
    options?: {
      autoDismiss?: boolean
      dismissAfter?: number
    }
  ) => {
    store.addNotification({
      type,
      category,
      title,
      message,
      autoDismiss: options?.autoDismiss ?? true,
      dismissAfter: options?.dismissAfter ?? 5000,
    })
  }

  return {
    // Store actions
    ...store,
    
    // Helper functions
    notifyPaymentConfirmed,
    notifyShipmentUpdated,
    notifyRefundProcessed,
    notifyAdminNewPayment,
    notifyAdminRefundRequest,
    notifyAdminMintSuccess,
    notifyAdminMintFailed,
    notify,
  }
}
