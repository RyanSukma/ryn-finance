const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const supabase = require('../db/supabase')

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID').format(amount || 0)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderReportHtml(reportData) {
  const templatePath = path.join(__dirname, '..', 'templates', 'report.html')
  let html = fs.readFileSync(templatePath, 'utf-8')

  const {
    userName,
    periodLabel,
    totalAmount,
    transactionCount,
    averageAmount,
    transactions
  } = reportData

  const transactionRows = transactions.length > 0
    ? transactions.map(item => {
        return `
          <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.source)}</td>
            <td class="right">Rp ${formatRupiah(item.amount)}</td>
          </tr>
        `
      }).join('')
    : `
      <tr>
        <td colspan="4" class="empty">Tidak ada transaksi pada periode ini.</td>
      </tr>
    `

  html = html
    .replace('{{userName}}', escapeHtml(userName))
    .replace('{{periodLabel}}', escapeHtml(periodLabel))
    .replace('{{totalAmount}}', formatRupiah(totalAmount))
    .replace('{{transactionCount}}', transactionCount)
    .replace('{{averageAmount}}', formatRupiah(averageAmount))
    .replace('{{transactionRows}}', transactionRows)

  return html
}

async function generatePDF(reportData) {
  const html = renderReportHtml(reportData)

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '16mm',
        right: '12mm',
        bottom: '16mm',
        left: '12mm'
      }
    })

    return pdfBuffer
  } finally {
    await browser.close()
  }
}

async function uploadPDFToStorage(pdfBuffer, filename) {
  const filePath = `monthly/${filename}`

  const { error } = await supabase.storage
    .from('reports')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (error) {
    throw new Error(`Gagal upload PDF ke Supabase Storage: ${error.message}`)
  }

  const { data } = supabase.storage
    .from('reports')
    .getPublicUrl(filePath)

  return data.publicUrl
}

module.exports = {
  generatePDF,
  uploadPDFToStorage,
  renderReportHtml
}