const parser = require('../../services/parser')
const supabase = require('../../db/supabase')

module.exports = async (ctx) => {
  const text = ctx.message.text.trim()
  const user = ctx.user

  // Abaikan command slash karena sudah ditangani oleh command handler
  if (text.startsWith('/')) {
    return
  }

  const lowerText = text.toLowerCase()

  // Balasan untuk sapaan umum
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
      `Contoh pencatatan:\n` +
      `• \`50000 makan siang\`\n` +
      `• \`50rb bensin\`\n` +
      `• \`25.000 parkir\`\n\n` +
      `Kamu juga bisa ketik:\n` +
      `• \`rekap\` untuk melihat rekap bulan ini\n` +
      `• \`hapus\` untuk menghapus transaksi\n` +
      `• \`bantuan\` untuk melihat panduan lengkap`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Balasan untuk ucapan terima kasih
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
      `Kalau mau mencatat pengeluaran, langsung ketik saja seperti:\n` +
      `\`50000 makan siang\``,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Coba parse teks sebagai transaksi
  const result = parser(text)

  if (!result) {
    await ctx.reply(
      `Maaf, aku belum memahami pesan itu. 🙏\n\n` +
      `Aku bisa membantu mencatat pengeluaran, membaca foto struk, menampilkan rekap, dan menghapus transaksi.\n\n` +
      `Contoh yang bisa kamu ketik:\n` +
      `• \`50000 makan siang\`\n` +
      `• \`50rb bensin\`\n` +
      `• \`1.5jt belanja bulanan\`\n` +
      `• \`rekap\`\n` +
      `• \`hapus\`\n` +
      `• \`bantuan\``,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Simpan transaksi ke Supabase
  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: result.amount,
      description: result.description,
      source: 'text'
    })

  if (error) {
    console.error('Error simpan transaksi:', error)
    await ctx.reply('❌ Gagal menyimpan transaksi. Coba lagi ya.')
    return
  }

  const formatted = new Intl.NumberFormat('id-ID').format(result.amount)

  await ctx.reply(
    `✅ Tercatat!\n\n` +
    `💰 Rp ${formatted}\n` +
    `📝 ${result.description}\n` +
    `👤 ${user.name}`,
    { parse_mode: 'Markdown' }
  )
}