import { Router } from 'express'

import {
  getUserStats,
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

export default router