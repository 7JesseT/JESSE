#!/usr/bin/env node

/**
 * Test script for the Dispute Resolution & Auto-Refunds system
 * This script tests the complete workflow from refund request to auto-processing
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_WALLET = '0xtest123456789012345678901234567890123456';
const ADMIN_WALLET = '0x1234567890123456789012345678901234567890';

// Test transaction ID (using existing seed data)
const TEST_TRANSACTION_ID = 'seed-13-0';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🔥 Making request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return { error };
  }
}

async function createTestEvidence() {
  const evidenceContent = `
Test Evidence Document
=====================

Refund Reason: Duplicate Purchase
Date: ${new Date().toISOString()}
Details: This is a test evidence file demonstrating duplicate purchase scenario.

Transaction Details:
- Original Transaction: ${TEST_TRANSACTION_ID}
- Duplicate detected due to network issues
- User accidentally submitted twice
- Evidence: Screenshot of duplicate transactions

This evidence supports the refund request for automatic processing.
  `.trim();
  
  const evidencePath = path.join(__dirname, 'test-evidence.txt');
  fs.writeFileSync(evidencePath, evidenceContent);
  console.log(`📝 Created test evidence file: ${evidencePath}`);
  return evidencePath;
}

async function testCompleteWorkflow() {
  console.log('🚀 Starting Dispute Resolution System Test');
  console.log('===========================================');
  
  let refundId = null;
  
  try {
    // Step 1: Create refund request
    console.log('\n📋 Step 1: Creating refund request...');
    const { data: refundData } = await makeRequest('/api/request-refund', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: TEST_TRANSACTION_ID,
        reason: 'Duplicate purchase - evidence will be provided',
        buyerAddress: TEST_WALLET
      })
    });
    
    if (!refundData.success) {
      throw new Error('Failed to create refund request');
    }
    
    refundId = refundData.refundRequest.id;
    console.log(`✅ Refund request created with ID: ${refundId}`);
    console.log(`📊 Initial status: ${refundData.refundRequest.status}`);
    
    // Step 2: Upload evidence
    console.log('\n📎 Step 2: Uploading evidence...');
    const evidencePath = await createTestEvidence();
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('refundId', refundId);
    formData.append('tags', 'duplicate,test,automated');
    
    // Read file and create blob
    const fileContent = fs.readFileSync(evidencePath);
    const file = new Blob([fileContent], { type: 'text/plain' });
    formData.append('files', file, 'test-evidence.txt');
    
    const evidenceResponse = await fetch(`${BASE_URL}/api/upload-evidence`, {
      method: 'POST',
      body: formData
    });
    
    const evidenceData = await evidenceResponse.json();
    console.log(`📊 Evidence upload status: ${evidenceResponse.status}`);
    console.log(`📋 Evidence response:`, JSON.stringify(evidenceData, null, 2));
    
    if (!evidenceData.success) {
      console.log('⚠️  Evidence upload failed, continuing with basic refund request...');
    } else {
      console.log(`✅ Evidence uploaded successfully`);
      console.log(`📊 Updated status: ${evidenceData.refundRequest.status}`);
    }
    
    // Step 3: Check auto-refund eligibility
    console.log('\n🤖 Step 3: Checking auto-refund eligibility...');
    const { data: eligibilityData } = await makeRequest('/api/refunds/auto-check?network=sepolia');
    
    if (eligibilityData.success) {
      console.log(`✅ Auto-refund check completed`);
      console.log(`📊 Total eligible refunds: ${eligibilityData.total}`);
      
      const ourRefund = eligibilityData.results.find(r => r.refundId === refundId);
      if (ourRefund) {
        console.log(`🎯 Our refund found in results:`);
        console.log(`   - Recommended: ${ourRefund.recommendation}`);
        console.log(`   - Confidence: ${ourRefund.confidence}%`);
      }
    }
    
    // Step 4: Run auto-refund check (dry run)
    console.log('\n🧪 Step 4: Running auto-refund check (dry run)...');
    const { data: dryRunData } = await makeRequest('/api/refunds/auto-check', {
      method: 'POST',
      headers: {
        'x-wallet-address': ADMIN_WALLET
      },
      body: JSON.stringify({
        network: 'sepolia',
        dryRun: true
      })
    });
    
    if (dryRunData.success) {
      console.log(`✅ Dry run completed`);
      console.log(`📊 Processed: ${dryRunData.processed}`);
      console.log(`📊 Would auto-refund: ${dryRunData.autoRefunded}`);
      
      const ourResult = dryRunData.results.find(r => r.refundId === refundId);
      if (ourResult) {
        console.log(`🎯 Our refund result: ${ourResult.status} - ${ourResult.reason}`);
      }
    }
    
    // Step 5: Actual auto-refund processing (if eligible)
    console.log('\n⚡ Step 5: Processing auto-refunds...');
    const { data: processData } = await makeRequest('/api/refunds/auto-check', {
      method: 'POST',
      headers: {
        'x-wallet-address': ADMIN_WALLET
      },
      body: JSON.stringify({
        network: 'sepolia',
        dryRun: false
      })
    });
    
    if (processData.success) {
      console.log(`✅ Auto-refund processing completed`);
      console.log(`📊 Processed: ${processData.processed}`);
      console.log(`📊 Auto-refunded: ${processData.autoRefunded}`);
      
      const ourResult = processData.results.find(r => r.refundId === refundId);
      if (ourResult) {
        console.log(`🎯 Our refund result: ${ourResult.status}`);
        if (ourResult.status === 'auto_refunded') {
          console.log(`   💰 Refund TX: ${ourResult.refundTxHash || 'N/A'}`);
          console.log(`   🔥 Burn TX: ${ourResult.burnTxHash || 'N/A'}`);
        }
      }
    }
    
    // Step 6: Verify final state
    console.log('\n✅ Step 6: Verifying final state...');
    
    // Check refunds.json
    const refundsPath = path.join(process.cwd(), 'data/refunds.json');
    if (fs.existsSync(refundsPath)) {
      const refundsData = JSON.parse(fs.readFileSync(refundsPath, 'utf8'));
      const finalRefund = refundsData.refunds.find(r => r.id === refundId);
      
      if (finalRefund) {
        console.log(`📋 Final refund state:`);
        console.log(`   - Status: ${finalRefund.status}`);
        console.log(`   - Evidence count: ${finalRefund.evidence?.length || 0}`);
        console.log(`   - Updated: ${finalRefund.updatedAt}`);
        console.log(`   - Auto-check: ${finalRefund.autoRefundCheckedAt || 'Not checked'}`);
      }
    }
    
    // Check audit logs
    const auditPath = path.join(process.cwd(), 'data/audit-logs.json');
    if (fs.existsSync(auditPath)) {
      const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
      const relatedLogs = auditData.filter(log => 
        log.details?.refundId === refundId || 
        log.details?.transactionId === TEST_TRANSACTION_ID
      );
      
      console.log(`📋 Related audit logs: ${relatedLogs.length}`);
      relatedLogs.forEach(log => {
        console.log(`   - ${log.type}: ${log.metadata}`);
      });
    }
    
    // Cleanup
    console.log('\n🧹 Cleanup...');
    const evidencePath = path.join(__dirname, 'test-evidence.txt');
    if (fs.existsSync(evidencePath)) {
      fs.unlinkSync(evidencePath);
      console.log(`🗑️  Removed test evidence file`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('=====================================');
    console.log('Next steps:');
    console.log('1. Check /admin/refunds to see the admin interface');
    console.log('2. Check /refunds to see the buyer interface');
    console.log('3. Verify evidence files in /data/uploads/');
    console.log('4. Review audit logs in /data/audit-logs.json');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to cleanup on error
    const evidencePath = path.join(__dirname, 'test-evidence.txt');
    if (fs.existsSync(evidencePath)) {
      fs.unlinkSync(evidencePath);
    }
    
    process.exit(1);
  }
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Add fetch polyfill for Node.js
  if (typeof fetch === 'undefined') {
    console.log('⚠️  Note: fetch not available, using node-fetch simulation');
    global.fetch = async (url, options = {}) => {
      const https = require('https');
      const http = require('http');
      const urlLib = require('url');
      
      return new Promise((resolve, reject) => {
        const parsedUrl = urlLib.parse(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const req = client.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.path,
          method: options.method || 'GET',
          headers: options.headers || {}
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(data))
            });
          });
        });
        
        req.on('error', reject);
        
        if (options.body) {
          req.write(options.body);
        }
        req.end();
      });
    };
    
    global.FormData = class FormData {
      constructor() {
        this.data = {};
      }
      append(key, value, filename) {
        this.data[key] = { value, filename };
      }
    };
    
    global.Blob = class Blob {
      constructor(parts, options = {}) {
        this.parts = parts;
        this.type = options.type;
      }
    };
  }
  
  // Run the test
  testCompleteWorkflow().catch(console.error);
}

module.exports = { testCompleteWorkflow };
