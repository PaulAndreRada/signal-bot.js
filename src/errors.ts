export class SignalBotError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SignalBotError';
  }
}

export class SignalAPIError extends SignalBotError {
  constructor(message: string, public status?: number) {
    super(message, 'SIGNAL_API_ERROR');
    this.name = 'SignalAPIError';
  }
}

export class CommandError extends SignalBotError {
  constructor(message: string) {
    super(message, 'COMMAND_ERROR');
    this.name = 'CommandError';
  }
}