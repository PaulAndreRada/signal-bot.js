// test-command.js (JavaScript, not TypeScript)
import { SignalBot, Command } from './dist/index.js';

class PingCommand extends Command { 
    get name() { 
        return 'ping';
    }

    get description(){ 
        return 'Responds to "ping" with "pong"';
    }

    async handle(ctx) { 
        if(ctx.startsWith('ping')){ 
            console.log('Ping command triggered!');
            await ctx.send('pong 🏓'); // send a response
            return true;
        }
        return false;
    }
}

// Add this to the end of your test-command.js
async function testHandling() {
   console.log('\n🧪 Testing message handling...');
    
    const command = new PingCommand();
    
    // Enhanced mock context that tracks sends
    const mockContext = {
        text: 'ping',
        sender: '+1234567890',
        timestamp: Date.now(),
        startsWith: (prefix) => 'ping'.toLowerCase().startsWith(prefix.toLowerCase()),
        send: async (message) => {
            console.log('📤 Would send:', message);
            return Promise.resolve(); // Simulate successful send
        }
    };
    
    console.log('Testing ping message...');
    const handled = await command.handle(mockContext);
    console.log('✅ Ping handled:', handled);
    
    // Test non-ping message
    const otherContext = {
        ...mockContext,  // Copy the mock context
        text: 'hello',
        startsWith: (prefix) => 'hello'.toLowerCase().startsWith(prefix.toLowerCase())
    };
    
    console.log('\nTesting non-ping message...');
    const notHandled = await command.handle(otherContext);
    console.log('❌ Hello handled:', notHandled);
}

testHandling();

/*
const command = new PingCommand(); 
console.log('Command name:', command.name); 
console.log('Description:', command.description);
*/