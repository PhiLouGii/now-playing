import { Router } from 'express'

import {
  getUserStats,
  getUserScores,
} from '../controllers/userController'

import {
  requireAuth,
} from '../middleware/authMiddleware'

const router = Router()

router.get(
  '/stats',
  requireAuth,
  getUserStats,
)

router.get(
  '/scores',
  requireAuth,
  getUserScores,
)

export default router