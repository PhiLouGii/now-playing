import { Router } from 'express'
import {
  getGameQuestion,
} from '../controllers/gameController.js'

const router = Router()

router.get(
  '/question',
  getGameQuestion,
)

export default router