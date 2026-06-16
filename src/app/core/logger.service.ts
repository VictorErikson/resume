import { Injectable } from '@angular/core';

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

@Injectable({ providedIn: 'root' })
export class LoggerFactory {
  get(name: string): Logger {
    const prefix = `[${name}]`;
    return {
      info: (m) => console.info(prefix, m),
      warn: (m) => console.warn(prefix, m),
      error: (m) => console.error(prefix, m),
    };
  }
}
