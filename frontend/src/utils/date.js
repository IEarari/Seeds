export function formatDateYYYYMMDD(value) {
  if (!value) return ''

  const d = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  return d.toISOString().slice(0, 10)
}
