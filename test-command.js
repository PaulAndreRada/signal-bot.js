// test-command.js (JavaScript, not TypeScript)
import { Command } from './dist/index.js';

class PingCommand extends Command { 
    get description(){ 
        return 'Responds to "ping" with "pong"';
    }

    async handle(ctx) {  // No type annotations in JavaScript
        if(ctx.startsWith('ping')){ 
            console.log('Ping command triggered!');
            return true;
        }
        return false;
    }
}

// Add this to the end of your test-command.js
async function testHandling() {
  console.log('\n🧪 Testing message handling...');
  
  const command = new PingCommand();
  
  // Create mock context
  const mockContext = {
    text: 'ping',
    startsWith: (prefix) => 'ping'.toLowerCase().startsWith(prefix.toLowerCase()),
    send: async (message) => console.log('📤 Would send:', message)
  };
  
  const handled = await command.handle(mockContext);
  console.log('✅ Ping handled:', handled);
  
  // Test non-ping message
  const otherContext = {
    text: 'hello',
    startsWith: (prefix) => 'hello'.toLowerCase().startsWith(prefix.toLowerCase()),
    send: async (message) => console.log('📤 Would send:', message)
  };
  
  const notHandled = await command.handle(otherContext);
  console.log('❌ Hello handled:', notHandled);
}

testHandling();

/*
const command = new PingCommand(); 
console.log('Command name:', command.name); 
console.log('Description:', command.description);
*/