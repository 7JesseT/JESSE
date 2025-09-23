'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, LogOut, Wallet, TrendingUp, Package, Users, RotateCcw, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';
import { isAdminWallet } from '@/lib/admin-auth';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface AnalyticsData {
  totalTips: number;
  totalRevenue: number;
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  totalRefunds: number;
  approvedRefunds: number;
  totalNFTs: number;
  dailyRevenue: Array<{ date: string; revenue: number; tips: number; purchases: number }>;
  transactionTypes: Array<{ type: string; count: number; value: number }>;
  weeklyStats: Array<{ week: string; tips: number; purchases: number; nfts: number }>;
}

export default function AdminAnalytics() {
  const { address, isConnected } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalTips: 0,
    totalRevenue: 0,
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    totalRefunds: 0,
    approvedRefunds: 0,
    totalNFTs: 0,
    dailyRevenue: [],
    transactionTypes: [],
    weeklyStats: []
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
          await loadAnalyticsData();
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isConnected, address]);

  useEffect(() => {
    if (isAuthorized) {
      loadAnalyticsData();
    }
  }, [dateFilter, isAuthorized]);

  const loadAnalyticsData = async () => {
    try {
      // Load all data sources
      const [tipsResponse, transactionsResponse, mintsResponse, purchasesResponse, shipmentsResponse, refundsResponse] = await Promise.all([
        fetch('/api/tips'),
        fetch('/api/transactions'),
        fetch('/api/mint'),
        fetch('/api/purchases'),
        fetch('/api/shipments'),
        fetch('/api/refund')
      ]);

      const [tipsData, transactionsData, mintsData, purchasesData, shipmentsData, refundsData] = await Promise.all([
        tipsResponse.ok ? tipsResponse.json() : { totals: {}, transactions: [] },
        transactionsResponse.ok ? transactionsResponse.json() : { transactions: [] },
        mintsResponse.ok ? mintsResponse.json() : { mints: [] },
        purchasesResponse.ok ? purchasesResponse.json() : { purchases: [] },
        shipmentsResponse.ok ? shipmentsResponse.json() : { shipments: [] },
        refundsResponse.ok ? refundsResponse.json() : { refunds: [] }
      ]);

      // Calculate date range
      const now = new Date();
      const filterDate = new Date();
      if (dateFilter === '7') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === '30') {
        filterDate.setDate(now.getDate() - 30);
      } else {
        filterDate.setTime(0); // All time
      }

      // Filter data by date
      const filterByDate = (timestamp: string) => {
        if (dateFilter === 'all') return true;
        return new Date(timestamp) >= filterDate;
      };

      // Calculate totals
      const totalTips = Object.values(tipsData.totals || {}).reduce((sum: number, recipient: any) => {
        return sum + (recipient.ETH || 0) + (recipient.USDC || 0);
      }, 0);

      const transactions = transactionsData.transactions?.filter((t: any) => filterByDate(t.timestamp)) || [];
      const mints = mintsData.mints?.filter((m: any) => filterByDate(m.time)) || [];
      const purchases = purchasesData.purchases?.filter((p: any) => filterByDate(p.timestamp)) || [];
      const shipments = shipmentsData.shipments?.filter((s: any) => filterByDate(s.date)) || [];
      const refunds = refundsData.refunds?.filter((r: any) => filterByDate(r.date)) || [];

      // Calculate revenue
      const totalRevenue = transactions.reduce((sum: number, t: any) => {
        if (t.currency === 'USDC') return sum + t.amount;
        if (t.currency === 'ETH') return sum + (t.amount * 2000); // Approximate ETH to USDC conversion
        return sum;
      }, 0);

      // Calculate shipments
      const deliveredShipments = shipments.filter((s: any) => s.status === 'delivered').length;
      const pendingShipments = shipments.filter((s: any) => s.status === 'pending' || s.status === 'shipped').length;

      // Calculate refunds
      const approvedRefunds = refunds.filter((r: any) => r.status === 'approved').length;

      // Generate daily revenue data
      const dailyRevenueMap = new Map();
      transactions.forEach((t: any) => {
        const date = new Date(t.timestamp).toISOString().split('T')[0];
        if (!dailyRevenueMap.has(date)) {
          dailyRevenueMap.set(date, { date, revenue: 0, tips: 0, purchases: 0 });
        }
        const dayData = dailyRevenueMap.get(date);
        if (t.type === 'tip') {
          dayData.tips += t.currency === 'USDC' ? t.amount : t.amount * 2000;
        } else if (t.type === 'file_purchase') {
          dayData.purchases += t.currency === 'USDC' ? t.amount : t.amount * 2000;
        }
        dayData.revenue += t.currency === 'USDC' ? t.amount : t.amount * 2000;
      });

      const dailyRevenue = Array.from(dailyRevenueMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Generate transaction types data
      const transactionTypesMap = new Map();
      transactions.forEach((t: any) => {
        if (!transactionTypesMap.has(t.type)) {
          transactionTypesMap.set(t.type, { type: t.type, count: 0, value: 0 });
        }
        const typeData = transactionTypesMap.get(t.type);
        typeData.count += 1;
        typeData.value += t.currency === 'USDC' ? t.amount : t.amount * 2000;
      });

      const transactionTypes = Array.from(transactionTypesMap.values());

      // Generate weekly stats
      const weeklyStatsMap = new Map();
      [...transactions, ...mints].forEach((item: any) => {
        const date = new Date(item.timestamp || item.time);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyStatsMap.has(weekKey)) {
          weeklyStatsMap.set(weekKey, { week: weekKey, tips: 0, purchases: 0, nfts: 0 });
        }
        const weekData = weeklyStatsMap.get(weekKey);
        
        if (item.type === 'tip') {
          weekData.tips += 1;
        } else if (item.type === 'file_purchase') {
          weekData.purchases += 1;
        } else if (item.type === 'nft_mint' || item.event) {
          weekData.nfts += 1;
        }
      });

      const weeklyStats = Array.from(weeklyStatsMap.values()).sort((a, b) => 
        new Date(a.week).getTime() - new Date(b.week).getTime()
      );

      setAnalyticsData({
        totalTips,
        totalRevenue,
        totalShipments: shipments.length,
        deliveredShipments,
        pendingShipments,
        totalRefunds: refunds.length,
        approvedRefunds,
        totalNFTs: mints.length,
        dailyRevenue,
        transactionTypes,
        weeklyStats
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    tips: {
      label: "Tips",
      color: "hsl(var(--chart-2))",
    },
    purchases: {
      label: "Purchases",
      color: "hsl(var(--chart-3))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--chart-4))",
    },
    value: {
      label: "Value",
      color: "hsl(var(--chart-5))",
    },
  };

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading analytics...</div>
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
                Connect your wallet to access the analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your wallet to access the analytics dashboard. Only authorized admin wallets can access this page.
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for your platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Analytics Period:</strong> Showing data for {dateFilter === 'all' ? 'all time' : `last ${dateFilter} days`}
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              USDC equivalent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TipJar Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTips.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ETH + USDC combined
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFTs Minted</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalNFTs}</div>
            <p className="text-xs text-muted-foreground">
              Total attendance NFTs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.deliveredShipments}/{analyticsData.totalShipments}</div>
            <p className="text-xs text-muted-foreground">
              Delivered / Total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend</CardTitle>
            <CardDescription>Revenue breakdown by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={analyticsData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="var(--color-revenue)" 
                  fill="var(--color-revenue)" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Transaction Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
            <CardDescription>Distribution by transaction type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsPieChart
                  data={analyticsData.transactionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.transactionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Tips, purchases, and NFT mints by week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <BarChart data={analyticsData.weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="week" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="tips" fill="var(--color-tips)" name="Tips" />
              <Bar dataKey="purchases" fill="var(--color-purchases)" name="Purchases" />
              <Bar dataKey="nfts" fill="var(--color-count)" name="NFTs" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Delivered</span>
                <span className="text-2xl font-bold text-green-600">{analyticsData.deliveredShipments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <span className="text-2xl font-bold text-yellow-600">{analyticsData.pendingShipments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${analyticsData.totalShipments > 0 ? (analyticsData.deliveredShipments / analyticsData.totalShipments) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Refund Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approved</span>
                <span className="text-2xl font-bold text-green-600">{analyticsData.approvedRefunds}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <span className="text-2xl font-bold text-yellow-600">{analyticsData.totalRefunds - analyticsData.approvedRefunds}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${analyticsData.totalRefunds > 0 ? (analyticsData.approvedRefunds / analyticsData.totalRefunds) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
