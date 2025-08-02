// explore-signal-api.js
// Discover available endpoints and test registration methods

import fetch from 'node-fetch';

const baseUrl = 'http://localhost:8080';
const phoneNumber = '+16464394850'; // Your MySudo number

async function exploreAPI() {
    console.log('🔍 Exploring Signal API endpoints...\n');
    
    // Test basic info
    try {
        const aboutResponse = await fetch(`${baseUrl}/v1/about`);
        if (aboutResponse.ok) {
            const aboutData = await aboutResponse.json();
            console.log('📋 API Information:');
            console.log(`   Build: ${aboutData.build}`);
            console.log(`   Mode: ${aboutData.mode}`);
            console.log(`   Available versions: ${aboutData.versions.join(', ')}`);
            console.log('');
        }
    } catch (error) {
        console.log('❌ API not accessible:', error.message);
        return;
    }
    
    // Test different registration endpoints
    const endpoints = [
        // v1 endpoints
        { method: 'POST', path: '/v1/register', desc: 'Basic registration' },
        { method: 'POST', path: '/v1/qrcodelink', desc: 'QR code linking v1' },
        { method: 'GET', path: '/v1/qrcodelink', desc: 'QR code linking GET v1' },
        
        // v2 endpoints  
        { method: 'POST', path: '/v2/register', desc: 'Basic registration v2' },
        { method: 'POST', path: '/v2/qrcodelink', desc: 'QR code linking v2' },
        { method: 'GET', path: '/v2/qrcodelink', desc: 'QR code linking GET v2' },
        
        // Other possibilities
        { method: 'POST', path: '/v1/link', desc: 'Alternative link endpoint' },
        { method: 'POST', path: '/v2/link', desc: 'Alternative link endpoint v2' },
    ];
    
    console.log('🧪 Testing available endpoints:\n');
    
    for (const endpoint of endpoints) {
        try {
            const url = `${baseUrl}${endpoint.path}`;
            
            let options = {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            // Add minimal body for POST requests
            if (endpoint.method === 'POST') {
                if (endpoint.path.includes('register')) {
                    options.body = JSON.stringify({ number: phoneNumber });
                } else if (endpoint.path.includes('link') || endpoint.path.includes('qr')) {
                    options.body = JSON.stringify({ device_name: 'SignalBot' });
                }
            }
            
            const response = await fetch(url, options);
            
            if (response.status === 404) {
                console.log(`❌ ${endpoint.method} ${endpoint.path} - Not found`);
            } else if (response.status === 400) {
                console.log(`⚠️  ${endpoint.method} ${endpoint.path} - Bad request (endpoint exists)`);
                
                // Try to get error details
                const errorText = await response.text();
                if (errorText) {
                    console.log(`     Error: ${errorText.substring(0, 100)}...`);
                }
            } else if (response.status === 200 || response.status === 201) {
                console.log(`✅ ${endpoint.method} ${endpoint.path} - Available!`);
                
                const responseText = await response.text();
                if (responseText) {
                    console.log(`     Response: ${responseText.substring(0, 100)}...`);
                }
            } else {
                console.log(`🔶 ${endpoint.method} ${endpoint.path} - Status ${response.status}`);
            }
            
        } catch (error) {
            console.log(`💥 ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
        }
    }
}

async function checkRegistrationStatus() {
    console.log('\n📱 Checking registration status...\n');
    
    // Test receive endpoint to see if number is registered
    try {
        const receiveUrl = `${baseUrl}/v1/receive/${encodeURIComponent(phoneNumber)}`;
        console.log(`Testing: GET ${receiveUrl}`);
        
        const response = await fetch(receiveUrl);
        
        if (response.ok) {
            console.log('✅ Number appears to be registered (receive works)');
            const messages = await response.json();
            console.log(`   Retrieved ${Array.isArray(messages) ? messages.length : 0} messages`);
        } else if (response.status === 400) {
            console.log('❌ Number not registered (400 error on receive)');
            const errorText = await response.text();
            console.log(`   Error details: ${errorText}`);
        } else {
            console.log(`🔶 Unexpected status: ${response.status}`);
            const errorText = await response.text();
            console.log(`   Response: ${errorText}`);
        }
        
    } catch (error) {
        console.log('💥 Error checking registration:', error.message);
    }
}

async function tryDirectRegistration() {
    console.log('\n🔧 Attempting direct registration...\n');
    
    const registrationData = {
        number: phoneNumber,
        voice: false // Use SMS instead of voice call
    };
    
    // Try v1 registration
    try {
        console.log('Trying v1 registration...');
        const response = await fetch(`${baseUrl}/v1/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });
        
        if (response.ok) {
            console.log('✅ v1 registration request sent!');
            const result = await response.text();
            console.log(`Response: ${result}`);
        } else {
            console.log(`❌ v1 registration failed: ${response.status}`);
            const errorText = await response.text();
            console.log(`Error: ${errorText}`);
        }
        
    } catch (error) {
        console.log('💥 v1 registration error:', error.message);
    }
    
    // Try v2 registration
    try {
        console.log('\nTrying v2 registration...');
        const response = await fetch(`${baseUrl}/v2/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });
        
        if (response.ok) {
            console.log('✅ v2 registration request sent!');
            const result = await response.text();
            console.log(`Response: ${result}`);
        } else {
            console.log(`❌ v2 registration failed: ${response.status}`);
            const errorText = await response.text();
            console.log(`Error: ${errorText}`);
        }
        
    } catch (error) {
        console.log('💥 v2 registration error:', error.message);
    }
}

async function checkDockerContainer() {
    console.log('🐳 Docker Container Information:\n');
    
    console.log('Run these commands to check your setup:');
    console.log('');
    console.log('1. Check if container is running:');
    console.log('   docker ps | grep signal-api');
    console.log('');
    console.log('2. Check container logs:');
    console.log('   docker logs signal-api');
    console.log('');
    console.log('3. Get container details:');
    console.log('   docker inspect signal-api');
    console.log('');
    console.log('4. Access container shell:');
    console.log('   docker exec -it signal-api /bin/bash');
    console.log('');
    console.log('5. Try signal-cli directly:');
    console.log('   docker exec -it signal-api signal-cli --help');
    console.log('');
}

async function main() {
    console.log('🤖 Signal API Explorer\n');
    console.log('=====================================\n');
    
    await exploreAPI();
    await checkRegistrationStatus();
    await tryDirectRegistration();
    
    console.log('\n=====================================');
    await checkDockerContainer();
    
    console.log('\n💡 Next steps based on results:');
    console.log('   1. If any endpoint worked → try that method');
    console.log('   2. If all 404 → check API documentation');
    console.log('   3. If 400 errors → registration may be needed');
    console.log('   4. Check docker logs for more details');
}

main().catch(console.error);