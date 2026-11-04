import { Router } from 'express'

import {
  getGameQuestion,
  searchGameArtists,
} from '../controllers/gameController.js'

const router = Router()

router.get(
  '/question',
  getGameQuestion,
)

router.get(
  '/artists/search',
  searchGameArtists,
)

export default router
