import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './config/firebase.js'

import songRoutes from './routes/songRoutes.js'
import musicRoutes from './routes/musicRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import eraRoutes from './routes/eraRoutes.js'
import dailyChallengeRoutes from './routes/dailyChallengeRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'
import userRoutes from './routes/userRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/songs', songRoutes)
app.use('/api/music', musicRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/eras', eraRoutes)
app.use('/api/daily-challenge', dailyChallengeRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/users', userRoutes)
app.get('/api/health', async (_req, res) => {
  try {
    await db.listCollections()

    res.json({
      status: 'ok',
      message: 'NOW PLAYING API is running',
      firebase: 'connected',
    })
  } catch (error) {
    console.error(
      'Firebase connection failed:',
      error,
    )

    res.status(500).json({
      status: 'error',
      message: 'Firebase connection failed',
    })
  }
})

app.listen(PORT, () => {
  console.log(
    `NOW PLAYING API running on http://localhost:${PORT}`,
  )
})
