const supabase = require('../../db/supabase')

const start = async (ctx) => {
  await ctx.reply(
    `Halo, ${ctx.user.name}! 👋\n\n` +
    `Selamat datang di *RynFinance* 💰\n\n` +
    `Cara mencatat pengeluaran:\n` +
    `• Ketik nominal + keterangan\n` +
    `  contoh: \`50000 makan siang\`\n` +
    `• Bisa juga pakai format singkat:\n` +
    `  contoh: \`50rb bensin\`\n` +
    `• Atau kirim foto struk belanjaan\n\n` +
    `Ketik \`bantuan\` atau /bantuan untuk info lengkap.`,
    { parse_mode: 'Markdown' }
  )
}

const bantuan = async (ctx) => {
  await ctx.reply(
    `📖 *Panduan RynFinance*\n\n` +
    `*Format mencatat pengeluaran:*\n` +
    `\`50000 makan siang\`\n` +
    `\`50rb bensin\`\n` +
    `\`25.000 parkir\`\n` +
    `\`1.5jt belanja bulanan\`\n\n` +

    `*Perintah yang bisa digunakan:*\n` +
    `/rekap atau \`rekap\`\n` +
    `Melihat rekap pengeluaran bulan ini.\n\n` +

    `/hapus atau \`hapus\`\n` +
    `Memilih transaksi yang ingin dihapus.\n\n` +

    `/bantuan atau \`bantuan\`\n` +
    `Menampilkan panduan penggunaan bot.\n\n` +

    `*Foto struk:*\n` +
    `Kamu juga bisa mengirim foto struk belanjaan. Sistem akan mencoba membaca nominalnya secara otomatis, lalu meminta konfirmasi sebelum disimpan.`,
    { parse_mode: 'Markdown' }
  )
}

const rekap = async (ctx) => {
  const user = ctx.user
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

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', firstDay)
    .lte('created_at', lastDay)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error mengambil rekap:', error)
    await ctx.reply('❌ Gagal mengambil data. Coba lagi ya.')
    return
  }

  if (!transactions || transactions.length === 0) {
    await ctx.reply('📭 Belum ada transaksi bulan ini.')
    return
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)
  const formatted = new Intl.NumberFormat('id-ID').format(total)

  const namaBulan = now.toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric'
  })

  const recent = transactions.slice(0, 5)

  const recentList = recent.map(t => {
    const tgl = new Date(t.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })

    const nominal = new Intl.NumberFormat('id-ID').format(t.amount)

    return `• ${tgl} — ${t.description} — Rp ${nominal}`
  }).join('\n')

  await ctx.reply(
    `📊 *Rekap ${namaBulan}*\n` +
    `👤 ${user.name}\n\n` +
    `💰 Total: *Rp ${formatted}*\n` +
    `🧾 Transaksi: ${transactions.length} kali\n\n` +
    `*5 Terakhir:*\n` +
    `${recentList}`,
    { parse_mode: 'Markdown' }
  )
}

const hapus = async (ctx) => {
  const user = ctx.user

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('Error mengambil transaksi untuk hapus:', error)
    await ctx.reply('❌ Gagal mengambil daftar transaksi.')
    return
  }

  if (!transactions || transactions.length === 0) {
    await ctx.reply('📭 Tidak ada transaksi yang bisa dihapus.')
    return
  }

  const buttons = transactions.map(t => {
    const nominal = new Intl.NumberFormat('id-ID').format(t.amount)

    const tgl = new Date(t.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })

    return [
      {
        text: `${tgl} — ${t.description} — Rp ${nominal}`,
        callback_data: `hapus_pilih_${t.id}`
      }
    ]
  })

  buttons.push([
  {
    text: '🧹 Hapus semua riwayat',
    callback_data: 'hapus_semua_minta'
  }
])

buttons.push([
  {
    text: '❌ Batal',
    callback_data: 'hapus_batal'
  }
])

  await ctx.reply(
    `🗑️ *Pilih transaksi yang ingin dihapus:*`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    }
  )
}
const hapusSemua = async (ctx) => {
  const user = ctx.user

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error cek transaksi untuk hapus semua:', error)
    await ctx.reply('❌ Gagal mengecek riwayat transaksi.')
    return
  }

  if (!transactions || transactions.length === 0) {
    await ctx.reply('📭 Tidak ada riwayat transaksi yang bisa dihapus.')
    return
  }

  await ctx.reply(
    `⚠️ *Hapus semua riwayat transaksi?*\n\n` +
    `Kamu memiliki *${transactions.length} transaksi*.\n\n` +
    `Jika dilanjutkan, semua riwayat transaksi milik kamu akan dihapus permanen dan tidak bisa dikembalikan.\n\n` +
    `Apakah kamu yakin?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Ya, hapus semua',
              callback_data: 'hapus_semua_konfirm'
            }
          ],
          [
            {
              text: '❌ Batal',
              callback_data: 'hapus_batal'
            }
          ]
        ]
      }
    }
  )
}

const hapusCallback = async (ctx) => {
  const data = ctx.callbackQuery.data

  if (data === 'hapus_batal') {
    await ctx.editMessageText('👌 Penghapusan dibatalkan.')
    await ctx.answerCallbackQuery()
    return
  }

  if (data === 'hapus_kembali') {
    await ctx.deleteMessage()
    await ctx.answerCallbackQuery()
    await hapus(ctx)
    return
  }
  if (data === 'hapus_semua_minta') {
  await ctx.editMessageText(
    `⚠️ *Hapus semua riwayat transaksi?*\n\n` +
    `Jika dilanjutkan, semua riwayat transaksi milik kamu akan dihapus permanen dan tidak bisa dikembalikan.\n\n` +
    `Apakah kamu yakin?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Ya, hapus semua',
              callback_data: 'hapus_semua_konfirm'
            }
          ],
          [
            {
              text: '❌ Batal',
              callback_data: 'hapus_batal'
            }
          ]
        ]
      }
    }
  )

  await ctx.answerCallbackQuery()
  return
}

if (data === 'hapus_semua_konfirm') {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', ctx.user.id)

  if (error) {
    console.error('Error hapus semua transaksi:', error)
    await ctx.editMessageText('❌ Gagal menghapus semua riwayat transaksi.')
    await ctx.answerCallbackQuery()
    return
  }

  await ctx.editMessageText('✅ Semua riwayat transaksi kamu berhasil dihapus.')
  await ctx.answerCallbackQuery()
  return
}
  if (data.startsWith('hapus_pilih_')) {
    const transactionId = data.replace('hapus_pilih_', '')

    const { data: t, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', ctx.user.id)
      .single()

    if (error || !t) {
      await ctx.editMessageText('❌ Transaksi tidak ditemukan.')
      await ctx.answerCallbackQuery()
      return
    }

    const nominal = new Intl.NumberFormat('id-ID').format(t.amount)

    const tgl = new Date(t.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    await ctx.editMessageText(
      `⚠️ *Yakin hapus transaksi ini?*\n\n` +
      `💰 Rp ${nominal}\n` +
      `📝 ${t.description}\n` +
      `📅 ${tgl}\n\n` +
      `Tindakan ini tidak bisa dibatalkan.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Ya, hapus',
                callback_data: `hapus_konfirm_${t.id}`
              },
              {
                text: '◀️ Kembali',
                callback_data: 'hapus_kembali'
              }
            ]
          ]
        }
      }
    )

    await ctx.answerCallbackQuery()
    return
  }

  if (data.startsWith('hapus_konfirm_')) {
    const transactionId = data.replace('hapus_konfirm_', '')

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', ctx.user.id)

    if (error) {
      console.error('Error hapus transaksi:', error)
      await ctx.editMessageText('❌ Gagal menghapus. Coba lagi ya.')
      await ctx.answerCallbackQuery()
      return
    }

    await ctx.editMessageText('✅ Transaksi berhasil dihapus.')
    await ctx.answerCallbackQuery()
    return
  }

  await ctx.answerCallbackQuery()
}

module.exports = {
  start,
  bantuan,
  rekap,
  hapus,
  hapusCallback
}