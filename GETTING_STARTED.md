# Getting Started with SignalBot-JS

Complete step-by-step guide to set up your first Signal bot in under 10 minutes.

## Prerequisites

Before you begin, make sure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Node.js 18+** and **pnpm** installed  
- ✅ **A Signal-registered phone number** (your existing Signal account works)
- ✅ **Signal app** installed on your phone

---

## Step 1: Install Docker Desktop

### macOS
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Open the downloaded `.dmg` file and drag Docker to Applications
3. Launch Docker Desktop from Applications
4. Wait for "Docker Desktop is running" status

### Windows
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Run the installer and follow the setup wizard
3. Restart your computer if prompted
4. Launch Docker Desktop and wait for it to start

### Verify Docker is Running
```bash
# This should show container info (empty list is fine)
docker ps
```

**If you get "Cannot connect to Docker daemon":**
- Make sure Docker Desktop is fully started (check system tray/menu bar)
- Wait 30-60 seconds for Docker to fully initialize
- Try restarting Docker Desktop

---

## Step 2: Clone and Setup the Project

```bash
# Clone the repository
git clone https://github.com/PaulAndreRada/signal-bot.js.git
cd signal-bot.js

# Install dependencies
pnpm install

# Set up environment configuration
cp .env.example .env
```

---

## Step 3: Configure Your Phone Number

Edit the `.env` file and add your Signal phone number:

```bash
# Open .env in your preferred editor
nano .env
# or
code .env
```

**Update this line:**
```env
SIGNAL_PHONE="+1234567890"
```

**To your actual number:**
```env
SIGNAL_PHONE="+1234567890"
```

**Important formatting rules:**
- ✅ Must include country code: `+1` for US/Canada
- ✅ No spaces or dashes: `+16464394850`
- ✅ Always starts with `+`
- ❌ Wrong: `646-439-4850`, `(646) 439-4850`, `1234567890`

---

## Step 4: Start the Signal API Container

This container handles all Signal protocol communication:

```bash
docker run -d \
  --name signal-api \
  -p 8080:8080 \
  -v $(pwd)/bot-config:/home/.local/share/signal-cli \
  -e 'MODE=native' \
  bbernhard/signal-cli-rest-api:latest
```

**What this does:**
- Downloads and starts the Signal CLI REST API
- Creates a `bot-config/` folder to store Signal data
- Exposes the API on `localhost:8080`
- Uses `native` mode for reliable HTTP polling

**Wait 10-15 seconds for startup, then verify:**
```bash
# Check container is running
docker ps

# Test API is responding
curl http://localhost:8080/v1/about
```

**Expected response:**
```json
{"versions":["v1","v2"],"build":"...","mode":"native"}
```

---

## Step 5: Link Your Signal Account

Since you already have Signal on your phone, we'll link the bot as a secondary device:

### Generate QR Code
```bash
curl -X GET 'http://localhost:8080/v1/qrcodelink?device_name=SignalBot' --output qr.png

# Open the QR code
# macOS:
open qr.png
# Windows:
start qr.png
# Linux:
xdg-open qr.png
```

### Link with Your Phone
1. Open **Signal app** on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link New Device** (+ button)
4. **Scan the QR code** that opened on your computer
5. Wait for **"Device linked successfully"** message

### Verify Linking Worked
```bash
# Test if your number is now accessible
curl "http://localhost:8080/v1/receive/$(echo "+1234567890" | sed 's/+/%2B/')"
```

**Success:** Returns `[]` (empty array - no new messages)  
**Failure:** Returns WebSocket error or 400 status

**If linking failed:**
- Generate a fresh QR code (they expire quickly)
- Make sure you're scanning with the Signal app, not camera app
- Check that Docker container is still running: `docker ps`

---

## Step 6: Build and Run Your First Bot

```bash
# Compile TypeScript to JavaScript
pnpm build

# Run the basic example bot
node examples/basic-bot.js
```

**You should see:**
```
🤖 Starting Basic SignalBot for +1234567890...
📋 Bot ready! Send these test messages:
   • "ping" - Basic connectivity test
   • "test" - Verify bot functionality  
   • "echo hello world" - Echo test
   • "help" - Show available commands
🚀 Starting message polling...
```

---

## Step 7: Test Your Bot

Send these messages to your Signal number **from another device** or **ask someone to send them**:

### Test Messages:
1. **"ping"** → Should reply: "pong 🏓"
2. **"test"** → Should reply: "✅ SignalBot is working perfectly!"
3. **"echo hello world"** → Should reply: "You said: hello world"
4. **"help"** → Should show available commands

**In your terminal, you should see:**
```
🏓 Ping from +1234567890 at 2:30:45 PM
[SignalBot] handled by: ping
```

### 🎉 **Success!** Your Signal bot is now running!

---

## Step 8: Try Other Examples

### Automation Bot (Reminders & Data Collection)
```bash
node examples/automation-bot.js

# Test commands:
# "remind 5 Check the server" - Sets 5-minute reminder
# "submit feedback Bot works great!" - Collect data
# "status" - Check bot health
```

### Attachment Bot (File Handling)
```bash
node examples/attachment-bot.js

# Test by sending:
# - Photos, documents, any files
# - "list" - See received files
# - "stats" - File statistics
```

---

## Common Issues & Solutions

### "Cannot connect to Docker daemon"
**Problem:** Docker Desktop isn't running  
**Solution:** 
1. Start Docker Desktop application
2. Wait for "Docker Desktop is running" status
3. Try command again

### "Device linking failed"
**Problem:** QR code expired or Signal couldn't connect  
**Solution:**
1. Generate fresh QR code: `curl -X GET 'http://localhost:8080/v1/qrcodelink?device_name=SignalBot2' --output qr2.png`
2. Make sure Docker container is running: `docker ps`
3. Try different device name in QR request

### Bot not receiving messages
**Problem:** Usually linking issue or wrong phone number  
**Solution:**
1. Verify linking: `curl http://localhost:8080/v1/receive/%2B[your-number]`
2. Should return `[]` not error
3. Check `.env` file has correct phone number format
4. Re-link if necessary

### "Module not found" errors
**Problem:** Project not built or dependencies missing  
**Solution:**
```bash
pnpm install
pnpm build
node examples/basic-bot.js
```

### Container won't start
**Problem:** Port 8080 already in use  
**Solution:**
```bash
# Stop existing container
docker stop signal-api
docker rm signal-api

# Start fresh
docker run -d --name signal-api -p 8080:8080 \
  -v $(pwd)/bot-config:/home/.local/share/signal-cli \
  -e 'MODE=native' bbernhard/signal-cli-rest-api:latest
```

---

## Next Steps

### Customize Your Bot
1. Look at `examples/` for inspiration
2. Read the main README.md for API documentation
3. Create your own commands following the examples

### Production Deployment
1. Use environment variables for configuration
2. Set up proper logging and monitoring  
3. Consider using Docker Compose for easier management
4. Add database integration for persistent storage

### Get Help
- Check the main README.md for API reference
- Look at example code in `examples/` directory
- Review Docker container logs: `docker logs signal-api`

---

## Quick Reference

### Essential Commands
```bash
# Start Signal API
docker run -d --name signal-api -p 8080:8080 \
  -v $(pwd)/bot-config:/home/.local/share/signal-cli \
  -e 'MODE=native' bbernhard/signal-cli-rest-api:latest

# Generate QR code  
curl -X GET 'http://localhost:8080/v1/qrcodelink?device_name=SignalBot' --output qr.png

# Build and run bot
pnpm build && node examples/basic-bot.js

# Check if everything is working
docker ps                           # Container running
curl http://localhost:8080/v1/about # API responding  
curl http://localhost:8080/v1/receive/%2B[number] # Number linked
```

### File Structure
```
signal-bot.js/
├── .env                 # Your phone number (keep private)
├── bot-config/          # Signal data (auto-created, keep private)  
├── examples/            # Ready-to-run bot examples
├── src/                 # Framework source code
└── dist/               # Compiled code (auto-generated)
```

**You're all set!** 🚀 Your Signal bot framework is ready for building amazing automation tools.
