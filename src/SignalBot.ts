// src/SignalBot.tsZ
import { Command } from './Command.js';
import { Context, SignalMessage } from './Context.js';
import { SignalBotError, SignalAPIError } from './errors.js';
import fetch from 'node-fetch';

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
        this.log(`Registered command: ${command.name}`);
    }

    /**
     *  Get all registered commands (read-only) for the help command 
    */
    get registeredCommands(): ReadonlyArray<Command> { 
        return [...this.commands]; 
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
        if(!this.isRunning) { 
            return; // Stop if bot was stopped
        }

        try { 
            // 1. fetch messages from signal
            const messages = await this.fetchMessages();

            // 2. Process each message
            for (const message of messages){
                await this.processMessage(message);
            } 

        } catch (error) { 
            this.handleError(error);
        }


        // 3. Schedule next poll (if stil running)
        if (this.isRunning) { 
            this.pollTimeout = setTimeout(() => this.poll(), this.config.poll_interval);
        }
        
    } // poll method

    private async fetchMessages() : Promise<SignalMessage[]> { 

        // construct the url using the signal config and phone number
        const url = `http://${this.config.signal_service}/v1/receive/${encodeURIComponent(this.config.phone_number)}`;

        // fetch the url and save the response
        const response = await fetch(url);

        // Throw an error if the request failed
        if(!response.ok) { 
            throw new SignalAPIError (
                `Failed to fetch messages: ${response.statusText}`,
                response.status
            );
        }
        
        // save the response json
        const data = await response.json(); 

        /* 
        * signal-cli-rest-api returns an array
        */
        
        // if empty or invalid throw an error
        if (!Array.isArray(data)) { 
            this.log('No messages or invalid response');
            return []
        }

        // Filter for valid messages and return them
        return data.filter((msg:any) =>
            msg?.envelope?.dataMessage?.message && 
            msg?.envelope?.source
        ) as SignalMessage[];

    } // fetchMessages method

    private async processMessage(message: SignalMessage): Promise<void> {
        
        // Create a new context instance from the Signal Message
        const context = new Context (this.config, message); 

        this.log(`Processing:"${context.text}" from ${context.sender}`);
        this.log(`RAW: ${JSON.stringify(message, null, 2)}`);


        // try each command until one handles it
        for (const command of this.commands) { 
            try { 
                const handled = await command.handle(context);

                // if this is a command
                if (handled) { 
                    this.log(`handled by: ${command.name}`); 
                    return; // stop processing
                }

            } catch (error) { 
                this.log(`Error in ${command.name}: ${error}`);
            }  

        } // for loop

        this.log(`No command handled: "${context.text}"`);

    } // processMessage Method

    private handleError(error: unknown ): void { 
         if (error instanceof SignalAPIError) {
            this.log(`Signal API error: ${error.message}`);
        } else {
            this.log(`Unexpected error: ${error}`);
        }
    } // handleError

} // SignalBot class


