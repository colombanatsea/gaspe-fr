/**
 * GASPE API Client
 * Calls CF Workers API when available, falls back to localStorage.
 * Set API_URL to the deployed worker URL to enable real backend.
 */

/**
 * Set this to the deployed CF Worker URL when ready.
 * Example: "https://gaspe-api.colombanatsea.workers.dev"
 * Leave empty to use localStorage fallback (demo mode).
 *
 * Deployment steps:
 * 1. npx wrangler d1 create gaspe-db
 * 2. npx wrangler d1 execute gaspe-db --file=src/lib/db/schema-design.sql
 * 3. npx wrangler r2 bucket create gaspe-uploads
 * 4. npx wrangler secret put RESEND_API_KEY --config workers/wrangler.toml
 * 5. npx wrangler deploy --config workers/wrangler.toml
 * 6. Set API_URL below to the worker URL
 */
const API_URL = "";

async function apiPost(path: string, data: unknown): Promise<{ success: boolean; error?: string }> {
  if (!API_URL) {
    return { success: false, error: "API not configured" };
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function submitContact(data: {
  nom: string;
  email: string;
  societe: string;
  sujet: string;
  message: string;
}): Promise<{ success: boolean }> {
  // Try API first
  const result = await apiPost("/api/contact", data);
  if (result.success) return { success: true };

  // Fallback: localStorage
  try {
    const msgs = JSON.parse(localStorage.getItem("gaspe_contact_messages") ?? "[]");
    msgs.push({ ...data, date: new Date().toISOString() });
    localStorage.setItem("gaspe_contact_messages", JSON.stringify(msgs));
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function subscribeNewsletter(email: string): Promise<{ success: boolean }> {
  const result = await apiPost("/api/newsletter", { email });
  if (result.success) return { success: true };

  // Fallback: localStorage
  try {
    const subs = JSON.parse(localStorage.getItem("gaspe_newsletter") ?? "[]");
    if (!subs.includes(email)) {
      subs.push(email);
      localStorage.setItem("gaspe_newsletter", JSON.stringify(subs));
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function uploadFile(
  file: File,
  type: "cv" | "document",
): Promise<{ success: boolean; key?: string; filename?: string }> {
  if (!API_URL) {
    // Fallback: store filename only
    return { success: true, filename: file.name };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}
