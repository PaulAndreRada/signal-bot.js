// examples/automation-bot.js
// Example SignalBot for automation and workflow tasks
// Features: reminders, data collection, notifications

import { SignalBot, Command } from '../dist/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// In-memory storage (replace with database in production)
const reminders = [];
const submissions = [];

class RemindCommand extends Command {
    get name() { return 'remind'; }
    get description() { return 'Set a reminder'; }
    
    async handle(ctx) {
        if (ctx.startsWith('remind')) {
            const [, timeStr, ...messageWords] = ctx.args();
            const message = messageWords.join(' ');
            
            if (!timeStr || !message) {
                await ctx.send('Usage: remind [minutes] [message]\nExample: remind 30 Check the server');
                return true;
            }
            
            const minutes = parseInt(timeStr);
            if (isNaN(minutes)) {
                await ctx.send('Please provide a valid number of minutes.');
                return true;
            }
            
            const reminder = {
                id: Date.now(),
                user: ctx.sender,
                message: message,
                setAt: new Date(),
                triggerAt: new Date(Date.now() + minutes * 60 * 1000)
            };
            
            reminders.push(reminder);
            console.log('⏰ Reminder set:', reminder);
            
            await ctx.send(`⏰ Reminder set for ${minutes} minutes: "${message}"`);
            
            // Set timeout (in production, use a job queue)
            setTimeout(async () => {
                try {
                    await ctx.sendTo(ctx.sender, `🔔 Reminder: ${message}`);
                    console.log('📢 Reminder sent:', reminder);
                } catch (error) {
                    console.log('Failed to send reminder:', error);
                }
            }, minutes * 60 * 1000);
            
            return true;
        }
        return false;
    }
}

class SubmitCommand extends Command {
    get name() { return 'submit'; }
    get description() { return 'Submit data or information'; }
    
    async handle(ctx) {
        if (ctx.startsWith('submit')) {
            const [, category, ...data] = ctx.args();
            
            if (!category || !data.length) {
                await ctx.send('Usage: submit [category] [data]\nExample: submit feedback App works great!');
                return true;
            }
            
            const submission = {
                id: Date.now(),
                user: ctx.sender,
                category: category,
                data: data.join(' '),
                timestamp: new Date(),
                attachments: ctx.rawMessage?.envelope?.dataMessage?.attachments?.length || 0
            };
            
            submissions.push(submission);
            console.log('📊 Data submitted:', submission);
            
            await ctx.send(`✅ Submitted to "${category}": ${data.join(' ')}`);
            
            if (submission.attachments > 0) {
                await ctx.send(`📎 Also received ${submission.attachments} attachment(s)`);
            }
            
            return true;
        }
        return false;
    }
}

class StatusCommand extends Command {
    get name() { return 'status'; }
    get description() { return 'Check system status'; }
    
    async handle(ctx) {
        if (ctx.startsWith('status')) {
            const activeReminders = reminders.filter(r => r.triggerAt > new Date()).length;
            const totalSubmissions = submissions.length;
            const uptime = process.uptime();
            
            const statusText = [
                '📊 Bot Status:',
                `• Uptime: ${Math.floor(uptime / 60)} minutes`,
                `• Active reminders: ${activeReminders}`,
                `• Total submissions: ${totalSubmissions}`,
                `• Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                '',
                'Use "help" to see available commands.'
            ].join('\n');
            
            await ctx.send(statusText);
            return true;
        }
        return false;
    }
}

class ReportCommand extends Command {
    get name() { return 'report'; }
    get description() { return 'Generate data report'; }
    
    async handle(ctx) {
        if (ctx.startsWith('report')) {
            const [, period] = ctx.args();
            const now = new Date();
            let since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: 24 hours
            
            if (period === 'week') {
                since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (period === 'month') {
                since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
            
            const recentSubmissions = submissions.filter(s => s.timestamp > since);
            const categories = [...new Set(recentSubmissions.map(s => s.category))];
            
            let reportText = [`📈 Report (last ${period || 'day'}):\n`];
            
            if (recentSubmissions.length === 0) {
                reportText.push('No submissions in this period.');
            } else {
                reportText.push(`Total submissions: ${recentSubmissions.length}`);
                reportText.push(`Categories: ${categories.join(', ')}`);
                reportText.push('');
                
                categories.forEach(cat => {
                    const count = recentSubmissions.filter(s => s.category === cat).length;
                    reportText.push(`• ${cat}: ${count} submissions`);
                });
            }
            
            await ctx.send(reportText.join('\n'));
            return true;
        }
        return false;
    }
}

class AutomationHelpCommand extends Command {
    get name() { return 'help'; }
    get description() { return 'Show available commands'; }
    
    async handle(ctx) {
        if (ctx.startsWith('help')) {
            const helpText = [
                '🤖 Automation Bot Commands:',
                '',
                '⏰ Reminders:',
                '• remind [minutes] [message] - Set a reminder',
                '',
                '📊 Data Collection:',
                '• submit [category] [data] - Submit information',
                '• report [day/week/month] - Generate report',
                '',
                '📈 Monitoring:',
                '• status - Check bot status',
                '',
                '💡 Examples:',
                '• "remind 30 Check server logs"',
                '• "submit feedback The new feature works well"',
                '• "report week"'
            ].join('\n');
            
            await ctx.send(helpText);
            return true;
        }
        return false;
    }
}

// Configuration
const phoneNumber = process.env.SIGNAL_PHONE;
if (!phoneNumber) {
    console.log('❌ Please set SIGNAL_PHONE in .env file');
    process.exit(1);
}

console.log(`🤖 Starting Automation Bot for ${phoneNumber}...`);

// Create bot
const bot = new SignalBot({
    signal_service: process.env.SIGNAL_SERVICE || 'localhost:8080',
    phone_number: phoneNumber,
    poll_interval: parseInt(process.env.POLL_INTERVAL) || 3000,
    debug: process.env.DEBUG === 'true'
});

// Register automation commands
bot.register(new RemindCommand());
bot.register(new SubmitCommand());
bot.register(new StatusCommand());
bot.register(new ReportCommand());
bot.register(new AutomationHelpCommand());

console.log('🤖 Automation Bot ready!');
console.log('📱 Users can now:');
console.log('   • Set reminders: "remind 30 Check the logs"');
console.log('   • Submit data: "submit feedback App is working great"');
console.log('   • Check status: "status"');
console.log('   • Generate reports: "report week"');

// Start bot
try {
    await bot.start();
} catch (error) {
    console.log('❌ Bot failed to start:', error.message);
}

// TODO for production:
// - Replace in-memory storage with database
// - Add user authentication/permissions
// - Implement proper job queue for reminders
// - Add webhook integrations
// - Create web dashboard for data visualization
// - Add export functionality