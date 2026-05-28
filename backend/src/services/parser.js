/**
 * Parse teks pengeluaran menjadi objek terstruktur
 * Format yang didukung:
 * - "50000 makan siang"
 * - "50.000 makan siang"
 * - "50rb bensin"
 * - "50ribu bensin"
 * - "1.5jt belanja"
 * - "2juta belanja bulanan"
 */

module.exports = function parseExpense(text) {
  const cleaned = text.trim().toLowerCase()

  // Regex: tangkap nominal (dengan format rb/ribu/jt/juta) + keterangan
  const pattern = /^([\d.,]+)\s*(rb|ribu|jt|juta)?\s+(.+)$/i
  const match = cleaned.match(pattern)

  if (!match) return null

  let [, nominalRaw, suffix, description] = match

  // Bersihkan titik ribuan → jadi angka murni
  nominalRaw = nominalRaw.replace(/\./g, '').replace(/,/g, '.')

  let amount = parseFloat(nominalRaw)

  if (isNaN(amount) || amount <= 0) return null

  // Konversi suffix
  if (suffix === 'rb' || suffix === 'ribu') {
    amount = amount * 1000
  } else if (suffix === 'jt' || suffix === 'juta') {
    amount = amount * 1000000
  }

  // Bulatkan ke integer (rupiah tidak pakai desimal)
  amount = Math.round(amount)

  return {
    amount,
    description: description.trim()
  }
}