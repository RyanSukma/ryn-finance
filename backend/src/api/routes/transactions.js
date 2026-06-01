const express = require('express')
const supabase = require('../../db/supabase')

const router = express.Router()

function getCurrentMonthRange() {
  const now = new Date()

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString()

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  ).toISOString()

  return { firstDay, lastDay }
}

// GET /api/v1/transactions
// Query opsional: user_id, date_from, date_to
router.get('/', async (req, res) => {
  try {
    const { user_id, date_from, date_to } = req.query

    let query = supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        amount,
        description,
        source,
        photo_url,
        created_at,
        users:user_id (
          id,
          name,
          telegram_id
        )
      `)
      .order('created_at', { ascending: false })

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data, error } = await query

    if (error) {
      console.error('GET /transactions error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data transaksi.'
      })
    }

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('GET /transactions exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

// GET /api/v1/transactions/summary
// Default: bulan berjalan
// Query opsional: date_from, date_to
router.get('/summary', async (req, res) => {
  try {
    const { date_from, date_to } = req.query
    const { firstDay, lastDay } = getCurrentMonthRange()

    const startDate = date_from || firstDay
    const endDate = date_to || lastDay

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, telegram_id, is_active, is_admin')
      .order('created_at', { ascending: true })

    if (usersError) {
      console.error('GET /transactions/summary users error:', usersError)
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data user.'
      })
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, user_id, amount, description, source, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (transactionsError) {
      console.error('GET /transactions/summary transactions error:', transactionsError)
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data transaksi.'
      })
    }

    const totalFamily = transactions.reduce((sum, item) => {
      return sum + item.amount
    }, 0)

    const summaryPerUser = users.map(user => {
      const userTransactions = transactions.filter(item => item.user_id === user.id)

      const total = userTransactions.reduce((sum, item) => {
        return sum + item.amount
      }, 0)

      return {
        user_id: user.id,
        name: user.name,
        telegram_id: user.telegram_id,
        is_active: user.is_active,
        is_admin: user.is_admin,
        total,
        transaction_count: userTransactions.length
      }
    })

    return res.json({
      success: true,
      period: {
        date_from: startDate,
        date_to: endDate
      },
      data: {
        total_family: totalFamily,
        transaction_count: transactions.length,
        per_user: summaryPerUser
      }
    })
  } catch (error) {
    console.error('GET /transactions/summary exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

// DELETE /api/v1/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('DELETE /transactions/:id error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus transaksi.'
      })
    }

    return res.json({
      success: true,
      message: 'Transaksi berhasil dihapus.',
      data
    })
  } catch (error) {
    console.error('DELETE /transactions/:id exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

// POST /api/v1/transactions
router.post('/', async (req, res) => {
  try {
    const { user_id, amount, description, source = 'manual', created_at } = req.body

    if (!user_id || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'user_id, amount, dan description wajib diisi.'
      })
    }

    const payload = {
      user_id,
      amount: parseInt(amount),
      description,
      source
    }
    
    if (created_at) {
      payload.created_at = created_at
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('POST /transactions error:', error)
      return res.status(500).json({
        success: false,
        message: 'Gagal menambahkan transaksi.'
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan.',
      data
    })
  } catch (error) {
    console.error('POST /transactions exception:', error)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server.'
    })
  }
})

module.exports = router