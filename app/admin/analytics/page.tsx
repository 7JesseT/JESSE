'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, LogOut, Wallet, TrendingUp, Package, Users, RotateCcw, DollarSign, BarChart3, PieChart, Activity, Download, Database, Calendar } from 'lucide-react';
import { isAdminWallet } from '@/lib/admin-auth';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface MetricsSummary {
  totalTips: number;
  totalRevenueUSDC: number;
  totalRefunds: number;
  totalMints: number;
  shipmentsDelivered: number;
  shipmentsPending: number;
  timeframe: string;
}

interface DailyMetrics {
  date: string;
  tipsCount: number;
  revenueUsd: number;
  refundsCount: number;
  mintsCount: number;
  shipmentsDelivered: number;
  shipmentsPending: number;
}

interface AnalyticsData {
  summary: MetricsSummary | null;
  dailyMetrics: DailyMetrics[];
  isLoading: boolean;
  error: string | null;
}

export default function AdminAnalytics() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('30');
  const [isSeeding, setIsSeeding] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    summary: null,
    dailyMetrics: [],
    isLoading: false,
    error: null
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
    setAnalyticsData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Calculate date range
      const now = new Date();
      const fromDate = new Date();
      if (dateFilter === '7') {
        fromDate.setDate(now.getDate() - 7);
      } else if (dateFilter === '30') {
        fromDate.setDate(now.getDate() - 30);
      } else {
        fromDate.setTime(0); // All time
      }

      const from = fromDate.toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];

      // Load data from new endpoints
      const [summaryResponse, dailyResponse] = await Promise.all([
        fetch(`/api/admin/metrics/summary?from=${from}&to=${to}`),
        fetch(`/api/admin/metrics/daily?days=${dateFilter === 'all' ? 365 : parseInt(dateFilter)}`)
      ]);

      if (!summaryResponse.ok || !dailyResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [summary, dailyMetrics] = await Promise.all([
        summaryResponse.json(),
        dailyResponse.json()
      ]);

      setAnalyticsData({
        summary,
        dailyMetrics,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setAnalyticsData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data'
      }));
      
      toast({
        title: "Error",
        description: "Failed to load analytics data. Try seeding demo data.",
        variant: "destructive"
      });
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/admin/metrics/seed', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to seed data');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Demo data generated: ${result.dataGenerated.transactions} transactions, ${result.dataGenerated.mints} mints, ${result.dataGenerated.refunds} refunds`,
      });

      // Reload analytics data
      await loadAnalyticsData();
    } catch (error) {
      console.error('Failed to seed data:', error);
      toast({
        title: "Error",
        description: "Failed to generate demo data",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCSV = () => {
    if (!analyticsData.dailyMetrics.length) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ['date', 'tipsCount', 'revenueUsd', 'refundsCount', 'mintsCount', 'shipmentsDelivered', 'shipmentsPending'];
    const csvContent = [
      headers.join(','),
      ...analyticsData.dailyMetrics.map(row => 
        headers.map(header => row[header as keyof DailyMetrics]).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateFilter === 'all' ? 'all-time' : `last-${dateFilter}-days`}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "CSV file downloaded successfully",
    });
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
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSeedData}
                disabled={isSeeding}
              >
                <Database className="h-4 w-4 mr-2" />
                {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              disabled={analyticsData.dailyMetrics.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
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
            <div className="text-2xl font-bold">
              ${analyticsData.summary?.totalRevenueUSDC.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              USDC equivalent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary?.totalTips.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              ETH + USDC combined
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary?.totalRefunds || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Refund requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFTs Minted</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary?.totalMints || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total attendance NFTs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary?.shipmentsDelivered || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments Pending</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary?.shipmentsPending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In transit or pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {analyticsData.dailyMetrics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
              <CardDescription>Revenue breakdown by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={analyticsData.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenueUsd" 
                    stackId="1" 
                    stroke="var(--color-revenue)" 
                    fill="var(--color-revenue)" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Tips, refunds, and mints by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={analyticsData.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="tipsCount" fill="var(--color-tips)" name="Tips" />
                  <Bar dataKey="refundsCount" fill="var(--color-count)" name="Refunds" />
                  <Bar dataKey="mintsCount" fill="var(--color-purchases)" name="Mints" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>No analytics data found for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No data found for the selected time period. Try seeding demo data to see analytics.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <Button onClick={handleSeedData} disabled={isSeeding}>
                  <Database className="h-4 w-4 mr-2" />
                  {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
