// src/SignalBot.tsZ

import { Command } from "./Command.js";
import { SignalBotError } from './errors.js'; 

export interface SignalBotConfig {
  /** Signal CLI REST API endpoint (e.g., "localhost:8080") */
  signal_service: string;
  /** Phone number registered with Signal (e.g., "+1234567890") */
  phone_number: string;
  /** Polling interval in milliseconds (default: 2000) */
  poll_interval?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export class SignalBot { 
    private commands: Command[] = []; 
    private isRunning = false; 
    private pollTimeout?: NodeJS.Timeout; 
    private config!: Required<SignalBotConfig>; 

    constructor(config: SignalBotConfig) { 
        // fill in defaults
        this.config = { 
            poll_interval: 2000, 
            debug: false, 
            ...config
        };

        this.validateConfig(); 
    }

    /** 
     * Register a command Handler
     */
    register(command: Command): void { 
        this.commands.push(command);
        this.log(`Registerd command: ${command.name}`);
    }

    /**
     * Start the bot
     */
    async start(): Promise<void> { 
        if (this.isRunning) { 
            throw new SignalBotError('Bot is already running'); 
        }

        this.log(`Starting bot for ${this.config.phone_number}`);
        this.isRunning = true; 
        await this.poll(); // start polling
    } // start

    /**
    * Stop the bot
    */
    stop(): void { 
        this.log('Stopping bot...'); 
        this.isRunning = false; 

        if (this.pollTimeout) { 
            clearTimeout(this.pollTimeout);
            this.pollTimeout = undefined; 
        }
    }

    private validateConfig(): void { 
        if (!this.config.signal_service) { 
            throw new SignalBotError('signal_service is required');
        }
        if (!this.config.phone_number) {
            throw new SignalBotError('phone_number is required');
        }
        if (!this.config.phone_number.startsWith('+')) {
            throw new SignalBotError('phone_number must include country code');
        }
    }

    private log(message: string): void { 
        if (this.config.debug){ 
            console.log(`[SignalBot] ${message}`); 
        }
    }

    private async poll(): Promise<void> { 
        // todo
    }
}


