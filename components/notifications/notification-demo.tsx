"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from '@/hooks/use-notifications'

export function NotificationDemo() {
  const {
    notifyPaymentConfirmed,
    notifyShipmentUpdated,
    notifyRefundProcessed,
    notifyAdminNewPayment,
    notifyAdminRefundRequest,
    notifyAdminMintSuccess,
    notifyAdminMintFailed,
    notify,
  } = useNotifications()

  const handlePaymentNotification = () => {
    notifyPaymentConfirmed('Premium Content Package')
  }

  const handleShipmentNotification = () => {
    notifyShipmentUpdated('shipped')
  }

  const handleRefundNotification = () => {
    notifyRefundProcessed()
  }

  const handleAdminPaymentNotification = () => {
    notifyAdminNewPayment()
  }

  const handleAdminRefundNotification = () => {
    notifyAdminRefundRequest()
  }

  const handleMintSuccessNotification = () => {
    notifyAdminMintSuccess()
  }

  const handleMintFailedNotification = () => {
    notifyAdminMintFailed('Insufficient gas')
  }

  const handleCustomNotification = () => {
    notify('warning', 'admin', 'Custom Warning', 'This is a custom warning notification', {
      autoDismiss: false,
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Notification System Demo</CardTitle>
        <CardDescription>
          Test the notification system by triggering different types of notifications.
          Click the bell icon in the header to see notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Buyer Notifications</h3>
            <Button onClick={handlePaymentNotification} variant="outline" className="w-full">
              Payment Confirmed
            </Button>
            <Button onClick={handleShipmentNotification} variant="outline" className="w-full">
              Shipment Updated
            </Button>
            <Button onClick={handleRefundNotification} variant="outline" className="w-full">
              Refund Processed
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Admin Notifications</h3>
            <Button onClick={handleAdminPaymentNotification} variant="outline" className="w-full">
              New Payment Alert
            </Button>
            <Button onClick={handleAdminRefundNotification} variant="outline" className="w-full">
              Refund Request Alert
            </Button>
            <Button onClick={handleMintSuccessNotification} variant="outline" className="w-full">
              Mint Success
            </Button>
            <Button onClick={handleMintFailedNotification} variant="outline" className="w-full">
              Mint Failed
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-semibold text-sm mb-2">Custom Notifications</h3>
          <Button onClick={handleCustomNotification} variant="outline" className="w-full">
            Custom Warning Notification
          </Button>
        </div>
        
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Real-time notifications with different types (success, warning, error, info)</li>
            <li>Auto-dismiss after 5-10 seconds (configurable)</li>
            <li>Manual close and mark as read functionality</li>
            <li>Persistent storage in localStorage (last 20 notifications)</li>
            <li>Unread count badge on notification bell</li>
            <li>Different colors and icons for each notification type</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
