const { Bot } = require('grammy')
const whitelist = require('./middleware/whitelist')
const textHandler = require('./handlers/text')
const commandHandler = require('./handlers/commands')
const photoHandler = require('./handlers/photo')

const bot = new Bot(process.env.BOT_TOKEN)


// Middleware whitelist
bot.use(whitelist)

// Handler perintah dengan slash
bot.command('start', commandHandler.start)
bot.command('bantuan', commandHandler.bantuan)
bot.command('help', commandHandler.bantuan)
bot.command('rekap', commandHandler.rekap)
bot.command('hapus', commandHandler.hapus)
bot.command('hapussemua', commandHandler.hapusSemua)

// Handler perintah tanpa slash
bot.hears(/^(mulai|start)$/i, commandHandler.start)

bot.hears(
  /^(bantuan|help|panduan|cara pakai|cara menggunakan)$/i,
  commandHandler.bantuan
)

bot.hears(
  /^(rekap|rekapan|laporan|rekap bulan ini|laporan bulan ini)$/i,
  commandHandler.rekap
)
bot.hears(
  /^(hapus semua|hapus semua riwayat|hapus riwayat|reset riwayat|reset transaksi)$/i,
  commandHandler.hapusSemua
)
bot.hears(
  /^(hapus|delete|hapus transaksi|hapus data)$/i,
  commandHandler.hapus
)

// Handler tombol inline keyboard
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data

  if (data.startsWith('hapus_')) {
    return commandHandler.hapusCallback(ctx)
  }

  if (data.startsWith('ocr_')) {
    return photoHandler.ocrCallback(ctx)
  }

  await ctx.answerCallbackQuery()
})

// Handler foto struk
bot.on('message:photo', photoHandler.handlePhoto)

// Handler pesan teks transaksi
// Harus diletakkan paling bawah agar teks seperti "rekap", "hapus",
// dan "bantuan" tidak ikut dianggap sebagai format transaksi.
bot.on('message:text', textHandler)

// Handler error global
bot.catch((err) => {
  console.error('Bot error:', err)
})

module.exports = bot