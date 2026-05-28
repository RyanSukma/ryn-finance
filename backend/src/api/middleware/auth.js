
require('dotenv').config()

module.exports = function apiAuth(req, res, next) {
  const expectedKey = process.env.DASHBOARD_API_KEY

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'DASHBOARD_API_KEY belum diatur di environment.'
    })
  }

  const apiKeyFromHeader = req.headers['x-api-key']
  const authorizationHeader = req.headers.authorization

  let token = apiKeyFromHeader

  if (!token && authorizationHeader?.startsWith('Bearer ')) {
    token = authorizationHeader.replace('Bearer ', '')
  }

  if (!token || token !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. API key tidak valid.'
    })
  }

  next()
}