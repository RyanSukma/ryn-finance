const axios = require('axios')
const supabase = require('../../db/supabase')
const ocr = require('../../services/ocr')
const pendingOcr = require('../../services/pendingOcr')

const handlePhoto = async (ctx) => {
  try {
    const photos = ctx.message.photo

    if (!photos || photos.length === 0) {
      await ctx.reply('❌ Foto tidak ditemukan.')
      return
    }

    await ctx.reply('🔎 Foto struk diterima. Sedang saya baca dulu...')

    // Ambil foto dengan resolusi terbesar
    const bestPhoto = photos[photos.length - 1]

    // Ambil informasi file dari Telegram
    const file = await ctx.api.getFile(bestPhoto.file_id)

    if (!file.file_path) {
      await ctx.reply('❌ Gagal mengambil file foto dari Telegram.')
      return
    }

    // Download file dari server Telegram
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`

    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    })

    const imageBuffer = Buffer.from(response.data)

    // Proses OCR
    const result = await ocr.analyzeReceiptImage(imageBuffer)

    if (!result.rawText || result.rawText.trim() === '') {
      await ctx.reply(
        '❌ Saya belum bisa membaca teks pada struk ini.\n\n' +
        'Coba foto ulang dengan pencahayaan lebih terang, atau ketik manual seperti:\n' +
        '`50000 belanja`',
        { parse_mode: 'Markdown' }
      )
      return
    }

    if (!result.amount) {
      await ctx.reply(
        '⚠️ Teks pada struk berhasil terbaca, tetapi nominal total belum bisa saya pastikan.\n\n' +
        'Silakan ketik manual, contoh:\n' +
        '`50000 belanja`',
        { parse_mode: 'Markdown' }
      )
      return
    }

    const description = ctx.message.caption?.trim() || 'Belanja dari struk'
    const formattedAmount = new Intl.NumberFormat('id-ID').format(result.amount)

    const pendingId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    pendingOcr.setPending(pendingId, {
      user_id: ctx.user.id,
      amount: result.amount,
      description,
      raw_text: result.rawText,
      matched_line: result.matchedLine,
      confidence: result.confidence
    })

    const confidenceText = result.confidence === 'high'
      ? 'tinggi'
      : 'rendah, mohon dicek lagi'

    await ctx.reply(
      `🧾 *Hasil pembacaan struk:*\n\n` +
      `💰 Nominal: *Rp ${formattedAmount}*\n` +
      `📝 Keterangan: ${description}\n` +
      `🎯 Keyakinan: ${confidenceText}\n\n` +
      `Apakah nominal ini benar?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Ya, simpan',
                callback_data: `ocr_simpan_${pendingId}`
              }
            ],
            [
              {
                text: '✏️ Ketik manual',
                callback_data: `ocr_manual_${pendingId}`
              },
              {
                text: '❌ Batal',
                callback_data: `ocr_batal_${pendingId}`
              }
            ]
          ]
        }
      }
    )
  } catch (error) {
    console.error('Error handle photo:', error)

    await ctx.reply(
      '❌ Terjadi error saat membaca struk.\n\n' +
      'Untuk sementara, silakan catat manual seperti:\n' +
      '`50000 belanja`',
      { parse_mode: 'Markdown' }
    )
  }
}

const ocrCallback = async (ctx) => {
  const data = ctx.callbackQuery.data

  if (data.startsWith('ocr_batal_')) {
    const pendingId = data.replace('ocr_batal_', '')
    pendingOcr.deletePending(pendingId)

    await ctx.editMessageText('👌 Pencatatan dari struk dibatalkan.')
    await ctx.answerCallbackQuery()
    return
  }

  if (data.startsWith('ocr_manual_')) {
    const pendingId = data.replace('ocr_manual_', '')
    pendingOcr.deletePending(pendingId)

    await ctx.editMessageText(
      '✏️ Silakan ketik manual dengan format:\n\n' +
      '`50000 belanja`\n' +
      '`50rb makan siang`\n' +
      '`1.5jt belanja bulanan`',
      { parse_mode: 'Markdown' }
    )

    await ctx.answerCallbackQuery()
    return
  }

  if (data.startsWith('ocr_simpan_')) {
    const pendingId = data.replace('ocr_simpan_', '')
    const pending = pendingOcr.getPending(pendingId)

    if (!pending) {
      await ctx.editMessageText(
        '⚠️ Data OCR sudah kedaluwarsa atau tidak ditemukan.\n\n' +
        'Silakan kirim ulang foto struk.'
      )
      await ctx.answerCallbackQuery()
      return
    }

    if (pending.user_id !== ctx.user.id) {
      await ctx.editMessageText('⛔ Kamu tidak memiliki akses untuk menyimpan transaksi ini.')
      await ctx.answerCallbackQuery()
      return
    }

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: ctx.user.id,
        amount: pending.amount,
        description: pending.description,
        source: 'photo',
        photo_url: null
      })

    if (error) {
      console.error('Error simpan transaksi OCR:', error)
      await ctx.editMessageText('❌ Gagal menyimpan transaksi dari struk.')
      await ctx.answerCallbackQuery()
      return
    }

    pendingOcr.deletePending(pendingId)

    const formattedAmount = new Intl.NumberFormat('id-ID').format(pending.amount)

    await ctx.editMessageText(
      `✅ Transaksi dari struk berhasil disimpan!\n\n` +
      `💰 Rp ${formattedAmount}\n` +
      `📝 ${pending.description}\n` +
      `👤 ${ctx.user.name}`
    )

    await ctx.answerCallbackQuery()
  }
}

module.exports = {
  handlePhoto,
  ocrCallback
}