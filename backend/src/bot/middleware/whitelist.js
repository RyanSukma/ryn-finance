const supabase = require('../../db/supabase')

module.exports = async (ctx, next) => {
  const telegramId = ctx.from?.id

  if (!telegramId) return

  // Cek apakah user terdaftar di database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .single()

  if (error || !user) {
    await ctx.reply(
      '⛔ Akses ditolak.\n\n' +
      'Kamu belum terdaftar di sistem RynFinance.\n' +
      'Hubungi admin untuk didaftarkan.'
    )
    return // Stop, tidak lanjut ke handler berikutnya
  }

  // Simpan data user ke context supaya handler lain bisa pakai
  ctx.user = user
  return next()
}