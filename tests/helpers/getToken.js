/**
 * Helper Script to Extract JWT Token
 * 
 * This script helps you get a JWT token for testing purposes.
 * It provides multiple methods to obtain a token.
 * 
 * Usage: node tests/helpers/getToken.js
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n='.repeat(60));
console.log('JWT TOKEN HELPER FOR TESTING');
console.log('='.repeat(60));
console.log('\nThis helper will guide you through getting a JWT token.\n');

console.log('📋 METHODS TO GET A JWT TOKEN:\n');
console.log('1. LOGIN VIA POSTMAN/API CLIENT');
console.log('   - POST request to: http://localhost:3000/api/auth/login');
console.log('   - Body: { "email": "your@email.com", "password": "yourpass" }');
console.log('   - Copy the token from the response\n');

console.log('2. FROM BROWSER (if using the frontend)');
console.log('   - Login to your frontend application');
console.log('   - Open DevTools (F12)');
console.log('   - Go to: Application → Local Storage');
console.log('   - Look for keys like: "token", "authToken", or "accessToken"');
console.log('   - Copy the value\n');

console.log('3. FROM BROWSER NETWORK TAB');
console.log('   - Login to your frontend');
console.log('   - Open DevTools (F12) → Network tab');
console.log('   - Look for API requests');
console.log('   - Check Headers → Authorization: Bearer [TOKEN]');
console.log('   - Copy the token part\n');

console.log('4. FROM DATABASE (Advanced)');
console.log('   - If you store tokens in DB, query them directly');
console.log('   - Run: npm run prisma:studio');
console.log('   - Browse your user/session tables\n');

console.log('='.repeat(60));
console.log('\n💡 QUICK TEST:');
console.log('   After getting the token, test it with:');
console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('        http://localhost:3000/api/questions\n');

console.log('='.repeat(60));

rl.question('\n📝 Paste your JWT token here (or press Enter to skip): ', (token) => {
    if (token && token.trim().length > 0) {
        console.log('\n✅ Token received!');
        console.log('   Length:', token.length);
        console.log('   Preview:', token.substring(0, 50) + '...');
        
        // Basic validation
        const parts = token.split('.');
        if (parts.length === 3) {
            console.log('   ✅ Format looks valid (3 parts separated by dots)');
            
            try {
                // Decode header and payload (without verification)
                const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                
                console.log('\n📄 Token Info:');
                console.log('   Algorithm:', header.alg);
                console.log('   Type:', header.typ);
                
                if (payload.exp) {
                    const expiryDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    const isExpired = expiryDate < now;
                    
                    console.log('   Expires:', expiryDate.toLocaleString());
                    console.log('   Status:', isExpired ? '❌ EXPIRED' : '✅ VALID');
                    
                    if (isExpired) {
                        console.log('\n   ⚠️  WARNING: This token has expired! Get a new one.');
                    }
                }
                
                if (payload.userId || payload.sub || payload.uid) {
                    console.log('   User ID:', payload.userId || payload.sub || payload.uid);
                }
                
                if (payload.roles || payload.role) {
                    console.log('   Roles:', payload.roles || payload.role);
                }
                
                console.log('\n📋 Next Steps:');
                console.log('   1. Copy this token');
                console.log('   2. Open: tests/question.test.js');
                console.log('   3. Replace HARDCODED_JWT_TOKEN with your token');
                console.log('   4. Run: node tests/question.test.js\n');
                
            } catch (e) {
                console.log('   ⚠️  Could not decode token payload (might be encrypted)');
            }
        } else {
            console.log('   ⚠️  WARNING: Token format looks unusual');
            console.log('   Expected 3 parts (header.payload.signature)');
            console.log('   Found', parts.length, 'parts');
        }
    } else {
        console.log('\n⏭️  Skipped. Use the methods above to get your token.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Need more help? Check tests/README.md');
    console.log('='.repeat(60) + '\n');
    
    rl.close();
});
