import { auth, firestore } from '../firebase/admin.js'

export async function verifyFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const match = header.match(/^Bearer\s+(.+)$/i)

    if (!match) {
      return res.status(401).json({ message: 'غير مصرح' })
    }

    const idToken = match[1]
    const decoded = await auth.verifyIdToken(idToken)

    const uid = decoded.uid
    const userSnap = await firestore.doc(`users/${uid}`).get()
    const userData = userSnap.exists ? userSnap.data() : null

    req.user = {
      uid,
      email: decoded.email || null,
      role: userData?.role || 'applicant',
    }

    next()
  } catch (err) {
    return res.status(401).json({ message: 'غير مصرح' })
  }
}

export function requireRoles(roles) {
  return (req, res, next) => {
    const role = req.user?.role

    if (!role) {
      return res.status(401).json({ message: 'غير مصرح' })
    }

    if (!roles.length || roles.includes(role)) {
      return next()
    }

    return res.status(403).json({ message: 'غير مسموح' })
  }
}
