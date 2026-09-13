/**
 * Domain & URL Resolution Utilities
 * Handles dynamic resolution for Localhost, Vercel preview domains, and Custom domains (e.g. softscape.xyz)
 */

export function getRootDomain(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1") {
      return "localhost:3000";
    }
    // Remove www. prefix to get root domain
    return hostname.replace(/^www\./, "");
  }
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || "softscape.xyz";
}

export function getTenantMenuUrl(slug?: string, options?: { path?: string; fullUrl?: boolean }): string {
  if (!slug) return "#";
  const path = options?.path || "";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  if (typeof window !== "undefined") {
    const { hostname, port, protocol } = window.location;

    // 1. Local development
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1") {
      const portStr = port ? `:${port}` : ":3000";
      return `${protocol}//${slug}.localhost${portStr}${cleanPath}`;
    }

    // 2. Vercel preview/deployment (e.g. *.vercel.app)
    if (hostname.endsWith(".vercel.app")) {
      return `${protocol}//${hostname}/m/${slug}${cleanPath}`;
    }

    // 3. Custom production domain (e.g. softscape.xyz)
    const baseHost = hostname.replace(/^www\./, "");
    return `${protocol}//${slug}.${baseHost}${cleanPath}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "softscape.xyz";
  return `https://${slug}.${rootDomain}${cleanPath}`;
}

export function getTenantDisplayDomain(slug?: string): string {
  if (!slug) return "your-restaurant";

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;

    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1") {
      const portStr = port ? `:${port}` : ":3000";
      return `${slug}.localhost${portStr}`;
    }

    if (hostname.endsWith(".vercel.app")) {
      return `${hostname}/m/${slug}`;
    }

    const baseHost = hostname.replace(/^www\./, "");
    return `${slug}.${baseHost}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "softscape.xyz";
  return `${slug}.${rootDomain}`;
}
