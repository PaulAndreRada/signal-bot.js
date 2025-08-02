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
import fetch2 from "node-fetch";
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
    this.log(`Registered command: ${command.name}`);
  }
  /**
   *  Get all registered commands (read-only) for the help command 
  */
  get registeredCommands() {
    return [...this.commands];
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
    if (!this.isRunning) {
      return;
    }
    try {
      const messages = await this.fetchMessages();
      for (const message of messages) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.handleError(error);
    }
    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.poll(), this.config.poll_interval);
    }
  }
  // poll method
  async fetchMessages() {
    const url = `http://${this.config.signal_service}/v1/receive/${encodeURIComponent(this.config.phone_number)}`;
    const response = await fetch2(url);
    if (!response.ok) {
      throw new SignalAPIError(
        `Failed to fetch messages: ${response.statusText}`,
        response.status
      );
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      this.log("No messages or invalid response");
      return [];
    }
    return data.filter(
      (msg) => msg?.envelope?.dataMessage?.message && msg?.envelope?.source
    );
  }
  // fetchMessages method
  async processMessage(message) {
    const context = new Context(this.config, message);
    this.log(`Processing:"${context.text}" from ${context.sender}`);
    this.log(`RAW: ${JSON.stringify(message, null, 2)}`);
    for (const command of this.commands) {
      try {
        const handled = await command.handle(context);
        if (handled) {
          this.log(`handled by: ${command.name}`);
          return;
        }
      } catch (error) {
        this.log(`Error in ${command.name}: ${error}`);
      }
    }
    this.log(`No command handled: "${context.text}"`);
  }
  // processMessage Method
  handleError(error) {
    if (error instanceof SignalAPIError) {
      this.log(`Signal API error: ${error.message}`);
    } else {
      this.log(`Unexpected error: ${error}`);
    }
  }
  // handleError
};
export {
  Command,
  Context,
  SignalBot
};
