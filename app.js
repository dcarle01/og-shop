// app.js - Passenger startup file for Next.js
// This file is required by CloudLinux Passenger to start the Next.js application

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;  // Production mode
const hostname = 'localhost';
const port = process.env.PORT || 3002;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});