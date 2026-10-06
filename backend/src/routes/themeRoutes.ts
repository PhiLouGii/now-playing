import { Router } from 'express'

import { db } from '../config/firebase.js'

const router = Router()

router.get('/:theme', async (req, res) => {
  try {
    const { theme } = req.params

    if (!theme) {
      return res.status(400).json({
        error: 'Theme is required',
      })
    }

    const snapshot = await db
      .collection('songs')
      .where(
        'themes',
        'array-contains',
        theme,
      )
      .get()

    const songs = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      }),
    )

    return res.json({
      theme,
      count: songs.length,
      songs,
    })
  } catch (error) {
    console.error(
      'Failed to fetch theme songs:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to fetch theme songs',
    })
  }
})

export default router