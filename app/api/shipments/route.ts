import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SHIPMENTS_PATH = path.resolve(process.cwd(), 'data/shipments.json')

export async function GET() {
  try {
    const raw = await fs.readFile(SHIPMENTS_PATH, 'utf-8')
    const shipments = JSON.parse(raw)
    
    return NextResponse.json({ shipments })
  } catch (error) {
    console.error('Error reading shipments:', error)
    return NextResponse.json(
      { error: 'Failed to read shipments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { wallet, tokenId, status, txHash } = await request.json()
    
    if (!wallet || !tokenId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, tokenId, status' },
        { status: 400 }
      )
    }
    
    // Read existing shipments
    let shipments: any[] = []
    try {
      const raw = await fs.readFile(SHIPMENTS_PATH, 'utf-8')
      shipments = JSON.parse(raw)
    } catch {
      shipments = []
    }
    
    // Add new shipment update
    const shipmentUpdate = {
      wallet,
      tokenId,
      status,
      txHash: txHash || '',
      date: new Date().toISOString(),
    }
    
    shipments.push(shipmentUpdate)
    
    // Write back to file
    await fs.writeFile(SHIPMENTS_PATH, JSON.stringify(shipments, null, 2))
    
    // Trigger notification for shipment update
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'info',
          category: 'shipment',
          title: 'Shipment Update',
          message: `📦 Your item is now ${status}.`,
          autoDismiss: true,
          dismissAfter: 7000,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send shipment notification:', notificationError);
    }
    
    return NextResponse.json({
      success: true,
      shipment: shipmentUpdate
    })
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500 }
    )
  }
}
