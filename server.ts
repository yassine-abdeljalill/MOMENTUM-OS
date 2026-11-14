import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { getDb } from './server/db.ts';
import authRoutes from './server/routes/auth.ts';
import financeRoutes from './server/routes/finance.ts';
import learningRoutes from './server/routes/learning.ts';

dotenv.config();

function resolvePort(): number {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      const next = Number(args[i + 1]);
      if (Number.isInteger(next) && next > 0) return next;
    } else if (arg.startsWith('--port=')) {
      const val = Number(arg.slice('--port='.length));
      if (Number.isInteger(val) && val > 0) return val;
    }
  }

  const envAppPort = Number(process.env.APP_PORT);
  if (Number.isInteger(envAppPort) && envAppPort > 0) return envAppPort;

  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (Number.isInteger(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }

  const defaultPort = Number(process.env.DEFAULT_APP_PORT);
  if (Number.isInteger(defaultPort) && defaultPort > 0) return defaultPort;

  return 3000;
}

const PORT = resolvePort();
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  // Initialize SQLite database on startup
  getDb();

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'momentum-life-os' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/learning', learningRoutes);

  // Error handler for malformed JSON or unexpected API errors
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  const httpServer = http.createServer(app);
  let viteServer: { middlewares: express.RequestHandler; close: () => Promise<void> } | null = null;
  let viteReadyPromise: Promise<void> | null = null;

  if (!isProd) {
    // Wait on non-API requests briefly until Vite finishes initializing, while
    // allowing /api/health and port 3000 to respond immediately.
    app.use((req, res, next) => {
      if (viteServer) {
        viteServer.middlewares(req, res, next);
        return;
      }
      if (viteReadyPromise) {
        viteReadyPromise
          .then(() => {
            if (viteServer) {
              viteServer.middlewares(req, res, next);
            } else {
              next();
            }
          })
          .catch(next);
        return;
      }
      next();
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, '0.0.0.0', () => {
      httpServer.off('error', reject);
      console.log(`MOMENTUM server listening on http://0.0.0.0:${PORT}`);
      resolve();
    });
  });

  if (!isProd) {
    viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const hmrDisabled = process.env.DISABLE_HMR === 'true';
      viteServer = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: hmrDisabled ? false : { server: httpServer },
        },
        appType: 'spa',
      });
    })();

    viteReadyPromise.catch(err => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });
  }

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down MOMENTUM server...`);
    try {
      if (viteServer) {
        await viteServer.close();
      }
    } catch (err) {
      console.error('Error closing Vite middleware:', err);
    }
    httpServer.close(() => {
      process.exit(0);
    });
    // Force exit if keep-alive sockets linger past 1500ms
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('Failed to start MOMENTUM server:', err);
  process.exit(1);
});
