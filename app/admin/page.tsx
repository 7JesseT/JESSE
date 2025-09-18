'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, LogOut } from 'lucide-react';

export default function AdminHome() {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminKey, setAdminKey] = useState('');

  // Check authorization
  useEffect(() => {
    const checkAuth = () => {
      const urlKey = searchParams?.get('admin');
      const storedKey = localStorage.getItem('adminKey');
      
      if (urlKey === 'base-daily-admin-2024' || storedKey === 'base-daily-admin-2024') {
        setIsAuthorized(true);
        if (urlKey === 'base-daily-admin-2024') {
          localStorage.setItem('adminKey', 'base-daily-admin-2024');
        }
      } else {
        setIsAuthorized(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [searchParams]);

  const handleAdminLogin = () => {
    if (adminKey === 'base-daily-admin-2024') {
      localStorage.setItem('adminKey', adminKey);
      setIsAuthorized(true);
    } else {
      alert('Invalid admin key');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    setIsAuthorized(false);
    setAdminKey('');
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
                Enter admin key to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminKey">Admin Key</Label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Demo key: <code className="bg-muted px-1 rounded">base-daily-admin-2024</code>
                </p>
              </div>
              <Button onClick={handleAdminLogin} className="w-full">
                Access Admin Panel
              </Button>
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
              Manage your application's content, users, and analytics
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access:</strong> You are logged in as an administrator. All actions are logged and monitored.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Dashboard
            </CardTitle>
            <CardDescription>
              View analytics, KPIs, and transaction data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard">
              <Button className="w-full">View Dashboard</Button>
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
      </div>
    </div>
  );
}
