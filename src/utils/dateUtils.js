/**
 * Date formatting utilities for Milk Management System.
 * Strict standard: Date Month Year (dd-MM-yyyy).
 */

export function formatDateDMY(dateInput) {
  if (!dateInput) return '-'
  try {
    // If it's already in dd-MM-yyyy format
    if (typeof dateInput === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
      return dateInput
    }

    // If it's in yyyy-MM-dd format
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      const parts = dateInput.split('T')[0].split('-')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    }

    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return String(dateInput)

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  } catch (e) {
    return String(dateInput)
  }
}

export function formatDateTimeDMY(dateInput) {
  if (!dateInput) return '-'
  try {
    // If it's already in dd-MM-yyyy HH:mm:ss format
    if (typeof dateInput === 'string' && /^\d{2}-\d{2}-\d{4}/.test(dateInput)) {
      return dateInput
    }

    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return String(dateInput)

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
  } catch (e) {
    return String(dateInput)
  }
}
