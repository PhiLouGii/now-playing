import { Router } from 'express'
import { db } from '../config/firebase.js'

const router = Router()

router.get(
  '/',
  async (_req, res) => {
    try {
      const snapshot =
        await db
          .collection('loadingFacts')
          .get()

      if (snapshot.empty) {
        return res.status(404).json({
          message:
            'No loading facts found',
        })
      }

      const facts =
        snapshot.docs.map(
          document => ({
            id: document.id,
            ...document.data(),
          }),
        )

      return res.json({
        count: facts.length,
        facts,
      })
    } catch (error) {
      console.error(
        'Failed to load loading facts:',
        error,
      )

      return res.status(500).json({
        message:
          'Failed to load loading facts',
      })
    }
  },
)

export default router