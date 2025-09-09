'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Copy, QrCode, Link as LinkIcon } from 'lucide-react'
import { RECIPIENTS } from '@/config/recipients'
import { type SupportedCurrency } from '@/config/addresses'
import { validateInviteData } from '@/lib/invites-client'
import QRCode from 'react-qr-code'

export default function CreateInvitePage() {
  const searchParams = useSearchParams()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [recipientId, setRecipientId] = useState('')
  const [currency, setCurrency] = useState<SupportedCurrency>('ETH')
  const [amount, setAmount] = useState('0.5')
  const [expiryMinutes, setExpiryMinutes] = useState<number | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ token: string; url: string } | null>(null)

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

  const handleCreateInvite = async () => {
    if (!recipientId || !amount) {
      setError('Please fill in all required fields')
      return
    }

    // Client-side validation
    const validation = validateInviteData(recipientId, currency, amount, expiryMinutes)
    if (!validation.valid) {
      setError(validation.error || 'Invalid input')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const response = await fetch('/api/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          currency,
          amount,
          expiryMinutes
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite')
      }

      setSuccess(data)
    } catch (err: any) {
      setError(err.message || 'Failed to create invite')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!success) return
    try {
      await navigator.clipboard.writeText(success.url)
    } catch (err) {
      console.error('Failed to copy URL')
    }
  }

  const handleCopyToken = async () => {
    if (!success) return
    try {
      await navigator.clipboard.writeText(success.token)
    } catch (err) {
      console.error('Failed to copy token')
    }
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
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Invite Link</h1>
            <p className="text-muted-foreground mt-2">
              Generate one-time invite links that prefill the TipJar with recipient and amount.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invite Configuration</CardTitle>
              <CardDescription>
                Configure the invite link parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient *</Label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENTS.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={currency} onValueChange={(value: SupportedCurrency) => setCurrency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry (optional)</Label>
                <Select 
                  value={expiryMinutes?.toString() || 'none'} 
                  onValueChange={(value) => setExpiryMinutes(value === 'none' ? undefined : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No expiry</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                    <SelectItem value="10080">1 week</SelectItem>
                    <SelectItem value="43200">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateInvite} 
                disabled={isCreating || !recipientId || !amount}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Generate Invite'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {success && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Invite Created Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Invite URL</Label>
                  <div className="flex gap-2">
                    <Input value={success.url} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={handleCopyUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Token</Label>
                  <div className="flex gap-2">
                    <Input value={success.token} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={handleCopyToken}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>QR Code</Label>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCode value={success.url} size={200} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSuccess(null)}>
                    Create Another
                  </Button>
                  <Button onClick={() => window.open(success.url, '_blank')}>
                    Test Invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
