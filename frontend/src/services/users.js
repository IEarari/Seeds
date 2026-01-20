import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { firestoreDb } from '../firebase/client.js'

export async function listUsersForAdmin(limitCount = 50) {
  const usersCol = collection(firestoreDb, 'users')
  const q = query(usersCol, orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}
