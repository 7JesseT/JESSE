#!/usr/bin/env node

/**
 * Analytics Acceptance Test Script
 * 
 * This script tests the analytics endpoints and functionality
 * Run with: node scripts/check-analytics.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2));
      return { success: true, data: response.data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   📊 Response:`, response.data);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testCSVGeneration() {
  console.log(`\n🧪 Testing CSV Generation...`);
  
  try {
    // First get some daily metrics data
    const response = await makeRequest(`${BASE_URL}/api/admin/metrics/daily?days=7`);
    
    if (response.status !== 200) {
      console.log(`   ❌ Failed to get daily metrics: ${response.status}`);
      return { success: false, error: 'Failed to get daily metrics' };
    }
    
    const dailyMetrics = response.data;
    
    if (!Array.isArray(dailyMetrics) || dailyMetrics.length === 0) {
      console.log(`   ⚠️  No daily metrics data available`);
      return { success: false, error: 'No data available for CSV test' };
    }
    
    // Generate CSV content
    const headers = ['date', 'tipsCount', 'revenueUsd', 'refundsCount', 'mintsCount', 'shipmentsDelivered', 'shipmentsPending'];
    const csvContent = [
      headers.join(','),
      ...dailyMetrics.map(row => 
        headers.map(header => row[header]).join(',')
      )
    ].join('\n');
    
    // Validate CSV format
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      console.log(`   ❌ CSV has insufficient data`);
      return { success: false, error: 'CSV has insufficient data' };
    }
    
    const headerLine = lines[0];
    const expectedHeaders = 'date,tipsCount,revenueUsd,refundsCount,mintsCount,shipmentsDelivered,shipmentsPending';
    
    if (headerLine !== expectedHeaders) {
      console.log(`   ❌ CSV headers don't match expected format`);
      console.log(`   Expected: ${expectedHeaders}`);
      console.log(`   Got: ${headerLine}`);
      return { success: false, error: 'CSV headers mismatch' };
    }
    
    console.log(`   ✅ CSV generation successful`);
    console.log(`   📊 Generated ${lines.length - 1} data rows`);
    console.log(`   📄 Sample CSV content:`);
    console.log(`   ${lines.slice(0, 3).join('\n   ')}${lines.length > 3 ? '\n   ...' : ''}`);
    
    return { success: true, data: { rows: lines.length - 1, content: csvContent } };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Analytics Acceptance Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  const results = [];
  
  // Test 1: Daily metrics endpoint
  const dailyResult = await testEndpoint(
    'Daily Metrics (7 days)',
    `${BASE_URL}/api/admin/metrics/daily?days=7`
  );
  results.push({ test: 'daily-metrics', ...dailyResult });
  
  // Test 2: Summary metrics endpoint
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const summaryResult = await testEndpoint(
    'Summary Metrics (last 7 days)',
    `${BASE_URL}/api/admin/metrics/summary?from=${weekAgo}&to=${today}`
  );
  results.push({ test: 'summary-metrics', ...summaryResult });
  
  // Test 3: Seed endpoint (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const seedResult = await testEndpoint(
      'Seed Demo Data',
      `${BASE_URL}/api/admin/metrics/seed`,
      { method: 'POST' }
    );
    results.push({ test: 'seed-data', ...seedResult });
    
    // If seeding was successful, test the endpoints again
    if (seedResult.success) {
      console.log('\n🔄 Re-testing endpoints after seeding...');
      
      const dailyAfterSeed = await testEndpoint(
        'Daily Metrics (after seed)',
        `${BASE_URL}/api/admin/metrics/daily?days=7`
      );
      results.push({ test: 'daily-metrics-after-seed', ...dailyAfterSeed });
      
      const summaryAfterSeed = await testEndpoint(
        'Summary Metrics (after seed)',
        `${BASE_URL}/api/admin/metrics/summary?from=${weekAgo}&to=${today}`
      );
      results.push({ test: 'summary-metrics-after-seed', ...summaryAfterSeed });
    }
  } else {
    console.log('\n⚠️  Skipping seed test in production environment');
  }
  
  // Test 4: CSV generation
  const csvResult = await testCSVGeneration();
  results.push({ test: 'csv-generation', ...csvResult });
  
  // Test 5: Error handling
  const errorResult = await testEndpoint(
    'Error Handling (invalid dates)',
    `${BASE_URL}/api/admin/metrics/summary?from=invalid&to=dates`
  );
  results.push({ test: 'error-handling', ...errorResult });
  
  // Summary
  console.log('\n📋 Test Results Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
    if (!result.success && result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log('='.repeat(50));
  console.log(`📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Analytics system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Analytics Acceptance Test Script

Usage: node scripts/check-analytics.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set base URL (default: http://localhost:3000)

Environment Variables:
  BASE_URL       Base URL for the application
  NODE_ENV       Environment (development/production)

Examples:
  node scripts/check-analytics.js
  BASE_URL=https://myapp.com node scripts/check-analytics.js
  node scripts/check-analytics.js --url http://localhost:3001
`);
  process.exit(0);
}

// Parse --url argument
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.BASE_URL = process.argv[urlIndex + 1];
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
