/**
 * Clean Next.js App Router API Client
 * Seamlessly routes all apiFetch calls to local Next.js API route handlers
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await response.json();
  if (!response.ok) {
    let msg = json.message || "API Request failed";
    if (json.errors?.fieldErrors) {
      const fieldMsgs = Object.entries(json.errors.fieldErrors)
        .map(([f, errs]) => `${f}: ${(errs as string[]).join(", ")}`)
        .join("; ");
      if (fieldMsgs) msg = `${msg} (${fieldMsgs})`;
    }
    throw new Error(msg);
  }

  return json.data;
};

export const apiFetchFull = async (endpoint: string, options: RequestInit = {}) => {
  const data = await apiFetch(endpoint, options);
  return { data, meta: null };
};
