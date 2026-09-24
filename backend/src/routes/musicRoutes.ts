import { Router } from 'express'
import {
  discoverMusic,
  getFeaturedArtists,
  getMusicTrack,
  searchMusic,
} from '../controllers/musicController.js'

const router = Router()

router.get(
  '/discover',
  discoverMusic,
)

router.get(
  '/search',
  searchMusic,
)

router.get(
  '/artists',
  getFeaturedArtists,
)

router.get(
  '/:id',
  getMusicTrack,
)

export default router