/**
 * Utility for persisting form drafts and offline actions in localStorage.
 * Ensures users and admins never lose typed information if backend fails or connection drops.
 */

const DRAFT_PREFIX = 'form_draft_'
const PENDING_QUEUE_KEY = 'offline_pending_actions'

/**
 * Saves form data as a draft in localStorage.
 * @param {string} key Unique draft key (e.g. 'customer_add', 'daily_milk_entry')
 * @param {any} data Form data object or array
 */
export function saveDraft(key, data) {
  if (!key) return
  try {
    const payload = {
      data,
      savedAt: new Date().toISOString(),
      timestamp: Date.now(),
    }
    localStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify(payload))
  } catch (err) {
    console.warn(`[DraftStorage] Failed to save draft for ${key}:`, err)
  }
}

/**
 * Retrieves a draft from localStorage.
 * @param {string} key Unique draft key
 * @returns {any|null} The saved form data or null
 */
export function getDraft(key) {
  if (!key) return null
  try {
    const item = localStorage.getItem(`${DRAFT_PREFIX}${key}`)
    if (!item) return null
    const parsed = JSON.parse(item)
    return parsed?.data ?? null
  } catch (err) {
    console.error(`[DraftStorage] Failed to parse draft for ${key}:`, err)
    return null
  }
}

/**
 * Retrieves draft data along with metadata (savedAt timestamp).
 * @param {string} key Unique draft key
 * @returns {{ data: any, savedAt: string, timestamp: number }|null}
 */
export function getDraftDetails(key) {
  if (!key) return null
  try {
    const item = localStorage.getItem(`${DRAFT_PREFIX}${key}`)
    if (!item) return null
    return JSON.parse(item)
  } catch (err) {
    return null
  }
}

/**
 * Checks if a non-empty draft exists for a given key.
 * @param {string} key Unique draft key
 * @returns {boolean}
 */
export function hasDraft(key) {
  const data = getDraft(key)
  if (!data) return false
  if (typeof data === 'object') {
    return Object.values(data).some((val) => val !== null && val !== undefined && val !== '')
  }
  return true
}

/**
 * Removes a draft from localStorage once successfully submitted to backend.
 * @param {string} key Unique draft key
 */
export function clearDraft(key) {
  if (!key) return
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${key}`)
  } catch (err) {
    console.warn(`[DraftStorage] Failed to clear draft for ${key}:`, err)
  }
}

/**
 * Saves a failed mutation (POST/PUT/DELETE) into an offline queue for review or sync.
 */
export function queueOfflineAction(action) {
  try {
    const queue = getOfflineQueue()
    const item = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action: action.action || 'MUTATION',
      endpoint: action.endpoint,
      method: action.method || 'POST',
      payload: action.payload,
      description: action.description || 'Pending action',
      createdAt: new Date().toISOString(),
    }
    queue.push(item)
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue))
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: queue.length } }))
    return item
  } catch (err) {
    console.error('[DraftStorage] Failed to queue offline action:', err)
    return null
  }
}

/**
 * Returns all queued offline actions.
 */
export function getOfflineQueue() {
  try {
    const item = localStorage.getItem(PENDING_QUEUE_KEY)
    return item ? JSON.parse(item) : []
  } catch (e) {
    return []
  }
}

/**
 * Removes a queued item once synced.
 */
export function removeOfflineAction(id) {
  try {
    const queue = getOfflineQueue().filter((item) => item.id !== id)
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue))
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: queue.length } }))
  } catch (err) {}
}

/**
 * Clears the entire offline queue.
 */
export function clearOfflineQueue() {
  try {
    localStorage.removeItem(PENDING_QUEUE_KEY)
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: 0 } }))
  } catch (err) {}
}

