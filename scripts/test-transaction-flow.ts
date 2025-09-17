// Test script to verify transaction flow
// This can be run in the browser console or as a separate test

async function testTransactionFlow() {
  console.log('🧪 Testing Transaction Flow...')
  
  try {
    // Test 1: Create a transaction
    console.log('1. Creating test transaction...')
    const createResponse = await fetch('/api/transactions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: '0x1234567890123456789012345678901234567890',
        amount: 1.5,
        currency: 'ETH',
        type: 'tip',
        status: 'pending',
        timestamp: new Date().toISOString(),
        txHash: '0xtest1234567890123456789012345678901234567890123456789012345678901234',
        metadata: {
          recipientId: 'env-club'
        }
      })
    })
    
    const createData = await createResponse.json()
    if (createResponse.ok) {
      console.log('✅ Transaction created:', createData.transaction)
      
      // Test 2: Get transactions
      console.log('2. Fetching transactions...')
      const getResponse = await fetch('/api/transactions')
      const getData = await getResponse.json()
      
      if (getResponse.ok) {
        console.log('✅ Transactions fetched:', getData.transactions.length, 'total')
        
        // Test 3: Update transaction status
        console.log('3. Updating transaction status...')
        const updateResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: createData.transaction.id,
            status: 'confirmed'
          })
        })
        
        const updateData = await updateResponse.json()
        if (updateResponse.ok) {
          console.log('✅ Transaction status updated:', updateData.transaction)
          
          // Test 4: Update to shipped
          console.log('4. Updating to shipped...')
          const shipResponse = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: createData.transaction.id,
              status: 'shipped'
            })
          })
          
          const shipData = await shipResponse.json()
          if (shipResponse.ok) {
            console.log('✅ Transaction shipped:', shipData.transaction)
            console.log('🎉 All tests passed! Transaction flow is working correctly.')
          } else {
            console.error('❌ Failed to ship transaction:', shipData.error)
          }
        } else {
          console.error('❌ Failed to update transaction:', updateData.error)
        }
      } else {
        console.error('❌ Failed to fetch transactions:', getData.error)
      }
    } else {
      console.error('❌ Failed to create transaction:', createData.error)
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testTransactionFlow = testTransactionFlow
}

export { testTransactionFlow }
