// examples/basic-bot.js
// Basic SignalBot example with ping, test, and echo commands
//
// Setup:
// 1. Copy .env.example to .env and add your phone number
// 2. Start Docker: docker run -d --name signal-api -p 8080:8080 -v $(pwd)/bot-config:/home/.local/share/signal-cli -e 'MODE=native' bbernhard/signal-cli-rest-api:latest
// 3. Link Signal: curl -X GET 'http://localhost:8080/v1/qrcodelink?device_name=SignalBot' --output qr.png && open qr.png
// 4. Run bot: node examples/basic-bot.js

import { SignalBot, Command } from '../dist/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

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

class HelpCommand extends Command {
    get name() { return 'help'; }
    get description() { return 'Show available commands'; }
    
    async handle(ctx) {
        if (ctx.startsWith('help')) {
            const helpText = [
                '🤖 Available Commands:',
                '• ping - Test connectivity',
                '• test - Verify bot is working', 
                '• echo [message] - Repeat your message',
                '• help - Show this message'
            ].join('\n');
            
            await ctx.send(helpText);
            return true;
        }
        return false;
    }
}

// Read configuration from .env file
const phoneNumber = process.env.SIGNAL_PHONE;
const signalService = process.env.SIGNAL_SERVICE || 'localhost:8080';
const pollInterval = parseInt(process.env.POLL_INTERVAL) || 3000;
const debug = process.env.DEBUG === 'true';

// Validate configuration
if (!phoneNumber) {
    console.log('❌ Configuration Error!');
    console.log('Please create a .env file with your phone number.');
    console.log('See .env.example for template.');
    process.exit(1);
}

console.log(`🤖 Starting Basic SignalBot for ${phoneNumber}...`);

// Create and configure bot
const bot = new SignalBot({
    signal_service: signalService,
    phone_number: phoneNumber,
    poll_interval: pollInterval,
    debug: debug
});

// Register commands
bot.register(new PingCommand());
bot.register(new TestCommand());
bot.register(new EchoCommand());
bot.register(new HelpCommand());

console.log('📋 Bot ready! Send these test messages:');
console.log('   • "ping" - Basic connectivity test');
console.log('   • "test" - Verify bot functionality');
console.log('   • "echo hello world" - Echo test');
console.log('   • "help" - Show available commands');

// Start the bot
try {
    await bot.start();
} catch (error) {
    console.log('❌ Bot failed to start:', error.message);
    console.log('Check that Docker is running and Signal is linked.');
}