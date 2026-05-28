require('dotenv').config()
const express = require('express')

const app = express()

// Inisialisasi bot Telegram
const bot = require('./bot/index')

// Import API routes untuk dashboard
const apiRoutes = require('./api/routes')

// Middleware untuk membaca JSON request body
app.use(express.json())

// CORS sederhana agar dashboard nanti bisa akses backend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RynFinance backend is running 🚀'
  })
})

// API untuk dashboard
app.use('/api/v1', apiRoutes)

// Start Express
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`✅ Server jalan di port ${PORT}`)
})

// Start Bot Telegram
bot.start()
console.log('🤖 Bot Telegram aktif')