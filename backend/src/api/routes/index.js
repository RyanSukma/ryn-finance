const express = require('express')
const auth = require('../middleware/auth')

const transactionsRouter = require('./transactions')
const usersRouter = require('./users')
const reportsRouter = require('./reports')

const router = express.Router()

// Semua endpoint dashboard wajib pakai API key
router.use(auth)

router.use('/transactions', transactionsRouter)
router.use('/users', usersRouter)
router.use('/reports', reportsRouter)

module.exports = router