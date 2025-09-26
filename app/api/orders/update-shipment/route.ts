import { NextRequest, NextResponse } from 'next/server';
import { getTransactionById, updateTransactionStatus } from '@/lib/transactions';
import { isAdminWallet } from '@/lib/admin-auth';
import { appendAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, status, note, location, adminWallet } = body;

    if (!transactionId || !status || !adminWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin access
    const isAdmin = await isAdminWallet(adminWallet);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get the transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    const updatedTransaction = await updateTransactionStatus(transactionId, status);

    // Log the shipment update
    await appendAudit({
      type: 'shipment_update',
      actor: adminWallet,
      user: transaction.user,
      details: {
        transactionId,
        oldStatus: transaction.status,
        newStatus: status,
        note,
        location
      },
      metadata: `Shipment status updated to ${status}`
    });

    // TODO: In a real implementation, you would trigger notifications here
    // For now, we'll just return success. The notification system is client-side
    // and would need to be integrated with a real-time system like WebSockets
    // or Server-Sent Events to notify users of shipment updates.

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
