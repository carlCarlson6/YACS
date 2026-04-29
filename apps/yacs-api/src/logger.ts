const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function timestamp(): string {
  return new Date().toISOString();
}

export function log(message: string): void {
  console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}INFO${colors.reset} ${message}`);
}

export function logRequest(method: string, url: string, statusCode: number, durationMs: number): void {
  const statusColor = statusCode >= 500 ? colors.red : statusCode >= 400 ? colors.yellow : colors.green;
  console.log(
    `${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}REQUEST${colors.reset} ${method} ${url} ${statusColor}${statusCode}${colors.reset} ${colors.gray}(${durationMs}ms)${colors.reset}`
  );
}

export function logError(message: string, error?: unknown): void {
  console.error(
    `${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${message}${error ? `: ${error}` : ""}`
  );
}
