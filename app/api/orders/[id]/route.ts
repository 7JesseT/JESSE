import { NextRequest, NextResponse } from 'next/server';
import { getTransactionById } from '@/lib/transactions';
import { isAdminWallet } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const transaction = await getTransactionById(id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Security check: only allow access to the buyer or admin
    const isAdmin = await isAdminWallet(walletAddress);
    const isBuyer = transaction.user.toLowerCase() === walletAddress.toLowerCase();

    if (!isAdmin && !isBuyer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get shipment data if available
    let shipmentData = null;
    try {
      const shipmentsResponse = await fetch(`${request.nextUrl.origin}/api/shipments`);
      if (shipmentsResponse.ok) {
        const shipmentsData = await shipmentsResponse.json();
        shipmentData = shipmentsData.find((s: any) => s.transactionId === id);
      }
    } catch (error) {
      console.error('Error fetching shipment data:', error);
    }

    // Format order response
    const order = {
      id: transaction.id,
      buyer: transaction.user,
      itemId: transaction.metadata?.fileId || transaction.metadata?.tokenId || transaction.metadata?.event,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      createdAt: transaction.timestamp,
      txHash: transaction.txHash,
      refundTxHash: transaction.refundTxHash,
      refundedAt: transaction.refundedAt,
      refundedBy: transaction.refundedBy,
      metadata: transaction.metadata,
      shipmentUpdates: shipmentData ? [
        {
          timestamp: shipmentData.date,
          note: `Order ${shipmentData.status}`,
          location: shipmentData.status === 'shipped' ? 'In Transit' : 
                   shipmentData.status === 'delivered' ? 'Delivered' : 'Processing',
          status: shipmentData.status
        }
      ] : []
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
