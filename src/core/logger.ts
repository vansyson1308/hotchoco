import pino from 'pino';
import crypto from 'node:crypto';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  base: { service: 'hotchoco' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export type Logger = pino.Logger;
