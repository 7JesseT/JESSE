# Notifications System

A comprehensive real-time notification system for Base Daily that provides instant feedback for important events like payments, shipments, refunds, and NFT minting.

## Features

### ✅ Buyer Notifications
- **Payment Confirmed**: "✅ Payment confirmed for [item]."
- **Shipment Updated**: "📦 Your item is now [status]."
- **Refund Processed**: "💸 Refund processed successfully."

### ✅ Admin Notifications
- **New Payment Alert**: Notifies when a new payment is received
- **Refund Request Alert**: Alerts when a refund is requested
- **NFT Mint Success**: Confirms successful NFT minting
- **NFT Mint Failure**: Reports minting failures with error details

### ✅ Technical Features
- **Real-time Updates**: Instant notifications using Zustand state management
- **Auto-dismiss**: Notifications automatically disappear after 5-10 seconds (configurable)
- **Manual Control**: Users can manually close notifications or mark them as read
- **Persistent Storage**: Last 20 notifications stored in localStorage
- **Visual Indicators**: Different colors and icons for success, warning, error, and info states
- **Unread Count**: Badge showing number of unread notifications
- **Responsive Design**: Works on all screen sizes

## Architecture

### State Management
- **Zustand Store**: Lightweight state management for notifications
- **Persistence**: Automatic localStorage integration with Zustand persist middleware
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### Components
- **NotificationDropdown**: Main dropdown component with bell icon
- **NotificationItem**: Individual notification display component
- **NotificationDemo**: Testing component for development

### API Integration
- **Mock Endpoint**: `/api/notifications` for testing and future event-driven integration
- **Automatic Triggers**: Notifications automatically sent from payment, refund, and mint APIs
- **Shipment Updates**: Dedicated API endpoint for shipment status changes

## Usage

### Basic Usage
```tsx
import { useNotifications } from '@/hooks/use-notifications'

function MyComponent() {
  const { notifyPaymentConfirmed, notifyShipmentUpdated } = useNotifications()
  
  const handlePayment = () => {
    notifyPaymentConfirmed('Premium Content Package')
  }
  
  const handleShipment = () => {
    notifyShipmentUpdated('shipped')
  }
}
```

### Custom Notifications
```tsx
const { notify } = useNotifications()

notify('warning', 'admin', 'Custom Warning', 'This is a custom notification', {
  autoDismiss: false,
  dismissAfter: 10000,
})
```

### API Integration
```typescript
// Trigger notification from API route
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'success',
    category: 'payment',
    title: 'Payment Confirmed',
    message: '✅ Payment confirmed for Premium Content.',
    autoDismiss: true,
    dismissAfter: 5000,
  }),
})
```

## File Structure

```
lib/
├── types/
│   └── notifications.ts          # TypeScript type definitions
├── stores/
│   └── notifications.ts          # Zustand store implementation
hooks/
└── use-notifications.ts          # Custom hook for easy usage
components/
└── notifications/
    ├── notification-dropdown.tsx # Main dropdown component
    ├── notification-item.tsx     # Individual notification component
    └── notification-demo.tsx     # Demo/testing component
app/
└── api/
    ├── notifications/
    │   └── route.ts              # Mock API endpoint
    └── shipments/
        └── route.ts              # Shipment update API
```

## Configuration

### Notification Types
- `success`: Green color with checkmark icon
- `warning`: Yellow color with warning triangle icon
- `error`: Red color with alert circle icon
- `info`: Blue color with info icon

### Categories
- `payment`: Payment-related notifications
- `shipment`: Shipment status updates
- `refund`: Refund processing notifications
- `mint`: NFT minting notifications
- `admin`: Administrative alerts

### Auto-dismiss Settings
- **Success notifications**: 5 seconds
- **Info notifications**: 7 seconds
- **Warning notifications**: No auto-dismiss (manual close required)
- **Error notifications**: No auto-dismiss (manual close required)

## Testing

Use the Notification Demo component on the homepage to test all notification types:

1. **Buyer Notifications**: Test payment, shipment, and refund notifications
2. **Admin Notifications**: Test admin alerts and mint notifications
3. **Custom Notifications**: Test custom notification types and settings

## Future Enhancements

- **WebSocket Integration**: Real-time notifications via WebSocket connections
- **Push Notifications**: Browser push notifications for important events
- **Email Integration**: Email notifications for critical events
- **Notification Preferences**: User-configurable notification settings
- **Rich Content**: Support for images, links, and rich text in notifications
- **Notification History**: Extended history beyond 20 notifications
- **Sound Effects**: Audio notifications for different event types

## Dependencies

- `zustand`: State management
- `zustand/middleware`: Persistence middleware
- `uuid`: Unique ID generation
- `date-fns`: Date formatting
- `lucide-react`: Icons
- `@radix-ui/react-dropdown-menu`: Dropdown component
- `@radix-ui/react-scroll-area`: Scrollable area component
