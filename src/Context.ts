import { SignalBotConfig } from './SignalBot.js';
import { SignalAPIError } from './errors.js';

export interface SignalMessage {
  envelope: {
    source: string;
    dataMessage: {
      message: string;
      timestamp: number;
    };
  };
}

export class Context {
  public readonly text: string;
  public readonly sender: string;
  public readonly timestamp: number;

  constructor(
    private config: SignalBotConfig,
    _rawMessage: SignalMessage
  ) {
    this.text = _rawMessage.envelope.dataMessage.message;
    this.sender = _rawMessage.envelope.source;
    this.timestamp = _rawMessage.envelope.dataMessage.timestamp;
  }

  /**
   * Send a reply to the sender
   */
  async send(message: string): Promise<void> {
    await this.sendTo(this.sender, message);
  }

  /**
   * Send a message to a specific recipient
   */
  async sendTo(recipient: string, message: string): Promise<void> {
    const response = await fetch(`http://${this.config.signal_service}/v2/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  startsWith(prefix: string): boolean {
    return this.text.toLowerCase().startsWith(prefix.toLowerCase());
  }

  /**
   * Parse command arguments: "save contact John" → ["save", "contact", "John"]
   */
  args(): string[] {
    return this.text.trim().split(/\s+/);
  }
}