import { firebaseAuth } from '../firebase/client.js'

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})

  if (firebaseAuth.currentUser) {
    const token = await firebaseAuth.currentUser.getIdToken()
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(path, { ...options, headers })

  let data = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  }

  if (!res.ok) {
    const message = data?.message || 'حدث خطأ'
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
