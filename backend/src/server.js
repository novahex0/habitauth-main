import 'dotenv/config';
import { checkAndRunLogRetention } from './services/logRetentionService.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import { initDatabase } from './config/db.js';
import { seedDatabase } from './config/seed.js';
import { restoreFromCloud, startPeriodicSync } from './services/cloudSyncService.js';
import apiRouter from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Seed Development Data
initDatabase();
seedDatabase();

// Restore persistent data from Turso Cloud on boot & start background sync
await restoreFromCloud();
startPeriodicSync(15000);

// ── SECURITY: Remove Express fingerprint header ───────────────
app.disable('x-powered-by');

// ── SECURITY: CORS Whitelist (never wildcard with credentials) ─
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5000,https://habitauth.com,https://www.habitauth.com,https://habitauth.onrender.com').split(',').map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, mobile SDKs, same-origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
  },
  credentials: true
}));

// ── SECURITY: Rate Limiting on Authentication Endpoints ────────
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again in 15 minutes.' },
  skip: (req) => {
    // Skip rate limit for localhost in dev
    const ip = req.ip || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  }
});

const strictAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // max 5 register attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many account creation attempts. Please try again in 1 hour.' },
  skip: (req) => {
    const ip = req.ip || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  }
});

// ── SECURITY: Security Headers Middleware ─────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middlewares
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Apply rate limits to auth endpoints
app.use('/api/v1/auth/login', authRateLimit);
app.use('/api/v1/auth/register', strictAuthRateLimit);
app.use('/api/v1/client/login', authRateLimit);
app.use('/api/v1/client/register', authRateLimit);
app.use('/api/v1/auth/client-login', authRateLimit);
app.use('/api/v1/auth/client-register', authRateLimit);
app.use('/api/v1/auth/reset-password', authRateLimit);

// Serve Uploaded Images & Files
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// REST API v1
app.use('/api/v1', apiRouter);

// Return JSON for any unmatched /api routes (prevents Unexpected token < errors)
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route '${req.method} ${req.path}' not found.` });
});

// Serve Frontend Static Build
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA Fallback Handler
app.use((req, res, next) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  next();
});

// Start Server

// Background 30-Day Audit Log Purge & Warning Scheduler
checkAndRunLogRetention();
setInterval(() => {
  checkAndRunLogRetention();
}, 60 * 60 * 1000); // Hourly check

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`[Habit Auth] API Server is running on port ${PORT}`);
  console.log(`[Habit Auth] Local URL: http://localhost:${PORT}`);
  console.log('[Habit Auth] Modern Authentication & License Infrastructure');
  console.log('====================================================');
});
