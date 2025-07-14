import { Context } from "./Context.js";

/** 
 * 
 * 
 * Abstract base class for al Signal bot commands.
 * 
 *  * Each command decides whether it can handle a message.
 *  Return true if handled, false to let other commands try.
 * 
 */

export abstract class Command { 
    /** 
     * 
     * HANDLE and incoming message.
     * 
     * @param context - Contains the message text, sender, and reply methods
     * @returns true if this command handled the message, false otherwise
     */
    abstract handle(context: Context): Promise<boolean>;

    // Optional: Describe what this command does ( for Help command) 
    get description(): string { 
        return 'No description provided'; 
    }


    // Optional: Get the command name (defaults to class name)
    get name(): string { 
        return this.constructor.name;
    }
}