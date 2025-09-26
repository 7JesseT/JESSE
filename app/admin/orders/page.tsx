'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Package, Search, Edit, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';
import { isAdminWallet } from '@/lib/admin-auth';

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
  metadata?: any;
  shipmentUpdates: Array<{
    timestamp: string;
    note: string;
    location: string;
    status: string;
  }>;
}

export default function AdminOrdersPage() {
  const { address, isConnected } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    note: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      if (!isConnected || !address) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/check?wallet=${address}`);
        const data = await response.json();
        setIsAuthorized(data.isAdmin);
        
        if (data.isAdmin) {
          await loadOrders();
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isConnected, address]);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !updateForm.status) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders/update-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: selectedOrder.id,
          status: updateForm.status,
          note: updateForm.note,
          location: updateForm.location,
          adminWallet: address
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Reload orders
      await loadOrders();
      setUpdateDialogOpen(false);
      setUpdateForm({ status: '', note: '', location: '' });
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.buyer.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query) ||
      order.type.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Access Required
              </CardTitle>
              <CardDescription>
                Only authorized admin wallets can access this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This wallet address is not authorized for admin access.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">
          Manage order statuses and shipment updates
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by order ID, buyer address, status, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <CardDescription>
                    {formatDate(order.createdAt)} • {order.amount} {order.currency}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                  <Dialog open={updateDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                    setUpdateDialogOpen(open);
                    if (open) {
                      setSelectedOrder(order);
                      setUpdateForm({
                        status: order.status,
                        note: '',
                        location: ''
                      });
                    } else {
                      setSelectedOrder(null);
                      setUpdateForm({ status: '', note: '', location: '' });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Order Status</DialogTitle>
                        <DialogDescription>
                          Update the status for Order #{order.id}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={updateForm.status}
                            onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="note">Note</Label>
                          <Textarea
                            id="note"
                            placeholder="Add a note about this status update..."
                            value={updateForm.note}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, note: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="e.g., Warehouse, In Transit, Delivered"
                            value={updateForm.location}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, location: e.target.value }))}
                          />
                        </div>
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setUpdateDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleStatusUpdate}
                            disabled={loading}
                          >
                            {loading ? 'Updating...' : 'Update Status'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Buyer</Label>
                  <p className="font-mono text-xs">
                    {order.buyer.slice(0, 8)}...{order.buyer.slice(-8)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Item</Label>
                  <p className="font-medium">{order.itemId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">{order.type.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No orders found matching your search' : 'No orders found'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
