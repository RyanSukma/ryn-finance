const express = require('express')
const supabase = require('../../db/supabase')

const router = express.Router()
const bot = require('../../bot')
const { runMonthlyRecap } = require('../../services/scheduler')

// GET /api/v1/reports
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select(`
  id,
  user_id,
  period,
  total_amount,
  pdf_url,
  generated_at,
  sent_at,
  users:user_id (
    id,
    name,
    telegram_id
  )
`)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('GET /reports error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar laporan.'
      })
    }

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('GET /reports exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})
// POST /api/v1/reports/generate
// Untuk testing manual generate PDF
router.post('/generate', async (req, res) => {
  try {
    const { mode, send_to_telegram } = req.body

    const result = await runMonthlyRecap(bot, {
      mode: mode || 'current-month',
      sendToTelegram: send_to_telegram ?? false
    })

    return res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat.',
      data: result
    })
  } catch (error) {
    console.error('POST /reports/generate error:', error)

    return res.status(500).json({
      success: false,
      message: 'Gagal membuat laporan.',
      error: error.message
    })
  }
})
// GET /api/v1/reports/:period
// Contoh period: 2026-05
router.get('/:period', async (req, res) => {
  try {
    const { period } = req.params

    const { data, error } = await supabase
      .from('monthly_reports')
      .select(`
  id,
  user_id,
  period,
  total_amount,
  pdf_url,
  generated_at,
  sent_at,
  users:user_id (
    id,
    name,
    telegram_id
  )
`)
      .eq('period', period)
      .maybeSingle()

    if (error) {
      console.error('GET /reports/:period error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil laporan.'
      })
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `Laporan periode ${period} tidak ditemukan.`
      })
    }

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('GET /reports/:period exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

module.exports = router