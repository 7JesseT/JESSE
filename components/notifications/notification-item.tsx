"use client"

import { formatDistanceToNow } from 'date-fns'
import { Check, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types/notifications'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

const getNotificationStyles = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'border-l-green-500 bg-green-50/50'
    case 'warning':
      return 'border-l-yellow-500 bg-yellow-50/50'
    case 'error':
      return 'border-l-red-500 bg-red-50/50'
    case 'info':
    default:
      return 'border-l-blue-500 bg-blue-50/50'
  }
}

export function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const handleRemove = () => {
    onRemove(notification.id)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 border-l-4 transition-all duration-200 hover:bg-muted/50',
        getNotificationStyles(notification.type),
        notification.read && 'opacity-60'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-foreground">
                {notification.title}
              </h4>
              {!notification.read && (
                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-6 w-6 p-0 hover:bg-green-100"
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
