'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, Wallet } from 'lucide-react';
import { ShipmentTimeline } from '@/components/shipment-timeline';
import { useNotifications } from '@/hooks/use-notifications';

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

export default function OrdersPage() {
  const { address, isConnected } = useAccount();
  const { notifyShipmentUpdated } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'order' | 'wallet'>('order');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  const searchOrders = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (!isConnected || !address) {
      setError('Please connect your wallet to search orders');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (searchType === 'order') {
        response = await fetch(`/api/orders/${searchQuery}?wallet=${address}`);
      } else {
        response = await fetch(`/api/orders/by-wallet/${searchQuery}?wallet=${address}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      
      if (searchType === 'order') {
        setOrders([data]);
      } else {
        setOrders(data.orders || []);
      }

      // Check for shipment updates and trigger notifications
      checkForShipmentUpdates(data.orders || [data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const checkForShipmentUpdates = (newOrders: Order[]) => {
    // Simple notification logic - in a real app, you'd compare with previous state
    // or use WebSockets/SSE for real-time updates
    newOrders.forEach(order => {
      if (order.shipmentUpdates && order.shipmentUpdates.length > 0) {
        const latestUpdate = order.shipmentUpdates[order.shipmentUpdates.length - 1];
        const updateTime = new Date(latestUpdate.timestamp).getTime();
        
        // Only notify if this is a recent update (within last 5 minutes)
        if (updateTime > lastUpdateTime - 5 * 60 * 1000) {
          notifyShipmentUpdated(latestUpdate.status);
        }
      }
    });
    
    setLastUpdateTime(Date.now());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'refunded':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount} ${currency}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order History & Shipment Tracker</h1>
        <p className="text-muted-foreground">
          Search for your orders by order ID or wallet address to track shipment status
        </p>
      </div>

      {!isConnected && (
        <Alert className="mb-6">
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to search for orders. You can only view orders associated with your connected wallet.
          </AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Orders</CardTitle>
          <CardDescription>
            Enter an order ID or wallet address to find orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Query</Label>
              <Input
                id="search"
                placeholder={searchType === 'order' ? 'Enter order ID...' : 'Enter wallet address...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchOrders()}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="searchType">Search Type</Label>
              <select
                id="searchType"
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'order' | 'wallet')}
              >
                <option value="order">Order ID</option>
                <option value="wallet">Wallet Address</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={searchOrders} disabled={loading || !isConnected}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {orders.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {orders.length} Order{orders.length !== 1 ? 's' : ''} Found
            </h2>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Order List</TabsTrigger>
              <TabsTrigger value="timeline">Shipment Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <CardDescription>
                          {formatDate(order.createdAt)} • {formatAmount(order.amount, order.currency)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Item</Label>
                        <p className="font-medium">{order.itemId || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">{order.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Transaction</Label>
                        <p className="font-mono text-xs">
                          {order.txHash ? `${order.txHash.slice(0, 8)}...${order.txHash.slice(-8)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              {selectedOrder ? (
                <ShipmentTimeline order={selectedOrder} />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select an order from the list to view its shipment timeline
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {orders.length === 0 && !loading && searchQuery && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders found for the given search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
