// src/Command.ts
var Command = class {
  // Optional: Describe what this command does ( for Help command) 
  get description() {
    return "No description provided";
  }
  // Optional: Get the command name (defaults to class name)
  get name() {
    return this.constructor.name;
  }
};

// src/errors.ts
var SignalBotError = class extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "SignalBotError";
  }
};
var SignalAPIError = class extends SignalBotError {
  constructor(message, status) {
    super(message, "SIGNAL_API_ERROR");
    this.status = status;
    this.name = "SignalAPIError";
  }
};

// src/Context.ts
var Context = class {
  constructor(config, _rawMessage) {
    this.config = config;
    this.text = _rawMessage.envelope.dataMessage.message;
    this.sender = _rawMessage.envelope.source;
    this.timestamp = _rawMessage.envelope.dataMessage.timestamp;
  }
  text;
  sender;
  timestamp;
  /**
   * Send a reply to the sender
   */
  async send(message) {
    await this.sendTo(this.sender, message);
  }
  /**
   * Send a message to a specific recipient
   */
  async sendTo(recipient, message) {
    const response = await fetch(`http://${this.config.signal_service}/v2/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        number: this.config.phone_number,
        recipients: [recipient]
      })
    });
    if (!response.ok) {
      throw new SignalAPIError(
        `Failed to send message: ${response.statusText}`,
        response.status
      );
    }
  }
  /**
   * Check if message starts with a specific text (case insensitive)
   */
  startsWith(prefix) {
    return this.text.toLowerCase().startsWith(prefix.toLowerCase());
  }
  /**
   * Parse command arguments: "save contact John" → ["save", "contact", "John"]
   */
  args() {
    return this.text.trim().split(/\s+/);
  }
};

// src/SignalBot.ts
var SignalBot = class {
  commands = [];
  isRunning = false;
  pollTimeout;
  config;
  constructor(config) {
    this.config = {
      poll_interval: 2e3,
      debug: false,
      ...config
    };
    this.validateConfig();
  }
  /** 
   * Register a command Handler
   */
  register(command) {
    this.commands.push(command);
    this.log(`Registerd command: ${command.name}`);
  }
  /**
   * Start the bot
   */
  async start() {
    if (this.isRunning) {
      throw new SignalBotError("Bot is already running");
    }
    this.log(`Starting bot for ${this.config.phone_number}`);
    this.isRunning = true;
    await this.poll();
  }
  // start
  /**
  * Stop the bot
  */
  stop() {
    this.log("Stopping bot...");
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = void 0;
    }
  }
  validateConfig() {
    if (!this.config.signal_service) {
      throw new SignalBotError("signal_service is required");
    }
    if (!this.config.phone_number) {
      throw new SignalBotError("phone_number is required");
    }
    if (!this.config.phone_number.startsWith("+")) {
      throw new SignalBotError("phone_number must include country code");
    }
  }
  log(message) {
    if (this.config.debug) {
      console.log(`[SignalBot] ${message}`);
    }
  }
  async poll() {
  }
};
export {
  Command,
  Context,
  SignalBot
};
