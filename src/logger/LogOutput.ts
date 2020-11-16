export interface LogOutput {
  log: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  debug: (message: string) => void
}
