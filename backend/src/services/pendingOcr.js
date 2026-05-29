const store = new Map()

const TTL_MS = 15 * 60 * 1000 // 15 menit

function setPending(id, data) {
  store.set(id, {
    ...data,
    expires_at: Date.now() + TTL_MS
  })
}

function getPending(id) {
  const item = store.get(id)

  if (!item) return null

  if (Date.now() > item.expires_at) {
    store.delete(id)
    return null
  }

  return item
}

function deletePending(id) {
  store.delete(id)
}

module.exports = {
  setPending,
  getPending,
  deletePending
}
