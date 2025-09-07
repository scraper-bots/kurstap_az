export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: any
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel
  private context?: string

  private constructor(context?: string) {
    this.context = context
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.WARN 
      : LogLevel.DEBUG
  }

  static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context)
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel
  }

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      ...(data && { data })
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return

    const logEntry = this.formatMessage(level, message, data)
    
    // In production, you might want to send logs to a service like DataDog, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Only log errors and warnings in production
      if (level <= LogLevel.WARN) {
        console[level === LogLevel.ERROR ? 'error' : 'warn'](
          `[${logEntry.timestamp}] ${logEntry.context || 'APP'}: ${logEntry.message}`,
          logEntry.data || ''
        )
      }
    } else {
      // Development - log everything with colors
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[37m'  // White
      }
      
      const levelNames = {
        [LogLevel.ERROR]: 'ERROR',
        [LogLevel.WARN]: 'WARN',
        [LogLevel.INFO]: 'INFO',
        [LogLevel.DEBUG]: 'DEBUG'
      }
      
      console.log(
        `${colors[level]}[${levelNames[level]}] ${logEntry.context || 'APP'}: ${logEntry.message}\x1b[0m`,
        logEntry.data || ''
      )
    }
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data)
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  // Convenience method for interview-specific logging
  interview(message: string, data?: any): void {
    this.info(`🎤 ${message}`, data)
  }

  // Convenience method for video-specific logging
  video(message: string, data?: any): void {
    this.info(`🎬 ${message}`, data)
  }

  // Convenience method for API-specific logging
  api(message: string, data?: any): void {
    this.info(`🔌 ${message}`, data)
  }
}

// Export logger instances for different contexts
export const logger = Logger.getInstance()
export const interviewLogger = Logger.getInstance('INTERVIEW')
export const videoLogger = Logger.getInstance('VIDEO')
export const apiLogger = Logger.getInstance('API')
export const dbLogger = Logger.getInstance('DATABASE')