/**
 * Sanitizes user input to prevent XSS attacks and other security issues
 * @param input The raw user input string to sanitize
 * @returns A sanitized version of the input string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  let sanitized = input.replace(
    /<(\/?)(\w+)((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)\/?>/g,
    "",
  );

  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  sanitized = sanitized.replace(/(javascript\s*:|data\s*:)/gi, "blocked:");

  sanitized = sanitized.trim();

  return sanitized;
}
