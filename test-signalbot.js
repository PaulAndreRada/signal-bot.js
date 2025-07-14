// test-signalbot.js
import { SignalBot, Command } from './dist/index.js';

class TestCommand extends Command {
  async handle(ctx) {
    console.log('TestCommand got message:', ctx.text);
    return false; // Don't handle anything yet
  }
}

// Test basic setup
const bot = new SignalBot({
  signal_service: 'localhost:8080',
  phone_number: '+1234567890',
  debug: true
});

bot.register(new TestCommand());
console.log('✅ SignalBot created and command registered!');