const parser = require('../../services/parser')
const supabase = require('../../db/supabase')

module.exports = async (ctx) => {
  const text = ctx.message.text.trim()
  const user = ctx.user

  // Abaikan command slash karena sudah ditangani command handler
  if (text.startsWith('/')) {
    return
  }

  const lowerText = text.toLowerCase()

  // Sapaan umum
  const greetings = [
    'halo',
    'hai',
    'hi',
    'hello',
    'pagi',
    'selamat pagi',
    'siang',
    'selamat siang',
    'sore',
    'selamat sore',
    'malam',
    'selamat malam',
    'assalamualaikum',
    'assalamu alaikum',
    'tes',
    'test'
  ]

  if (greetings.includes(lowerText)) {
    await ctx.reply(
      `Halo, ${user.name}! 👋\n\n` +
      `Aku siap membantu mencatat pengeluaran kamu.\n\n` +
      `Contoh pencatatan satu transaksi:\n` +
      `• \`50000 makan siang\`\n` +
      `• \`50rb bensin\`\n\n` +
      `Contoh pencatatan banyak transaksi:\n` +
      `\`5000 jajan\`\n` +
      `\`80000 makan\`\n` +
      `\`300000 belanja\`\n\n` +
      `Kamu juga bisa ketik:\n` +
      `• \`rekap\` untuk melihat rekap bulan ini\n` +
      `• \`hapus\` untuk menghapus transaksi\n` +
      `• \`bantuan\` untuk melihat panduan lengkap`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Ucapan terima kasih
  const thanks = [
    'makasih',
    'terima kasih',
    'thanks',
    'thank you',
    'thx',
    'oke',
    'ok',
    'sip',
    'siap'
  ]

  if (thanks.includes(lowerText)) {
    await ctx.reply(
      `Sama-sama, ${user.name}! 😊\n\n` +
      `Kalau mau mencatat banyak transaksi sekaligus, bisa seperti ini:\n\n` +
      `\`5000 jajan\`\n` +
      `\`80000 makan\`\n` +
      `\`300000 belanja\``,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Pecah pesan menjadi beberapa baris
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  // Batasi agar tidak terlalu banyak dalam satu pesan
  if (lines.length > 30) {
    await ctx.reply(
      '⚠️ Terlalu banyak transaksi dalam satu pesan.\n\n' +
      'Maksimal 30 transaksi sekali kirim ya.'
    )
    return
  }

  const validTransactions = []
  const invalidLines = []

  for (const line of lines) {
    const result = parser(line)

    if (!result) {
      invalidLines.push(line)
      continue
    }

    validTransactions.push({
      user_id: user.id,
      amount: result.amount,
      description: result.description,
      source: 'text'
    })
  }

  // Jika semua baris gagal diparse
  if (validTransactions.length === 0) {
    await ctx.reply(
      `Maaf, aku belum memahami format pesan itu. 🙏\n\n` +
      `Contoh satu transaksi:\n` +
      `• \`50000 makan siang\`\n` +
      `• \`50rb bensin\`\n` +
      `• \`1.5jt belanja bulanan\`\n\n` +
      `Contoh banyak transaksi:\n` +
      `\`5000 jajan\`\n` +
      `\`80000 makan\`\n` +
      `\`300000 belanja\``,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Simpan banyak transaksi sekaligus
  const { error } = await supabase
    .from('transactions')
    .insert(validTransactions)

  if (error) {
    console.error('Error simpan transaksi batch:', error)
    await ctx.reply('❌ Gagal menyimpan transaksi. Coba lagi ya.')
    return
  }

  const successList = validTransactions.map((item, index) => {
    const nominal = new Intl.NumberFormat('id-ID').format(item.amount)
    return `${index + 1}. Rp ${nominal} — ${item.description}`
  }).join('\n')

  let replyMessage =
    `✅ ${validTransactions.length} transaksi berhasil dicatat.\n\n` +
    `${successList}`

  if (invalidLines.length > 0) {
    const failedList = invalidLines
      .map(line => `• ${line}`)
      .join('\n')

    replyMessage +=
      `\n\n⚠️ ${invalidLines.length} baris tidak berhasil dibaca:\n` +
      `${failedList}\n\n` +
      `Pastikan formatnya: \`nominal keterangan\``
  }

  replyMessage += `\n\nKetik \`rekap\` untuk melihat total bulan ini.`

  await ctx.reply(replyMessage, {
    parse_mode: 'Markdown'
  })
}