interface ProxyConfig {
  url: string;
  type: 'direct' | 'wrapped';
}

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

const PROXIES: ProxyConfig[] = [
  { url: 'https://api.allorigins.win/get?url=', type: 'wrapped' },
  { url: 'https://corsproxy.io/?', type: 'direct' },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'direct' },
];

export async function fetchWithCorsProxy(url: string): Promise<unknown> {
  for (const proxy of PROXIES) {
    try {
      const proxiedUrl = `${proxy.url}${encodeURIComponent(url)}`;
      const res = await fetch(proxiedUrl);

      if (res.status === 404) {
        throw new NotFoundError(`Target not found (404): ${url}`);
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      if (proxy.type === 'direct') {
        return await res.json();
      } else {
        const json = await res.json() as { contents?: string; status?: { http_code?: number } };
        if (json.status?.http_code === 404) {
          throw new NotFoundError(`Target not found (404): ${url}`);
        }
        if (!json.contents) throw new Error('No contents in proxy response');
        return JSON.parse(json.contents);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.warn(`CORS proxy ${proxy.url} failed for ${url}, trying next...`, error);
    }
  }

  console.warn(`All CORS proxies failed for ${url}, trying direct fetch...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchHtmlWithCorsProxy(url: string): Promise<string> {
  for (const proxy of PROXIES) {
    try {
      const proxiedUrl = `${proxy.url}${encodeURIComponent(url)}`;
      const res = await fetch(proxiedUrl);

      if (res.status === 404) {
        throw new NotFoundError(`Target not found (404): ${url}`);
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      if (proxy.type === 'direct') {
        return await res.text();
      } else {
        const json = await res.json() as { contents?: string; status?: { http_code?: number } };
        if (json.status?.http_code === 404) {
          throw new NotFoundError(`Target not found (404): ${url}`);
        }
        if (!json.contents) throw new Error('No contents in proxy response');
        return json.contents;
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.warn(`CORS proxy ${proxy.url} failed for ${url}, trying next...`, error);
    }
  }

  console.warn(`All CORS proxies failed for ${url}, trying direct fetch...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
  return res.text();
}


