export async function fetchWithCorsProxy(url: string): Promise<unknown> {
  try {
    const proxied = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.contents) throw new Error('No contents in proxy response');
    return JSON.parse(json.contents);
  } catch (error) {
    console.warn(`CORS proxy failed for ${url}, trying direct fetch...`, error);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
    return res.json();
  }
}

export async function fetchHtmlWithCorsProxy(url: string): Promise<string> {
  try {
    const proxied = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.contents) throw new Error('No contents in proxy response');
    return json.contents;
  } catch (error) {
    console.warn(`CORS proxy failed for ${url}, trying direct fetch...`, error);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
    return res.text();
  }
}

