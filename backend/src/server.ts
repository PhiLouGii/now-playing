import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './config/firebase.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

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