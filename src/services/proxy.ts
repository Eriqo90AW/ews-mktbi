export async function fetchWithCorsProxy(url: string): Promise<unknown> {
  try {
    const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`CORS proxy failed for ${url}, trying direct fetch...`, error);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
    return res.json();
  }
}

export async function fetchHtmlWithCorsProxy(url: string): Promise<string> {
  try {
    const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (error) {
    console.warn(`CORS proxy failed for ${url}, trying direct fetch...`, error);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
    return res.text();
  }
}