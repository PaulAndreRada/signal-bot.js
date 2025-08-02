// test-real-bot.js - Simple real Signal bot test
import { SignalBot, Command } from './dist/index.js';

class PingCommand extends Command {
    get name() { return 'ping'; }
    get description() { return 'Responds to ping with pong'; }
    
    async handle(ctx) {
        if (ctx.startsWith('ping')) {
            console.log(`🏓 Ping from ${ctx.sender} at ${new Date().toLocaleTimeString()}`);
            await ctx.send('pong 🏓');
            return true;
        }
        return false;
    }
}

class TestCommand extends Command {
    get name() { return 'test'; }
    get description() { return 'Test if bot is working'; }
    
    async handle(ctx) {
        if (ctx.startsWith('test')) {
            console.log(`🧪 Test command from ${ctx.sender}`);
            await ctx.send('✅ SignalBot is working perfectly!');
            return true;
        }
        return false;
    }
}

class EchoCommand extends Command {
    get name() { return 'echo'; }
    get description() { return 'Echo back your message'; }
    
    async handle(ctx) {
        if (ctx.startsWith('echo')) {
            const [, ...words] = ctx.args();
            const message = words.join(' ');
            console.log(`🔊 Echo: "${message}" from ${ctx.sender}`);
            await ctx.send(`You said: ${message}`);
            return true;
        }
        return false;
    }
}

// Get phone number from environment
const phoneNumber = process.env.SIGNAL_PHONE;

if (!phoneNumber) {
    console.log('❌ Please set your phone number:');
    console.log('   export SIGNAL_PHONE="+16464394850"');
    console.log('   node test-real-bot.js');
    process.exit(1);
}

console.log(`🤖 Starting SignalBot for ${phoneNumber}...`);

// Create bot
const bot = new SignalBot({
    signal_service: 'localhost:8080',
    phone_number: phoneNumber,
    poll_interval: 3000,  // Poll every 3 seconds
    debug: true           // Show debug messages
});

// Register commands
bot.register(new PingCommand());
bot.register(new TestCommand());
bot.register(new EchoCommand());

console.log('📋 Commands registered:');
console.log('   • ping - responds with pong');
console.log('   • test - confirms bot is working');
console.log('   • echo [message] - echoes back your message');

console.log('\n🎯 Bot ready! Send these messages to test:');
console.log('   • "ping"');
console.log('   • "test"');
console.log('   • "echo hello world"');

console.log('\n🚀 Starting message polling...');

// Start the bot
try {
    await bot.start();
} catch (error) {
    console.log('❌ Bot failed to start:', error.message);
    
    if (error.message.includes('Failed to fetch messages')) {
        console.log('\n💡 This usually means:');
        console.log('   1. Signal API not running: docker ps | grep signal-api');
        console.log('   2. Number not linked: try QR code linking again');
        console.log('   3. Wrong mode: try native mode instead of json-rpc');
    }
}