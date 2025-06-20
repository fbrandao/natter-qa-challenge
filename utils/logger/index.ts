import winston from 'winston';

// Define log levels with icons
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  header: 3,
  testStart: 4,
  testEnd: 4,
  debug: 5,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  header: 'magenta',
  testStart: 'cyan',
  testEnd: 'cyan',
  debug: 'blue',
};

// Define icons for each level
const icons = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  header: '📌',
  testStart: '🚀',
  testEnd: '🏁',
  debug: '🔍',
};

// Add colors to Winston
winston.addColors(colors);

// Get log level from environment or default to 'info'
const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || 'info';

// Validate log level
if (!Object.keys(levels).includes(LOG_LEVEL)) {
  console.warn(`Invalid LOG_LEVEL: ${LOG_LEVEL}. Defaulting to 'info'`);
}

// Create the logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
      const icon = icons[level as keyof typeof icons] || '';
      const levelUpper = level.toUpperCase();
      
      // Special formatting for headers
      if (level === 'header') {
        const headerLine = '='.repeat(80);
        return `\n${headerLine}\n${icon} ${message}\n${headerLine}\n`;
      }
      
      // Special formatting for test start/end
      if (level === 'testStart' || level === 'testEnd') {
        const headerLine = '='.repeat(80);
        return `\n${headerLine}\n${icon} ${message}\n${headerLine}\n`;
      }
      
      // Regular log message formatting
      let msg = `${timestamp} ${icon} [${levelUpper}] ${message}`;
      
      // Add metadata in a more readable format if it exists
      if (Object.keys(metadata).length > 0) {
        const metaStr = JSON.stringify(metadata, null, 2)
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n');
        msg += `\n${metaStr}`;
      }
      
      return msg;
    })
  ),
  transports: [
    // Always show header, testStart, and testEnd messages
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true })
      ),
      level: 'header'
    }),
    // Show other messages based on LOG_LEVEL
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => {
          if (['header', 'testStart', 'testEnd'].includes(info.level)) {
            return false;
          }
          return info;
        })(),
        winston.format.colorize({ all: true })
      ),
      level: LOG_LEVEL
    })
  ],
});

// Create a wrapper class for additional functionality
class Logger {
  private context: string;

  constructor(context: string = '') {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  // Add header method
  header(message: string): void {
    logger.log('header', message);
  }

  debug(message: string, meta?: any): void {
    logger.debug(this.formatMessage(message), meta);
  }

  info(message: string, meta?: any): void {
    logger.info(this.formatMessage(message), meta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(this.formatMessage(message), meta);
  }

  error(message: string, meta?: any): void {
    logger.error(this.formatMessage(message), meta);
  }

  // Add test start method
  testStart(message: string): void {
    logger.log('testStart', message);
  }

  // Add test end method
  testEnd(message: string): void {
    logger.log('testEnd', message);
  }

  // Create a new logger instance with a specific context
  withContext(context: string): Logger {
    return new Logger(context);
  }
}

// Export a default logger instance
export const defaultLogger = new Logger();

// Export the Logger class for creating custom instances
export default Logger; 