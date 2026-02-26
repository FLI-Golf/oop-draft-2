import http from 'node:http';

const PB_PORT = 8090;
const SK_PORT = 3000;
const LISTEN_PORT = process.env.PORT || 8080;

function proxy(req, res, targetPort) {
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${targetPort}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Strip hop-by-hop headers forbidden in HTTP/2 (RFC 9113 §8.2.2).
    // Railway's edge terminates HTTP/2 from clients and re-encodes our
    // HTTP/1.1 response; forwarding these causes ERR_HTTP2_PROTOCOL_ERROR.
    const headers = { ...proxyRes.headers };
    delete headers['connection'];
    delete headers['keep-alive'];
    delete headers['transfer-encoding'];
    delete headers['upgrade'];
    delete headers['proxy-connection'];
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error (port ${targetPort}):`, err.message);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end('Bad Gateway');
    }
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  const path = req.url || '/';

  // Route to PocketBase
  if (path.startsWith('/api/') || path.startsWith('/api?') ||
      path.startsWith('/_/') || path === '/_') {
    return proxy(req, res, PB_PORT);
  }

  // Everything else to SvelteKit
  proxy(req, res, SK_PORT);
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on :${LISTEN_PORT} -> PB:${PB_PORT} / SK:${SK_PORT}`);
});
