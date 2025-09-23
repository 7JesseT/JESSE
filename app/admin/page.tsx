'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, LogOut, Wallet, TrendingUp, Package, Users, RotateCcw } from 'lucide-react';
import { isAdminWallet } from '@/lib/admin-auth';

export default function AdminHome() {
  const { address, isConnected } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTips: 0,
    totalTransactions: 0,
    totalUsers: 0,
    pendingShipments: 0,
    totalRefunds: 0
  });

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
          // Load dashboard stats
          await loadStats();
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isConnected, address]);

  const loadStats = async () => {
    try {
      // Load tip jar totals
      const tipsResponse = await fetch('/api/tips');
      const tipsData = tipsResponse.ok ? await tipsResponse.json() : { totals: {} };
      
      // Load transactions
      const transactionsResponse = await fetch('/api/transactions');
      const transactionsData = transactionsResponse.ok ? await transactionsResponse.json() : { transactions: [] };
      
      // Calculate stats
      const totalTips = Object.values(tipsData.totals || {}).reduce((sum: number, recipient: any) => {
        return sum + (recipient.ETH || 0) + (recipient.USDC || 0);
      }, 0);
      
      const uniqueUsers = new Set(transactionsData.transactions?.map((t: any) => t.user) || []).size;
      const pendingShipments = transactionsData.transactions?.filter((t: any) => 
        t.status === 'confirmed' || t.status === 'shipped'
      ).length || 0;
      const totalRefunds = transactionsData.transactions?.filter((t: any) => 
        t.status === 'refunded'
      ).length || 0;

      setStats({
        totalTips,
        totalTransactions: transactionsData.transactions?.length || 0,
        totalUsers: uniqueUsers,
        pendingShipments,
        totalRefunds
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

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
                Connect your wallet to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your wallet to access the admin panel. Only authorized admin wallets can access this dashboard.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This wallet address is not authorized for admin access. Please contact the administrator.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage transactions, shipments, and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </div>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access:</strong> You are logged in as an administrator. All actions are logged and monitored.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTips.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ETH + USDC combined
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All transaction types
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Distinct wallet addresses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingShipments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting fulfillment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRefunds}</div>
            <p className="text-xs text-muted-foreground">
              Processed refunds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Transactions
            </CardTitle>
            <CardDescription>
              View and manage all transactions with search and filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/transactions">
              <Button className="w-full">Manage Transactions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📂 Files
            </CardTitle>
            <CardDescription>
              Upload and manage pay-per-download files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/files">
              <Button className="w-full">Manage Files</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔑 Invites
            </CardTitle>
            <CardDescription>
              Create and manage one-time invite links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/invites">
              <Button className="w-full">Manage Invites</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Attendance
            </CardTitle>
            <CardDescription>
              View event attendance and mint records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/attendance">
              <Button className="w-full">View Attendance</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚚 Shipments
            </CardTitle>
            <CardDescription>
              Track and manage shipment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/shipments">
              <Button className="w-full">Track Shipments</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔄 Refunds
            </CardTitle>
            <CardDescription>
              Manage refund requests and process approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/refunds">
              <Button className="w-full">Manage Refunds</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Analytics
            </CardTitle>
            <CardDescription>
              View comprehensive analytics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/analytics">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
