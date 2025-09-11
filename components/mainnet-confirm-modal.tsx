"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Shield } from "lucide-react"
import { setMainnetConfirmed } from "@/lib/networks"

interface MainnetConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MainnetConfirmModal({ open, onOpenChange, onConfirm }: MainnetConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  const handleConfirmTextChange = (value: string) => {
    setConfirmText(value)
    setIsConfirmed(value === "CONFIRM MAINNET")
  }

  const handleConfirm = () => {
    if (isConfirmed) {
      setMainnetConfirmed()
      onConfirm()
      onOpenChange(false)
      setConfirmText("")
      setIsConfirmed(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setConfirmText("")
    setIsConfirmed(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Mainnet Transaction Warning
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ REAL FUNDS WARNING
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                You are about to send a transaction on Base Mainnet using real funds. 
                This transaction cannot be undone and will cost real money.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Before proceeding, please confirm:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• You understand this uses real funds</li>
                <li>• You have sufficient balance for gas fees</li>
                <li>• You are sending to the correct recipient</li>
                <li>• You understand this transaction is irreversible</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              Type <code className="bg-muted px-1 py-0.5 rounded text-xs">CONFIRM MAINNET</code> to proceed:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => handleConfirmTextChange(e.target.value)}
              placeholder="CONFIRM MAINNET"
              className="font-mono"
            />
          </div>

          {confirmText && !isConfirmed && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Please type exactly: <code className="font-mono">CONFIRM MAINNET</code>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isConfirmed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Shield className="h-4 w-4 mr-2" />
            Confirm Mainnet Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
