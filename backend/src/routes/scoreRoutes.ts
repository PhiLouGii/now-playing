import { Router } from 'express'

import { submitScore } from '../controllers/scoreController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post(
  '/',
  requireAuth,
  submitScore,
)

export default router