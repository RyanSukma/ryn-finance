const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL atau SUPABASE_KEY belum diatur.')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: WebSocket
  }
})

module.exports = supabase