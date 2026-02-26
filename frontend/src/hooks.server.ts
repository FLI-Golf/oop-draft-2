import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const PB_URL = env.POCKETBASE_URL ?? 'http://127.0.0.1:8090';

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Proxy /pb/* and /api/* and /_/* to PocketBase
  if (path.startsWith('/pb/') || path.startsWith('/api/') || path.startsWith('/_/')) {
    const target = path.startsWith('/pb/')
      ? `${PB_URL}${path.replace(/^\/pb/, '')}`
      : `${PB_URL}${path}`;

    const url = new URL(target);
    url.search = event.url.search;

    const headers = new Headers(event.request.headers);
    headers.delete('host');
    headers.delete('accept-encoding');

    const response = await fetch(url.toString(), {
      method: event.request.method,
      headers,
      body: event.request.method !== 'GET' && event.request.method !== 'HEAD'
        ? await event.request.arrayBuffer()
        : undefined,
    });

    // Read body as arrayBuffer to avoid stream issues
    const body = await response.arrayBuffer();

    // Copy headers but remove content-encoding (we're sending raw bytes)
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  return resolve(event);
};
