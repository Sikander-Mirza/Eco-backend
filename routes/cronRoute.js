// routes/cronRoute.js
import express from 'express';
import { runProfitUpdate } from '../cronJobs.js';

const router = express.Router();

router.get('/cron/profit-update', async (req, res) => {
  // 🔒 Security: verify secret token
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  
  if (secret !== process.env.CRON_SECRET) {
    console.warn('[CRON] ❌ Unauthorized attempt from:', req.ip);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[CRON] 🚀 Triggered by cron-job.org');
    const result = await runProfitUpdate();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[CRON] ❌ Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;