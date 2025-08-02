# SignalBot-JS Examples

This directory contains example bots demonstrating different use cases and features of the SignalBot-JS framework.

## Available Examples

### 1. Basic Bot (`basic-bot.js`)
A simple bot with fundamental commands:
- **ping** - Basic connectivity test
- **test** - Verify bot functionality
- **echo** - Repeat messages back
- **help** - Show available commands

**Good for:** Learning the framework, testing setup, simple automation

```bash
node examples/basic-bot.js
```

### 2. Automation Bot (`automation-bot.js`)
Features for workflow automation and data collection:
- **remind** - Set timed reminders
- **submit** - Collect categorized data
- **status** - Monitor bot health
- **report** - Generate data summaries

**Good for:** Business workflows, data collection, monitoring systems

```bash
node examples/automation-bot.js
```

### 3. Attachment Bot (`attachment-bot.js`)
Demonstrates file and media handling:
- File detection and metadata
- Image processing capabilities
- Document handling
- Download and storage examples

**Good for:** Media workflows, document processing, file management

```bash
node examples/attachment-bot.js
```

## Running Examples

### Prerequisites
1. Docker running with signal-cli-rest-api
2. Signal number linked via QR code
3. `.env` file configured with your phone number

### Setup
```bash
# From project root
cp .env.example .env
# Edit .env with your phone number

# Build the framework
pnpm build

# Run any example
node examples/basic-bot.js
```

## Creating Your Own Bot

### 1. Basic Structure
```javascript
import { SignalBot, Command } from '../dist/index.js';

class MyCommand extends Command {
    get name() { return 'mycommand'; }
    get description() { return 'What this command does'; }
    
    async handle(ctx) {
        if (ctx.startsWith('mycommand')) {
            await ctx.send('Response message');
            return true;  // Command handled
        }
        return false;  // Try next command
    }
}

const bot = new SignalBot({
    signal_service: 'localhost:8080',
    phone_number: process.env.SIGNAL_PHONE,
    poll_interval: 3000,
    debug: true
});

bot.register(new MyCommand());
await bot.start();
```

### 2. Context Object
Available in every command handler:

```javascript
async handle(ctx) {
    ctx.text        // "hello world"
    ctx.sender      // "+1234567890"
    ctx.timestamp   // 1752616192042
    
    // Methods
    await ctx.send('Reply message');
    await ctx.sendTo('+1234567890', 'Message to specific number');
    
    // Helpers
    ctx.startsWith('hello')  // true
    ctx.args()              // ["hello", "world"]
    
    // Attachments
    ctx.rawMessage?.envelope?.dataMessage?.attachments
}
```

### 3. Common Patterns

**Simple Commands:**
```javascript
if (ctx.startsWith('weather')) {
    const city = ctx.args()[1];
    const weather = await getWeather(city);
    await ctx.send(`Weather in ${city}: ${weather}`);
    return true;
}
```

**Multi-word Commands:**
```javascript
if (ctx.startsWith('save contact')) {
    const [, , ...contactData] = ctx.args();
    await saveContact(contactData.join(' '));
    await ctx.send('Contact saved!');
    return true;
}
```

**Attachment Handling:**
```javascript
const attachments = ctx.rawMessage?.envelope?.dataMessage?.attachments;
if (attachments?.length > 0) {
    for (const attachment of attachments) {
        console.log('File:', attachment.filename);
        console.log('Type:', attachment.contentType);
        console.log('Size:', attachment.size);
        
        // Download URL
        const url = `http://localhost:8080/v1/attachments/${attachment.id}`;
    }
    return true;
}
```

## Use Case Ideas

### Business Automation
- Customer support bots
- Order tracking systems
- Appointment scheduling
- Status notifications

### Personal Productivity
- Reminder systems
- Note taking bots
- Task management
- Daily standup collection

### Community Tools
- Event coordination
- Resource sharing
- Volunteer management
- Information distribution

### IoT and Monitoring
- Server health alerts
- Home automation control
- Security notifications
- Data logging

### Integration Examples
- Webhook receivers
- API bridges
- Database front-ends
- Third-party service connectors

## Best Practices

1. **Error Handling**: Always wrap external API calls in try/catch
2. **Validation**: Check user input before processing
3. **Logging**: Use console.log for debugging and monitoring
4. **Security**: Validate phone numbers and sanitize input
5. **Performance**: Keep command handlers lightweight
6. **User Experience**: Provide clear help text and error messages

## Getting Help

- Check the main README.md for setup issues
- Look at existing examples for patterns
- Test commands in isolation before combining
- Use `debug: true` in bot config for detailed logging