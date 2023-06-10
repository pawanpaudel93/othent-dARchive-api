import express from 'express';

import MessageResponse from '../interfaces/MessageResponse.js';
import archive from './archive.js';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/archive', archive);

export default router;
