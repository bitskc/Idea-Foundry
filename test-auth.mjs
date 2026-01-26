// Test authentication flow
const API_URL = 'https://plan.ideafoundry.app';

async function testAuth() {
  console.log('Testing authentication flow...\n');
  
  // Test without auth
  console.log('1. Testing without auth header:');
  const response1 = await fetch(`${API_URL}/api/projects`);
  console.log('Status:', response1.status);
  console.log('Body:', await response1.text());
  console.log();
  
  // Test with dummy token
  console.log('2. Testing with dummy Bearer token:');
  const response2 = await fetch(`${API_URL}/api/projects`, {
    headers: {
      'Authorization': 'Bearer dummy-token-12345'
    }
  });
  console.log('Status:', response2.status);
  const body2 = await response2.text();
  console.log('Body:', body2);
}

testAuth();
