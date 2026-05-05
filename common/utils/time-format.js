export function parseTimeValue(value = '') {
  if (!value) return null
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const text = String(value).trim()
  if (!text) return null
  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) return date
  const numeric = Number(text)
  if (!Number.isNaN(numeric)) {
    const nextDate = new Date(numeric)
    return Number.isNaN(nextDate.getTime()) ? null : nextDate
  }
  return null
}

export function formatMessageTime(value = '') {
  const date = parseTimeValue(value)
  if (!date) return ''
  const now = new Date()
  const sameYear = now.getFullYear() === date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return sameYear
    ? `${month}-${day} ${hour}:${minute}`
    : `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`
}

export function formatDateTime(value = '', options = {}) {
  const date = parseTimeValue(value)
  if (!date) return options.fallback || ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  const second = `${date.getSeconds()}`.padStart(2, '0')
  if (options.withSeconds) {
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }
  return `${year}-${month}-${day} ${hour}:${minute}`
}
