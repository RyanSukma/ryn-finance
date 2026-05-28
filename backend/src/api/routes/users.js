const express = require('express')
const supabase = require('../../db/supabase')

const router = express.Router()

// GET /api/v1/users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, telegram_id, name, is_active, is_admin, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('GET /users error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data user.'
      })
    }

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('GET /users exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

// POST /api/v1/users
router.post('/', async (req, res) => {
  try {
    const { telegram_id, name, is_active, is_admin } = req.body

    if (!telegram_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'telegram_id dan name wajib diisi.'
      })
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        telegram_id,
        name,
        is_active: is_active ?? true,
        is_admin: is_admin ?? false
      })
      .select()
      .single()

    if (error) {
      console.error('POST /users error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal menambahkan user.',
        error: error.message
      })
    }

    return res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan.',
      data
    })
  } catch (error) {
    console.error('POST /users exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

module.exports = router