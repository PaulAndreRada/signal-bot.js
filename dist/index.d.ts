interface SignalBotConfig {
    /** Signal CLI REST API endpoint (e.g., "localhost:8080") */
    signal_service: string;
    /** Phone number registered with Signal (e.g., "+1234567890") */
    phone_number: string;
    /** Polling interval in milliseconds (default: 2000) */
    poll_interval?: number;
    /** Enable debug logging (default: false) */
    debug?: boolean;
}
declare class SignalBot {
    private commands;
    private isRunning;
    private pollTimeout?;
    private config;
    constructor(config: SignalBotConfig);
    /**
     * Register a command Handler
     */
    register(command: Command): void;
    /**
     * Start the bot
     */
    start(): Promise<void>;
    /**
    * Stop the bot
    */
    stop(): void;
    private validateConfig;
    private log;
    private poll;
}

interface SignalMessage {
    envelope: {
        source: string;
        dataMessage: {
            message: string;
            timestamp: number;
        };
    };
}
declare class Context {
    private config;
    readonly text: string;
    readonly sender: string;
    readonly timestamp: number;
    constructor(config: SignalBotConfig, _rawMessage: SignalMessage);
    /**
     * Send a reply to the sender
     */
    send(message: string): Promise<void>;
    /**
     * Send a message to a specific recipient
     */
    sendTo(recipient: string, message: string): Promise<void>;
    /**
     * Check if message starts with a specific text (case insensitive)
     */
    startsWith(prefix: string): boolean;
    /**
     * Parse command arguments: "save contact John" → ["save", "contact", "John"]
     */
    args(): string[];
}

/**
 *
 *
 * Abstract base class for al Signal bot commands.
 *
 *  * Each command decides whether it can handle a message.
 *  Return true if handled, false to let other commands try.
 *
 */
declare abstract class Command {
    /**
     *
     * HANDLE and incoming message.
     *
     * @param context - Contains the message text, sender, and reply methods
     * @returns true if this command handled the message, false otherwise
     */
    abstract handle(context: Context): Promise<boolean>;
    get description(): string;
    get name(): string;
}

export { Command, Context, SignalBot, type SignalBotConfig };
