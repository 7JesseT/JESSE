'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Copy, Download, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { RECIPIENTS } from '@/config/recipients'
import { getInviteStatus, getRecipientName } from '@/lib/invites-client'

type Invite = {
  id: string
  token: string
  recipientId: string
  currency: 'ETH' | 'USDC'
  amount: string
  createdAt: string
  expiryAt: string | null
  used: boolean
  usedBy: string | null
  usedAt: string | null
  txHash: string | null
}

export default function AdminInvitesPage() {
  const searchParams = useSearchParams()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [invites, setInvites] = useState<Invite[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  // Check authorization
  useEffect(() => {
    const checkAuth = () => {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
      if (!adminKey) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      const urlKey = searchParams?.get('adminKey')
      const storedKey = localStorage.getItem('adminKey')
      
      if (urlKey === adminKey || storedKey === adminKey) {
        setIsAuthorized(true)
        if (urlKey === adminKey) {
          localStorage.setItem('adminKey', adminKey)
        }
      } else {
        setIsAuthorized(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [searchParams])

  const fetchInvites = async () => {
    try {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
      const response = await fetch(`/api/admin/invites?adminKey=${adminKey}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invites')
      }

      setInvites(data.invites)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invites')
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      fetchInvites()
    }
  }, [isAuthorized])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchInvites()
    setIsRefreshing(false)
  }

  const handleRevoke = async (token: string) => {
    setIsRevoking(token)
    try {
      const response = await fetch('/api/invite/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke invite')
      }

      // Refresh the list
      await fetchInvites()
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invite')
    } finally {
      setIsRevoking(null)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      })

      if (!response.ok) {
        throw new Error('Failed to export invites')
      }

      const csv = await response.text()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'invites.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Failed to export invites')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.error('Failed to copy link')
    }
  }

  const getStatusBadge = (invite: Invite) => {
    const status = getInviteStatus(invite)
    const variants = {
      unused: 'default',
      used: 'secondary',
      expired: 'destructive'
    } as const
    
    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    )
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Admin access required. Please provide the admin key via URL parameter or localStorage.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invite Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage one-time invite links and view their usage status.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => window.open('/invite/create', '_blank')}>
                Create Invite
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Invites ({invites.length})</CardTitle>
              <CardDescription>
                View and manage all invite links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invites created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Used By</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-mono text-sm">
                            {invite.token}
                          </TableCell>
                          <TableCell>
                            {getRecipientName(invite.recipientId)}
                          </TableCell>
                          <TableCell>
                            {invite.amount} {invite.currency}
                          </TableCell>
                          <TableCell>
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {invite.expiryAt 
                              ? new Date(invite.expiryAt).toLocaleDateString()
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invite)}
                          </TableCell>
                          <TableCell>
                            {invite.usedBy ? (
                              <div className="text-sm">
                                <div>{invite.usedBy}</div>
                                {invite.usedAt && (
                                  <div className="text-muted-foreground">
                                    {new Date(invite.usedAt).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(invite.token)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/invite/${invite.token}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                              {!invite.used && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRevoke(invite.token)}
                                  disabled={isRevoking === invite.token}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
