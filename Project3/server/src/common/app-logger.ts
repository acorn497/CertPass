type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerLike {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

function createFallbackLogger(): LoggerLike {
  const write = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const payload = meta ? ` ${JSON.stringify(meta)}` : '';
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${payload}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  return {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
    debug: (message, meta) => write('debug', message, meta),
  };
}

function createLogger(): LoggerLike {
  try {
    const winston = require('winston');
    return winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    });
  } catch {
    return createFallbackLogger();
  }
}

export const appLogger = createLogger();
