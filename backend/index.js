import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import './src/firebase/admin.js'
import { verifyFirebaseToken } from './src/middlewares/auth.js'

import healthRoutes from './src/routes/health.js'
import adminRoutes from './src/routes/admin.js'
import superRoutes from './src/routes/super.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.use('/api', healthRoutes)
app.use('/api', verifyFirebaseToken, adminRoutes)
app.use('/api', verifyFirebaseToken, superRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'غير موجود' })
})

const port = parseInt(process.env.PORT || '5000', 10)
app.listen(port, () => {
  console.log(`API listening on :${port}`)
})
