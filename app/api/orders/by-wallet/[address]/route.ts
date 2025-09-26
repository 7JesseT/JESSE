import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsByUser } from '@/lib/transactions';
import { isAdminWallet } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const requestingWallet = searchParams.get('wallet');

    if (!requestingWallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Security check: only allow access to the wallet owner or admin
    const isAdmin = await isAdminWallet(requestingWallet);
    const isOwner = address.toLowerCase() === requestingWallet.toLowerCase();

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const transactions = await getTransactionsByUser(address);

    // Get shipment data for all transactions
    let shipmentsData = [];
    try {
      const shipmentsResponse = await fetch(`${request.nextUrl.origin}/api/shipments`);
      if (shipmentsResponse.ok) {
        shipmentsData = await shipmentsResponse.json();
      }
    } catch (error) {
      console.error('Error fetching shipment data:', error);
    }

    // Format orders response
    const orders = transactions.map(transaction => {
      const shipmentData = shipmentsData.find((s: any) => s.transactionId === transaction.id);
      
      return {
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
    });

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders by wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
