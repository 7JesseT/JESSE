"use client"

import { useDailyFeatures } from "@/hooks/use-daily-features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Rocket, 
  Zap, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Sparkles,
  Activity
} from "lucide-react"

/**
 * Daily Features Component
 * 
 * Displays today's feature shipping and transaction processing status
 * Shows total counts and allows manual triggering of daily operations
 */
export function DailyFeatures() {
  const { 
    todayStatus, 
    isProcessing, 
    lastProcessedTx, 
    totalCounts,
    shipTodaysFeature,
    processDailyTransaction,
    handleDailyOperations
  } = useDailyFeatures()

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ui': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'functionality': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'integration': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'optimization': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'tip': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'mint': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
      case 'paywall': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
      case 'feature': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Today's Status */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Today's Daily Operations
          </CardTitle>
          <CardDescription>
            Automatic feature shipping and transaction processing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Feature Shipping</p>
                  <p className="text-sm text-muted-foreground">
                    {todayStatus.featureShipped ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
              {todayStatus.featureShipped ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
            </div>

            {/* Transaction Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Transaction Processing</p>
                  <p className="text-sm text-muted-foreground">
                    {todayStatus.transactionProcessed ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
              {todayStatus.transactionProcessed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </div>

          {/* Manual Trigger Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleDailyOperations}
              disabled={isProcessing || (todayStatus.featureShipped && todayStatus.transactionProcessed)}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run Daily Operations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Feature */}
      {todayStatus.featureToShip && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Today's Feature to Ship
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{todayStatus.featureToShip.title}</h3>
                <Badge className={getCategoryColor(todayStatus.featureToShip.category)}>
                  {todayStatus.featureToShip.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {todayStatus.featureToShip.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Version: {todayStatus.featureToShip.version}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => shipTodaysFeature(todayStatus.featureToShip!)}
                >
                  Ship Feature
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Transaction */}
      {todayStatus.transactionToProcess && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Today's Transaction to Process
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold capitalize">{todayStatus.transactionToProcess.type} Transaction</h3>
                <Badge className={getTransactionTypeColor(todayStatus.transactionToProcess.type)}>
                  {todayStatus.transactionToProcess.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {todayStatus.transactionToProcess.description}
              </p>
              {todayStatus.transactionToProcess.amount && (
                <p className="text-sm font-medium mb-3">
                  Amount: {todayStatus.transactionToProcess.amount} ETH
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ID: {todayStatus.transactionToProcess.id}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => processDailyTransaction(todayStatus.transactionToProcess!)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Process Transaction'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Statistics */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Total Statistics
          </CardTitle>
          <CardDescription>
            Lifetime feature shipping and transaction processing counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalCounts.totalFeaturesShipped}
              </div>
              <div className="text-sm text-muted-foreground">Features Shipped</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {totalCounts.totalTransactionsProcessed}
              </div>
              <div className="text-sm text-muted-foreground">Transactions Processed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Processed Transaction */}
      {lastProcessedTx && (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Last transaction processed: {lastProcessedTx}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
