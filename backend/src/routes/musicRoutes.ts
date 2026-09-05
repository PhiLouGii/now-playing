import { Router } from 'express'
import {
  getMusicTrack,
  searchMusic,
} from '../controllers/musicController.js'

const router = Router()

router.get(
  '/search',
  searchMusic,
)

router.get(
  '/:id',
  getMusicTrack,
)

export default router