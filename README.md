# SignalBot-JS

A minimal, clean JavaScript/TypeScript Signal bot framework for building automated Signal messaging applications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🚀 **Simple Setup** - Get a Signal bot running in 5 minutes
- 🏗️ **Command Pattern** - Easy to add new bot features
- 📎 **Attachment Support** - Handle images, documents, and files
- 🔒 **Production Ready** - TypeScript, error handling, logging
- 🔌 **Extensible** - Built for any Signal automation use case
- 🐳 **Docker Based** - Uses proven signal-cli-rest-api

## Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- Node.js 18+ and pnpm
- A Signal-registered phone number

### 2. Installation
```bash
git clone https://github.com/your-org/signalbot-js.git
cd signalbot-js
pnpm install
pnpm build
```

### 3. Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Signal phone number
# SIGNAL_PHONE="+1234567890"
```

### 4. Start Signal API
```bash
docker run -d \
  --name signal-api \
  -p 8080:8080 \
  -v $(pwd)/bot-config:/home/.local/share/signal-cli \
  -e 'MODE=native' \
  bbernhard/signal-cli-rest-api:latest
```

### 5. Link Your Signal Account
```bash
# Generate QR code
curl -X GET 'http://localhost:8080/v1/qrcodelink?device_name=SignalBot' --output qr.png
open qr.png

# Scan with Signal app: Settings → Linked Devices → Link New Device
```

### 6. Run Example Bot
```bash
node examples/basic-bot.js
```

Send "ping" to your Signal number and get "pong 🏓" back!

## Examples

### Basic Bot
```javascript
// Complete example showing the full bot setup
import { SignalBot, Command } from 'signalbot-js';
import { config } from 'dotenv';

// Load environment variables
config();

class PingCommand extends Command {
    get name() { return 'ping'; }
    get description() { return 'Responds to ping with pong'; }
    
    async handle(ctx) {
        if (ctx.startsWith('ping')) {
            console.log(`Ping received from ${ctx.sender}`);
            await ctx.send('pong 🏓');
            return true;  // Command handled
        }
        return false;  // Try next command
    }
}

class EchoCommand extends Command {
    get name() { return 'echo'; }
    get description() { return 'Echo back your message'; }
    
    async handle(ctx) {
        if (ctx.startsWith('echo')) {
            const [, ...words] = ctx.args();
            await ctx.send(`You said: ${words.join(' ')}`);
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
            const commands = bot.registeredCommands;
            const helpText = [
                '🤖 Available Commands:',
                ...commands.map(cmd => `• ${cmd.name} - ${cmd.description}`)
            ].join('\n');
            
            await ctx.send(helpText);
            return true;
        }
        return false;
    }
}

// Create bot instance
const bot = new SignalBot({
    signal_service: 'localhost:8080',
    phone_number: process.env.SIGNAL_PHONE,
    poll_interval: 3000,
    debug: true
});

// Register commands
bot.register(new PingCommand());
bot.register(new EchoCommand());
bot.register(new HelpCommand());

// Start the bot
console.log('🤖 Starting Signal bot...');
try {
    await bot.start();
    console.log('✅ Bot is running! Send "ping", "echo hello", or "help"');
} catch (error) {
    console.error('❌ Failed to start bot:', error.message);
}
```
