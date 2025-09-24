'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Download, Search, Filter, Eye, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuditEvent {
  id: string;
  type: string;
  actor?: string;
  user?: string;
  details?: Record<string, any>;
  ip?: string | null;
  metadata?: string;
  timestamp: string;
}

interface AuditResponse {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function AdminAuditPage() {
  const { address, isConnected } = useAccount();
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  
  const ITEMS_PER_PAGE = 50;

  // Load audit data immediately (no auth required for demo)
  useEffect(() => {
    loadAuditData();
    loadEventTypes();
  }, [fromDate, toDate, selectedType, searchQuery, currentPage]);

  const loadAuditData = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (selectedType && selectedType !== 'all') params.set('type', selectedType);
      if (searchQuery) params.set('q', searchQuery);
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', (currentPage * ITEMS_PER_PAGE).toString());

      const response = await fetch(`/api/admin/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditData(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load audit data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load audit data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit data',
        variant: 'destructive',
      });
    }
  };

  const loadEventTypes = async () => {
    try {
      const response = await fetch('/api/admin/audit?action=types', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data.types);
      }
    } catch (error) {
      console.error('Failed to load event types:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (selectedType) params.set('type', selectedType);
      if (searchQuery) params.set('q', searchQuery);
      params.set('format', 'csv');

      const response = await fetch(`/api/admin/audit?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({
          title: 'Success',
          description: `Exported ${auditData?.events.length || 0} audit events to CSV`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/admin/audit?action=export-all', {
        method: 'POST',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-full-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({
          title: 'Success',
          description: 'Exported all audit events to CSV',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Failed to export all:', error);
      toast({
        title: 'Error',
        description: 'Failed to export all audit logs',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'payment':
        return 'default';
      case 'mint':
      case 'special-mint':
        return 'secondary';
      case 'refund':
      case 'refund_request':
      case 'refund_processed':
        return 'destructive';
      case 'admin':
        return 'outline';
      case 'login':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const truncateDetails = (details: Record<string, any> | undefined) => {
    if (!details) return '';
    const str = JSON.stringify(details);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedType('all');
    setSearchQuery('');
    setCurrentPage(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">
          Monitor system activities and security events
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetFilters} variant="outline">
              Clear Filters
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Visible
            </Button>
            <Button onClick={handleExportAll} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Events ({auditData?.total || 0} total)
          </CardTitle>
          <CardDescription>
            Showing {auditData?.events.length || 0} of {auditData?.total || 0} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditData?.events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit events found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData?.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(event.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(event.type)}>
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {event.actor ? 
                            `${event.actor.slice(0, 6)}...${event.actor.slice(-4)}` : 
                            '-'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {event.user ? 
                            `${event.user.slice(0, 6)}...${event.user.slice(-4)}` : 
                            '-'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {truncateDetails(event.details)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Event Details</DialogTitle>
                              <DialogDescription>
                                Event ID: {event.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Event Type</label>
                                <div className="mt-1">
                                  <Badge variant={getTypeVariant(event.type)}>
                                    {event.type}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Timestamp</label>
                                <div className="mt-1 text-sm">{formatDate(event.timestamp)}</div>
                              </div>
                              {event.actor && (
                                <div>
                                  <label className="text-sm font-medium">Actor</label>
                                  <div className="mt-1 text-sm font-mono">{event.actor}</div>
                                </div>
                              )}
                              {event.user && (
                                <div>
                                  <label className="text-sm font-medium">User</label>
                                  <div className="mt-1 text-sm font-mono">{event.user}</div>
                                </div>
                              )}
                              {event.ip && (
                                <div>
                                  <label className="text-sm font-medium">IP Address</label>
                                  <div className="mt-1 text-sm">{event.ip}</div>
                                </div>
                              )}
                              {event.metadata && (
                                <div>
                                  <label className="text-sm font-medium">Metadata</label>
                                  <div className="mt-1 text-sm">{event.metadata}</div>
                                </div>
                              )}
                              {event.details && (
                                <div>
                                  <label className="text-sm font-medium">Details</label>
                                  <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                                    {JSON.stringify(event.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {Math.ceil((auditData?.total || 0) / ITEMS_PER_PAGE)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!auditData?.hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
