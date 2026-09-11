import { Router } from 'express'

import {
  getTodayDailyChallenge,
} from '../controllers/dailyChallengeController.js'

const router = Router()

router.get(
  '/',
  getTodayDailyChallenge,
)

export default router