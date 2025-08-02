// examples/attachment-bot.js
// Example SignalBot for handling files and attachments
// Features: file detection, metadata extraction, download URLs

import { SignalBot, Command } from '../dist/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// In-memory storage for received files
const receivedFiles = [];

class AttachmentInfoCommand extends Command {
    get name() { return 'info'; }
    get description() { return 'Show information about attachments'; }
    
    async handle(ctx) {
        // Check if message has attachments
        const attachments = ctx.rawMessage?.envelope?.dataMessage?.attachments;
        
        if (attachments?.length > 0) {
            console.log(`📎 Received ${attachments.length} attachment(s) from ${ctx.sender}`);
            
            let response = `📎 File Analysis (${attachments.length} file${attachments.length > 1 ? 's' : ''}):\n\n`;
            
            attachments.forEach((attachment, index) => {
                // Log to console for debugging
                console.log(`   File ${index + 1}:`, {
                    id: attachment.id,
                    contentType: attachment.contentType,
                    filename: attachment.filename,
                    size: attachment.size,
                    width: attachment.width,
                    height: attachment.height
                });
                
                // Store file info
                const fileInfo = {
                    id: attachment.id,
                    filename: attachment.filename || 'unnamed-file',
                    contentType: attachment.contentType,
                    size: attachment.size,
                    uploadTimestamp: attachment.uploadTimestamp,
                    sender: ctx.sender,
                    receivedAt: new Date(),
                    downloadUrl: `http://localhost:8080/v1/attachments/${attachment.id}`
                };
                
                if (attachment.width && attachment.height) {
                    fileInfo.dimensions = `${attachment.width}x${attachment.height}`;
                }
                
                receivedFiles.push(fileInfo);
                
                // Build response text
                response += `📄 File ${index + 1}:\n`;
                response += `  Name: ${attachment.filename || 'Unnamed'}\n`;
                response += `  Type: ${attachment.contentType || 'Unknown'}\n`;
                response += `  Size: ${formatFileSize(attachment.size)}\n`;
                
                if (attachment.width && attachment.height) {
                    response += `  Dimensions: ${attachment.width}×${attachment.height}\n`;
                }
                
                response += `  ID: ${attachment.id}\n`;
                response += `  Download: Available via API\n\n`;
            });
            
            response += '✅ Files processed and stored!';
            await ctx.send(response);
            return true;
        }
        
        // If someone sends "info" without attachments
        if (ctx.startsWith('info')) {
            await ctx.send('📎 Send me a file (photo, document, etc.) and I\'ll analyze it for you!');
            return true;
        }
        
        return false;
    }
}

class ListFilesCommand extends Command {
    get name() { return 'list'; }
    get description() { return 'List recently received files'; }
    
    async handle(ctx) {
        if (ctx.startsWith('list')) {
            if (receivedFiles.length === 0) {
                await ctx.send('📂 No files received yet. Send me some files to get started!');
                return true;
            }
            
            const recentFiles = receivedFiles.slice(-10); // Last 10 files
            let response = `📂 Recent Files (${recentFiles.length}/${receivedFiles.length}):\n\n`;
            
            recentFiles.forEach((file, index) => {
                const timeAgo = formatTimeAgo(file.receivedAt);
                response += `${index + 1}. ${file.filename}\n`;
                response += `   ${file.contentType} • ${formatFileSize(file.size)}\n`;
                response += `   Received ${timeAgo}\n\n`;
            });
            
            if (receivedFiles.length > 10) {
                response += `... and ${receivedFiles.length - 10} more files`;
            }
            
            await ctx.send(response);
            return true;
        }
        return false;
    }
}

class FileStatsCommand extends Command {
    get name() { return 'stats'; }
    get description() { return 'Show file statistics'; }
    
    async handle(ctx) {
        if (ctx.startsWith('stats')) {
            if (receivedFiles.length === 0) {
                await ctx.send('📊 No files to analyze yet.');
                return true;
            }
            
            // Calculate statistics
            const totalFiles = receivedFiles.length;
            const totalSize = receivedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
            const avgSize = totalSize / totalFiles;
            
            // Group by content type
            const typeGroups = {};
            receivedFiles.forEach(file => {
                const type = file.contentType?.split('/')[0] || 'unknown';
                typeGroups[type] = (typeGroups[type] || 0) + 1;
            });
            
            // Find most recent
            const mostRecent = receivedFiles[receivedFiles.length - 1];
            
            let response = '📊 File Statistics:\n\n';
            response += `📁 Total files: ${totalFiles}\n`;
            response += `💾 Total size: ${formatFileSize(totalSize)}\n`;
            response += `📏 Average size: ${formatFileSize(avgSize)}\n\n`;
            
            response += '📂 File types:\n';
            Object.entries(typeGroups).forEach(([type, count]) => {
                response += `  • ${type}: ${count} files\n`;
            });
            
            if (mostRecent) {
                response += `\n🕒 Most recent: ${mostRecent.filename} (${formatTimeAgo(mostRecent.receivedAt)})`;
            }
            
            await ctx.send(response);
            return true;
        }
        return false;
    }
}

class DownloadCommand extends Command {
    get name() { return 'download'; }
    get description() { return 'Get download information for files'; }
    
    async handle(ctx) {
        if (ctx.startsWith('download')) {
            const [, fileNumber] = ctx.args();
            
            if (!fileNumber) {
                await ctx.send('Usage: download [file number]\nUse "list" to see available files.');
                return true;
            }
            
            const index = parseInt(fileNumber) - 1;
            if (isNaN(index) || index < 0 || index >= receivedFiles.length) {
                await ctx.send('Invalid file number. Use "list" to see available files.');
                return true;
            }
            
            const file = receivedFiles[index];
            const response = [
                `📥 Download Info for: ${file.filename}`,
                ``,
                `🔗 URL: ${file.downloadUrl}`,
                `📊 Type: ${file.contentType}`,
                `📏 Size: ${formatFileSize(file.size)}`,
                ``,
                `💡 Use curl or wget to download:`,
                `curl "${file.downloadUrl}" -o "${file.filename}"`
            ].join('\n');
            
            await ctx.send(response);
            return true;
        }
        return false;
    }
}

class AttachmentHelpCommand extends Command {
    get name() { return 'help'; }
    get description() { return 'Show attachment bot commands'; }
    
    async handle(ctx) {
        if (ctx.startsWith('help')) {
            const helpText = [
                '📎 Attachment Bot Commands:',
                '',
                '📄 File Analysis:',
                '• Send any file - Automatic analysis',
                '• info - Show analysis help',
                '',
                '📂 File Management:',
                '• list - Show recent files',
                '• stats - File statistics',
                '• download [number] - Get download info',
                '',
                '💡 Supported Files:',
                '• Images (JPEG, PNG, GIF, etc.)',
                '• Documents (PDF, DOC, TXT, etc.)',
                '• Videos (MP4, MOV, etc.)',
                '• Audio files',
                '• Any file type Signal supports',
                '',
                '🔧 Example workflow:',
                '1. Send a photo',
                '2. "list" to see received files',
                '3. "download 1" to get download URL'
            ].join('\n');
            
            await ctx.send(helpText);
            return true;
        }
        return false;
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Configuration
const phoneNumber = process.env.SIGNAL_PHONE;
if (!phoneNumber) {
    console.log('❌ Please set SIGNAL_PHONE in .env file');
    process.exit(1);
}

console.log(`📎 Starting Attachment Bot for ${phoneNumber}...`);

// Create bot
const bot = new SignalBot({
    signal_service: process.env.SIGNAL_SERVICE || 'localhost:8080',
    phone_number: phoneNumber,
    poll_interval: parseInt(process.env.POLL_INTERVAL) || 3000,
    debug: process.env.DEBUG === 'true'
});

// Register attachment commands
bot.register(new AttachmentInfoCommand());
bot.register(new ListFilesCommand());
bot.register(new FileStatsCommand());
bot.register(new DownloadCommand());
bot.register(new AttachmentHelpCommand());

console.log('📎 Attachment Bot ready!');
console.log('📱 Users can now:');
console.log('   • Send files for automatic analysis');
console.log('   • "list" - See received files');
console.log('   • "stats" - View file statistics');
console.log('   • "download [number]" - Get download URLs');

// Start bot
try {
    await bot.start();
} catch (error) {
    console.log('❌ Bot failed to start:', error.message);
}

// TODO for production:
// - Implement file storage/archiving
// - Add file type validation
// - Create thumbnail generation for images
// - Add virus scanning
// - Implement file expiration
// - Add cloud storage integration (S3, etc.)