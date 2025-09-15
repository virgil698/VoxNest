/**
 * VoxNest 扩展框架日志系统
 * 参考 Astro 的日志机制
 */

import type { Logger } from './types';

export class ExtensionLogger implements Logger {
  private prefix: string;
  private level: number;

  private static levels = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  } as const;

  constructor(
    prefix: string = 'VoxNest',
    logLevel: keyof typeof ExtensionLogger.levels = 'info'
  ) {
    this.prefix = prefix;
    this.level = ExtensionLogger.levels[logLevel];
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${this.prefix} ${level.toUpperCase()}: ${message}`;
  }

  private shouldLog(level: keyof typeof ExtensionLogger.levels): boolean {
    return ExtensionLogger.levels[level] >= this.level;
  }

  trace(message: string, ...args: unknown[]): void {
    if (this.shouldLog('trace')) {
      console.debug(this.formatMessage('trace', message), ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  createChild(name: string): Logger {
    return new ExtensionLogger(`${this.prefix}:${name}`, this.getLogLevel());
  }

  private getLogLevel(): keyof typeof ExtensionLogger.levels {
    const reverseLevels = Object.entries(ExtensionLogger.levels).find(
      ([, value]) => value === this.level
    );
    return (reverseLevels?.[0] || 'info') as keyof typeof ExtensionLogger.levels;
  }
}

export function createLogger(name?: string, logLevel?: string): Logger {
  return new ExtensionLogger(
    name,
    logLevel as keyof typeof ExtensionLogger['levels'] // 使用索引访问
  );
}
