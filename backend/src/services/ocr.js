const axios = require('axios')
require('dotenv').config()

async function analyzeReceiptImage(buffer) {
  const provider = process.env.OCR_PROVIDER || 'ocrspace'

  let rawText = ''

  if (provider === 'ocrspace') {
    rawText = await detectTextWithOcrSpace(buffer)
  } else if (provider === 'google') {
    rawText = await detectTextWithGoogleVision(buffer)
  } else {
    throw new Error(`OCR_PROVIDER tidak dikenali: ${provider}`)
  }

  const totalResult = extractTotalFromText(rawText)

  return {
    rawText,
    amount: totalResult.amount,
    confidence: totalResult.confidence,
    matchedLine: totalResult.matchedLine
  }
}

async function detectTextWithOcrSpace(buffer) {
  const apiKey = process.env.OCR_SPACE_KEY

  if (!apiKey) {
    throw new Error('OCR_SPACE_KEY belum diatur di .env')
  }

  console.log('OCR Provider: OCR.space')
  console.log('OCR_SPACE_KEY terbaca:', apiKey ? 'YA' : 'TIDAK')

  const base64Image = buffer.toString('base64')

  const formData = new URLSearchParams()
  formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`)
  formData.append('language', 'eng')
  formData.append('isOverlayRequired', 'false')
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')
  formData.append('OCREngine', '2')

  const response = await axios.post(
    'https://api.ocr.space/parse/image',
    formData,
    {
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 60000
    }
  )

  const result = response.data

  if (result.IsErroredOnProcessing) {
    const errorMessage = Array.isArray(result.ErrorMessage)
      ? result.ErrorMessage.join(', ')
      : result.ErrorMessage

    throw new Error(`OCR.space error: ${errorMessage || 'Unknown error'}`)
  }

  const parsedText = result.ParsedResults?.[0]?.ParsedText || ''

  return parsedText
}

async function detectTextWithGoogleVision(buffer) {
  const apiKey = process.env.GOOGLE_VISION_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_VISION_KEY belum diatur di .env')
  }

  console.log('OCR Provider: Google Vision')
  console.log('GOOGLE_VISION_KEY terbaca:', apiKey ? 'YA' : 'TIDAK')

  const base64Image = buffer.toString('base64')

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`

  const payload = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          {
            type: 'TEXT_DETECTION'
          }
        ]
      }
    ]
  }

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000
  })

  const visionResponse = response.data.responses?.[0]

  if (visionResponse?.error) {
    throw new Error(visionResponse.error.message)
  }

  const text =
    visionResponse?.textAnnotations?.[0]?.description ||
    visionResponse?.fullTextAnnotation?.text ||
    ''

  return text
}

function extractTotalFromText(rawText) {
  if (!rawText || rawText.trim() === '') {
    return {
      amount: null,
      confidence: 'low',
      matchedLine: null
    }
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  console.log('========== RAW OCR TEXT ==========')
  console.log(rawText)
  console.log('==================================')

  // Pola khusus untuk hasil OCR seperti:
  // Total
  // Cash
  // Change
  // 19,000
  // 50,000
  // 31,000
  const separatedTotal = findSeparatedTotalPattern(lines)

  if (separatedTotal) {
    console.log('POLA TOTAL-CASH-CHANGE TERDETEKSI:', separatedTotal)
    return separatedTotal
  }

  const strongTotalKeywords = [
    /grand\s*total/i,
    /total\s*akhir/i,
    /total\s*bayar/i,
    /total\s*pembayaran/i
  ]

  const normalTotalKeywords = [
    /\bt[o0]t[a4]l\b/i,
    /\btota[iIl1]\b/i,
    /total\s*harga/i,
    /\bjumlah\b/i
  ]

  const avoidKeywords = [
    /subtotal/i,
    /sub\s*total/i,
    /diskon/i,
    /discount/i,
    /pajak/i,
    /tax/i,
    /ppn/i,
    /pb1/i,
    /pbi/i,
    /service/i,
    /charge/i,

    // pembayaran, jangan dianggap sebagai total belanja
    /bayar/i,
    /cash/i,
    /c[a4]sh/i,
    /gash/i,
    /casn/i,
    /tunai/i,
    /paid/i,
    /payment/i,

    // kembalian, jangan dianggap sebagai total belanja
    /kembali/i,
    /kembalian/i,
    /change/i,
    /ch[a4]nge/i,
    /cnange/i,

    /qty/i,
    /produk/i,
    /item/i,
    /metode/i
  ]

  const nonTransactionKeywords = [
    /npwp/i,
    /np#p/i,
    /http/i,
    /https/i,
    /www/i,
    /\.com/i,
    /wifi/i,
    /wi-fi/i,
    /wl-fi/i,
    /w1-fi/i,
    /password/i,
    /username/i,
    /whatsapp/i,
    /whats-pp/i,
    /wa/i,
    /telepon/i,
    /phone/i,
    /order/i,
    /date/i,
    /tanggal/i,
    /tgl/i,
    /nota/i,
    /no\./i,
    /nomor/i,
    /voucher/i,
    /qr/i,
    /scan/i,
    /join/i,
    /komunitas/i,
    /alamat/i,
    /\bjl\b/i,
    /jalan/i,
    /rt/i,
    /rw/i,
    /kel\./i,
    /kec\./i,
    /kota/i,
    /lantai/i,
    /lantal/i,
    /plaza/i
  ]

  // 1. Prioritas tertinggi: Grand Total
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const hasStrongTotal = strongTotalKeywords.some(regex => regex.test(line))
    const shouldAvoid =
      avoidKeywords.some(regex => regex.test(line)) &&
      !/grand\s*total/i.test(line)

    if (!hasStrongTotal || shouldAvoid) continue

    const numbers = extractNumbersFromLine(line)

    if (numbers.length > 0) {
      return {
        amount: numbers[numbers.length - 1],
        confidence: 'high',
        matchedLine: line
      }
    }

    const nextLine = lines[i + 1] || ''
    const nextNumbers = extractNumbersFromLine(nextLine)

    if (nextNumbers.length > 0) {
      return {
        amount: nextNumbers[nextNumbers.length - 1],
        confidence: 'high',
        matchedLine: `${line} ${nextLine}`
      }
    }
  }

  // 2. Prioritas kedua: baris Total biasa
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const hasTotal = normalTotalKeywords.some(regex => regex.test(line))
    const shouldAvoid = avoidKeywords.some(regex => regex.test(line))
    const isNonTransaction = nonTransactionKeywords.some(regex => regex.test(line))

    if (!hasTotal || shouldAvoid || isNonTransaction) continue

    const numbers = extractNumbersFromLine(line)

    if (numbers.length > 0) {
      return {
        amount: numbers[numbers.length - 1],
        confidence: 'high',
        matchedLine: line
      }
    }

    const nextLine = lines[i + 1] || ''
    const nextLineIsBad =
      avoidKeywords.some(regex => regex.test(nextLine)) ||
      nonTransactionKeywords.some(regex => regex.test(nextLine))

    if (!nextLineIsBad) {
      const nextNumbers = extractNumbersFromLine(nextLine)

      if (nextNumbers.length > 0) {
        return {
          amount: nextNumbers[nextNumbers.length - 1],
          confidence: 'medium',
          matchedLine: `${line} ${nextLine}`
        }
      }
    }
  }

  // 3. Fallback: ambil kandidat angka dari baris transaksi,
  // tetapi abaikan baris bawah struk seperti NPWP, alamat, website, Wi-Fi, dan kontak.
  const transactionCandidates = []

  for (const line of lines) {
    const isNonTransaction = nonTransactionKeywords.some(regex => regex.test(line))
    const shouldAvoid = avoidKeywords.some(regex => regex.test(line))

    if (isNonTransaction || shouldAvoid) continue

    const numbers = extractNumbersFromLine(line)

    for (const amount of numbers) {
      if (amount >= 1000 && amount <= 2000000) {
        transactionCandidates.push({
          amount,
          line
        })
      }
    }
  }

  if (transactionCandidates.length === 0) {
    return {
      amount: null,
      confidence: 'low',
      matchedLine: null
    }
  }

  const biggest = transactionCandidates.reduce((max, item) => {
    return item.amount > max.amount ? item : max
  }, transactionCandidates[0])

  return {
    amount: biggest.amount,
    confidence: 'low',
    matchedLine: biggest.line
  }
}

function findSeparatedTotalPattern(lines) {
  for (let i = 0; i < lines.length; i++) {
    const line1 = lines[i] || ''
    const line2 = lines[i + 1] || ''
    const line3 = lines[i + 2] || ''

    const isTotalLine =
      /\bt[o0]t[a4]l\b/i.test(line1) ||
      /\btota[iIl1]\b/i.test(line1)

    const isCashLine =
      /cash/i.test(line2) ||
      /c[a4]sh/i.test(line2) ||
      /gash/i.test(line2) ||
      /casn/i.test(line2) ||
      /bayar/i.test(line2) ||
      /tunai/i.test(line2)

    const isChangeLine =
      /change/i.test(line3) ||
      /ch[a4]nge/i.test(line3) ||
      /cnange/i.test(line3) ||
      /kembali/i.test(line3) ||
      /kembalian/i.test(line3)

    if (!isTotalLine || !isCashLine || !isChangeLine) continue

    const numbersAfterLabels = []

    for (let j = i + 3; j < Math.min(lines.length, i + 12); j++) {
      const line = lines[j] || ''

      // Berhenti kalau sudah masuk bagian bawah struk
      if (
        /tax/i.test(line) ||
        /wifi/i.test(line) ||
        /wi-fi/i.test(line) ||
        /wl-fi/i.test(line) ||
        /w1-fi/i.test(line) ||
        /password/i.test(line) ||
        /username/i.test(line) ||
        /npwp/i.test(line) ||
        /np#p/i.test(line) ||
        /alamat/i.test(line) ||
        /plaza/i.test(line) ||
        /https/i.test(line) ||
        /http/i.test(line) ||
        /www/i.test(line)
      ) {
        break
      }

      const numbers = extractNumbersFromLine(line)

      for (const amount of numbers) {
        if (amount >= 100 && amount <= 2000000) {
          numbersAfterLabels.push({
            amount,
            line
          })
        }
      }

      if (numbersAfterLabels.length >= 3) break
    }

    if (numbersAfterLabels.length > 0) {
      return {
        amount: numbersAfterLabels[0].amount,
        confidence: 'high',
        matchedLine: `${line1} / ${line2} / ${line3} -> ${numbersAfterLabels[0].line}`
      }
    }
  }

  return null
}

function extractNumbersFromLine(text) {
  const moneyPattern =
    /(?:rp\.?\s*)?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\b\d{4,9}\b/gi

  const matches = text.match(moneyPattern) || []

  return matches
    .map(parseMoneyValue)
    .filter(amount => amount !== null && amount > 0)
}

function parseMoneyValue(rawValue) {
  if (!rawValue) return null

  let value = rawValue
    .toLowerCase()
    .replace(/rp/g, '')
    .replace(/idr/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d.,]/g, '')

  if (!value) return null

  // Format campuran Indonesia: 50.000,00
  if (value.includes('.') && value.includes(',')) {
    const lastDot = value.lastIndexOf('.')
    const lastComma = value.lastIndexOf(',')

    if (lastComma > lastDot) {
      // 50.000,00 -> 50000
      value = value.replace(/\./g, '').replace(/,\d{1,2}$/, '')
    } else {
      // 50,000.00 -> 50000
      value = value.replace(/,/g, '').replace(/\.\d{1,2}$/, '')
    }
  } else if (value.includes('.')) {
    // 50.000 -> 50000
    value = value.replace(/\./g, '')
  } else if (value.includes(',')) {
    const parts = value.split(',')
    const lastPart = parts[parts.length - 1]

    if (lastPart.length === 3) {
      // 50,000 -> 50000
      value = value.replace(/,/g, '')
    } else {
      // 50000,00 -> 50000
      value = parts[0]
    }
  }

  const amount = parseInt(value, 10)

  if (Number.isNaN(amount)) return null

  // Hindari angka kecil seperti jumlah item, nomor kasir, dan sebagainya
  if (amount < 100) return null

  return amount
}

module.exports = {
  analyzeReceiptImage,
  extractTotalFromText,
  detectTextWithOcrSpace,
  detectTextWithGoogleVision
}