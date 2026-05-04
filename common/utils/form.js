export function collectMissingFields(fields = []) {
  return fields.filter((field) => {
    if (!field) return false
    const value = field.getter ? field.getter() : field.value
    if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
      return true
    }
    if (typeof field.validate === 'function' && !field.validate(value)) {
      return true
    }
    return false
  })
}

export function buildFieldHint(missingFields = []) {
  const labels = missingFields.map((field) => field.label).filter(Boolean)
  return labels.length ? `请补充：${labels.join('、')}` : ''
}

export function isFutureDate(dateValue = '') {
  if (!dateValue) return false
  const selected = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(selected.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selected >= today
}

export function normalizeTimeValue(value = '') {
  const match = String(value || '').match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}
