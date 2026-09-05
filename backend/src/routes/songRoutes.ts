import { Router } from 'express'
import {
  getSong,
  getSongs,
} from '../controllers/songController.js'

const router = Router()

router.get('/', getSongs)
router.get('/:id', getSong)

export default router