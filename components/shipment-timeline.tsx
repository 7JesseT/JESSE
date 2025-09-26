'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package, 
  MapPin, 
  Calendar,
  ExternalLink
} from 'lucide-react';

interface Order {
  id: string;
  buyer: string;
  itemId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'refunded';
  amount: number;
  currency: 'ETH' | 'USDC';
  type: string;
  createdAt: string;
  txHash?: string;
  refundTxHash?: string;
  refundedAt?: string;
  refundedBy?: string;
  metadata?: any;
  shipmentUpdates: Array<{
    timestamp: string;
    note: string;
    location: string;
    status: string;
  }>;
}

interface ShipmentTimelineProps {
  order: Order;
}

export function ShipmentTimeline({ order }: ShipmentTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'refunded':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order is being processed';
      case 'confirmed':
        return 'Payment confirmed, preparing for shipment';
      case 'shipped':
        return 'Your order is on its way';
      case 'delivered':
        return 'Order successfully delivered';
      case 'refunded':
        return 'Order has been refunded';
      default:
        return 'Status unknown';
    }
  };

  // Create timeline events from order data
  const timelineEvents = [
    {
      id: 'order-created',
      timestamp: order.createdAt,
      status: 'pending',
      title: 'Order Created',
      description: `Order #${order.id} was placed`,
      location: 'Online Store',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'payment-confirmed',
      timestamp: order.createdAt,
      status: 'confirmed',
      title: 'Payment Confirmed',
      description: `Payment of ${order.amount} ${order.currency} confirmed`,
      location: 'Blockchain',
      icon: <CheckCircle className="h-5 w-5" />
    },
    ...order.shipmentUpdates.map((update, index) => ({
      id: `shipment-${index}`,
      timestamp: update.timestamp,
      status: update.status,
      title: update.note,
      description: `Status updated to ${update.status}`,
      location: update.location,
      icon: getStatusIcon(update.status)
    }))
  ];

  // Sort timeline events by timestamp
  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Add current status if not already in timeline
  const hasCurrentStatus = timelineEvents.some(event => event.status === order.status);
  if (!hasCurrentStatus) {
    timelineEvents.push({
      id: 'current-status',
      timestamp: new Date().toISOString(),
      status: order.status,
      title: `Order ${order.status}`,
      description: getStatusDescription(order.status),
      location: order.status === 'delivered' ? 'Delivered' : 'Processing',
      icon: getStatusIcon(order.status)
    });
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id}
          </CardTitle>
          <CardDescription>
            Track your order from placement to delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Item</Label>
              <p className="font-medium">{order.itemId || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Amount</Label>
              <p className="font-medium">{order.amount} {order.currency}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Type</Label>
              <p className="font-medium capitalize">{order.type.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Current Status</Label>
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shipment Timeline
          </CardTitle>
          <CardDescription>
            Track the progress of your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                )}
                
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {event.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Transaction Hash</Label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">
                  {order.txHash ? `${order.txHash.slice(0, 16)}...${order.txHash.slice(-16)}` : 'N/A'}
                </p>
                {order.txHash && (
                  <a
                    href={`https://basescan.org/tx/${order.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Order Date</Label>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          
          {order.refundTxHash && (
            <div>
              <Label className="text-sm text-muted-foreground">Refund Transaction</Label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">
                  {order.refundTxHash.slice(0, 16)}...{order.refundTxHash.slice(-16)}
                </p>
                <a
                  href={`https://basescan.org/tx/${order.refundTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Add Label component if not already imported
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
