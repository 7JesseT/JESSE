'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, ArrowRight, Heart } from 'lucide-react'
import { RECIPIENTS } from '@/config/recipients'

type InviteData = {
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
  status: 'unused' | 'used' | 'expired'
}

export default function InviteTokenPage() {
  const params = useParams()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const token = params.token as string

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/invite/${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch invite')
        }

        setInvite(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load invite')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchInvite()
    }
  }, [token])

  const handleUseInvite = () => {
    if (!invite) return

    // Store prefill data in localStorage
    const prefill = {
      recipientId: invite.recipientId,
      currency: invite.currency,
      amount: invite.amount,
      token: invite.token
    }
    
    localStorage.setItem('baseDaily:invitePrefill', JSON.stringify(prefill))
    
    // Redirect to home page (where TipJar is)
    router.push('/')
  }

  const recipient = invite ? RECIPIENTS.find(r => r.id === invite.recipientId) : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Invalid Invite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    {error || 'This invite link is invalid or has expired.'}
                  </AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/')} className="w-full">
                  Go to TipJar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (invite.status === 'used' || invite.status === 'expired') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <XCircle className="h-5 w-5" />
                  Invite {invite.status === 'used' ? 'Used' : 'Expired'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    {invite.status === 'used' 
                      ? 'This invite has already been used.'
                      : 'This invite has expired.'
                    }
                  </AlertDescription>
                </Alert>
                
                {invite.status === 'used' && invite.usedBy && (
                  <div className="text-sm text-muted-foreground">
                    Used by: {invite.usedBy}
                  </div>
                )}
                
                {invite.status === 'used' && invite.usedAt && (
                  <div className="text-sm text-muted-foreground">
                    Used at: {new Date(invite.usedAt).toLocaleString()}
                  </div>
                )}
                
                <Button onClick={() => router.push('/')} className="w-full">
                  Go to TipJar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Valid Invite
              </CardTitle>
              <CardDescription>
                This invite will prefill the TipJar with the specified details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Recipient:</span>
                  <span className="text-sm">{recipient?.name || invite.recipientId}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm">{invite.amount} {invite.currency}</span>
                </div>
                
                {invite.expiryAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-sm">{new Date(invite.expiryAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <Alert>
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  Click the button below to use this invite and send your tip!
                </AlertDescription>
              </Alert>

              <Button onClick={handleUseInvite} className="w-full" size="lg">
                Use Invite → Send Tip
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
