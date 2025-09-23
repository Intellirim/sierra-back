import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './utils/env.js';
import { logger } from './utils/logger.js';
import intakeRouter from './routes/intake.js';
import reportRouter from './routes/report.js';
import emailRouter from './routes/email.js';
import { errorHandler, notFound } from './utils/errorHandler.js';

const app = express();

app.use(cors({
  origin: env.FRONTEND_ORIGIN || true,
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'sierra-back' }));

app.use('/api/intake', intakeRouter);
app.use('/api/report', reportRouter);
app.use('/api/email', emailRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(env.PORT || 8080);
app.listen(port, () => logger.info({ port }, 'sierra-back listening'));
