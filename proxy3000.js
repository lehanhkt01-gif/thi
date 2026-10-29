const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Proxy Error: Máy chủ 3001 đang khởi động lại hoặc không phản hồi.');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Reverse proxy active on http://localhost:3000 -> forwarding to http://localhost:3001');
});
