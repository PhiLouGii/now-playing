
import { Router } from 'express'
import {
  getPixelCoverAlbums,
  searchPixelCoverAlbums,
} from '../controllers/pixelCoverController.js'

const router = Router()

router.get('/albums', getPixelCoverAlbums)
router.get('/albums/search', searchPixelCoverAlbums)

export default router
