/**
 * Simple server-safe HTML sanitizer.
 * Strips <script>, <iframe>, <object>, <embed>, event handlers (onerror, onclick, etc.),
 * and javascript: URLs. Sufficient for admin-authored content.
 * For untrusted user input, use DOMPurify on the client.
 */
export function sanitizeHtml(html: string): string {
  return html
    // Remove <script>...</script>
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Remove <iframe>, <object>, <embed>, <applet>
    .replace(/<(iframe|object|embed|applet)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|applet)[^>]*\/?>/gi, "")
    // Remove event handlers (on*)
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    // Remove javascript: and data: URLs in href/src
    .replace(/(href|src)\s*=\s*["']?\s*(javascript|data):/gi, '$1="')
    // Remove <base> tags
    .replace(/<base[^>]*>/gi, "");
}
