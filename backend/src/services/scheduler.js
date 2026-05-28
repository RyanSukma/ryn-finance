const cron = require('node-cron')
const { InputFile } = require('grammy')
const supabase = require('../db/supabase')
const { generatePDF, uploadPDFToStorage } = require('./pdf')

function getPreviousMonthRange() {
  const now = new Date()

  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    periodLabel: start.toLocaleString('id-ID', {
      month: 'long',
      year: 'numeric'
    })
  }
}

function getCurrentMonthRange() {
  const now = new Date()

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    periodLabel: start.toLocaleString('id-ID', {
      month: 'long',
      year: 'numeric'
    })
  }
}

async function getActiveUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, telegram_id, name, is_active, is_admin')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Gagal mengambil users: ${error.message}`)
  }

  return data || []
}

async function buildUserReportData(user, range) {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, user_id, amount, description, source, photo_url, created_at')
    .eq('user_id', user.id)
    .gte('created_at', range.startDate)
    .lte('created_at', range.endDate)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Gagal mengambil transaksi ${user.name}: ${error.message}`)
  }

  const totalAmount = transactions.reduce((sum, item) => {
    return sum + item.amount
  }, 0)

  const transactionCount = transactions.length

  const averageAmount = transactionCount > 0
    ? Math.round(totalAmount / transactionCount)
    : 0

  return {
    userId: user.id,
    telegramId: user.telegram_id,
    userName: user.name,
    period: range.period,
    periodLabel: range.periodLabel,
    startDate: range.startDate,
    endDate: range.endDate,
    totalAmount,
    transactionCount,
    averageAmount,
    transactions
  }
}

async function sendPDFToUser(bot, user, pdfBuffer, filename, periodLabel) {
  await bot.api.sendDocument(
    user.telegram_id,
    new InputFile(pdfBuffer, filename),
    {
      caption:
        `📊 Laporan Keuangan — ${periodLabel}\n\n` +
        `Halo ${user.name}, berikut laporan keuangan kamu untuk periode ${periodLabel}.`
    }
  )
}

async function saveMonthlyReport(userId, period, totalAmount, pdfUrl, sentAt = null) {
  const { data, error } = await supabase
    .from('monthly_reports')
    .insert({
      user_id: userId,
      period,
      total_amount: totalAmount,
      pdf_url: pdfUrl,
      sent_at: sentAt
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Gagal menyimpan monthly_reports: ${error.message}`)
  }

  return data
}

async function runMonthlyRecap(bot, options = {}) {
  const mode = options.mode || 'previous-month'

  const range = mode === 'current-month'
    ? getCurrentMonthRange()
    : getPreviousMonthRange()

  console.log(`Mulai generate laporan per user untuk periode ${range.period}...`)

  const activeUsers = await getActiveUsers()
  const results = []

  for (const user of activeUsers) {
    try {
      const reportData = await buildUserReportData(user, range)
      const pdfBuffer = await generatePDF(reportData)

      const safeName = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')

      const filename = `rynfinance-report-${safeName}-${range.period}.pdf`
      const pdfUrl = await uploadPDFToStorage(pdfBuffer, filename)

      let sentAt = null

      if (options.sendToTelegram !== false) {
        await sendPDFToUser(
          bot,
          user,
          pdfBuffer,
          filename,
          range.periodLabel
        )

        sentAt = new Date().toISOString()
      }

      const monthlyReport = await saveMonthlyReport(
        user.id,
        range.period,
        reportData.totalAmount,
        pdfUrl,
        sentAt
      )

      results.push({
        user_id: user.id,
        name: user.name,
        report: monthlyReport,
        pdf_url: pdfUrl,
        total_amount: reportData.totalAmount,
        transaction_count: reportData.transactionCount,
        sent_to_telegram: Boolean(sentAt)
      })
    } catch (error) {
      console.error(`Gagal membuat laporan untuk ${user.name}:`, error)

      results.push({
        user_id: user.id,
        name: user.name,
        error: error.message
      })
    }
  }

  console.log(`Generate laporan per user periode ${range.period} selesai.`)

  return {
    period: range.period,
    period_label: range.periodLabel,
    user_count: activeUsers.length,
    results
  }
}

function startScheduler(bot) {
  cron.schedule(
    '0 7 1 * *',
    async () => {
      try {
        await runMonthlyRecap(bot, {
          mode: 'previous-month',
          sendToTelegram: true
        })
      } catch (error) {
        console.error('Gagal menjalankan scheduler rekap bulanan:', error)
      }
    },
    {
      timezone: 'Asia/Jakarta'
    }
  )

  console.log('🕒 Scheduler rekap bulanan aktif')
}

module.exports = {
  startScheduler,
  runMonthlyRecap,
  getPreviousMonthRange,
  getCurrentMonthRange
}