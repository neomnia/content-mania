import http from 'http';
import next from 'next';

const port = process.env.PORT || 3000;   // Plesk injecte PORT
const host = '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res))
    .listen(port, host, () => {
      console.log(`> Ready on http://${host}:${port}`);
    });
});
