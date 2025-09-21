import { NextRequest, NextResponse } from 'next/server'
import type { Notification } from '@/lib/types/notifications'

// Mock data for notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    category: 'payment',
    title: 'Payment Confirmed',
    message: 'Payment confirmed for Premium Content Package.',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    read: false,
    autoDismiss: true,
    dismissAfter: 5000,
  },
  {
    id: '2',
    type: 'info',
    category: 'shipment',
    title: 'Shipment Update',
    message: 'Your item is now shipped.',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    read: false,
    autoDismiss: true,
    dismissAfter: 7000,
  },
  {
    id: '3',
    type: 'warning',
    category: 'admin',
    title: 'Refund Request',
    message: 'A refund has been requested.',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    read: true,
    autoDismiss: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let filteredNotifications = mockNotifications

    if (unreadOnly) {
      filteredNotifications = mockNotifications.filter(n => !n.read)
    }

    const paginatedNotifications = filteredNotifications
      .slice(offset, offset + limit)
      .sort((a, b) => b.timestamp - a.timestamp)

    const unreadCount = mockNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: paginatedNotifications,
      unreadCount,
      total: filteredNotifications.length,
      hasMore: offset + limit < filteredNotifications.length,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, category, title, message, autoDismiss, dismissAfter } = body

    // Validate required fields
    if (!type || !category || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      category,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      autoDismiss,
      dismissAfter,
    }

    // In a real implementation, you would save this to a database
    // For now, we'll just return the created notification
    mockNotifications.unshift(newNotification)

    return NextResponse.json({
      notification: newNotification,
      message: 'Notification created successfully',
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, read } = body

    if (!id || typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notificationIndex = mockNotifications.findIndex(n => n.id === id)
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    mockNotifications[notificationIndex].read = read

    return NextResponse.json({
      notification: mockNotifications[notificationIndex],
      message: 'Notification updated successfully',
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing notification ID' },
        { status: 400 }
      )
    }

    const notificationIndex = mockNotifications.findIndex(n => n.id === id)
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const deletedNotification = mockNotifications.splice(notificationIndex, 1)[0]

    return NextResponse.json({
      notification: deletedNotification,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
