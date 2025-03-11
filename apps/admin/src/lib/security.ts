/**
 * Sanitizes user input to prevent XSS attacks and other security issues
 * @param input The raw user input string to sanitize
 * @returns A sanitized version of the input string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Remove potential HTML/script tags
  let sanitized = input.replace(
    /<(\/?)(\w+)((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)\/?>/g,
    "",
  );

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  // Prevent JavaScript execution via URLs
  sanitized = sanitized.replace(/(javascript\s*:|data\s*:)/gi, "blocked:");

  // Trim excessive whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
