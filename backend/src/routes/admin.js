import express from 'express'
import admin from '../firebase/admin.js'
import { firestore } from '../firebase/admin.js'
import { requireRoles } from '../middlewares/auth.js'
import { writeAuditLog } from '../services/auditLogs.js'

const router = express.Router()

const REVIEW_ROLES = ['review_admin', 'admin', 'super_admin']
const ADMIN_ROLES = ['admin', 'super_admin']

router.get('/admin/applications', requireRoles(REVIEW_ROLES), async (req, res) => {
  const status = (req.query.status || 'submitted').toString()
  const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100)
  const cursor = req.query.cursor ? req.query.cursor.toString() : null

  try {
    let q = firestore.collection('applications').orderBy('createdAt', 'desc').limit(limit)

    if (status) {
      q = q.where('status', '==', status)
    }

    if (cursor) {
      const cursorDoc = await firestore.doc(`applications/${cursor}`).get()
      if (cursorDoc.exists) q = q.startAfter(cursorDoc)
    }

    const snap = await q.get()
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null

    res.json({ items, nextCursor })
  } catch (e) {
    const msg = String(e?.message || '')
    const needsIndex = msg.toLowerCase().includes('requires an index') || msg.toLowerCase().includes('failed_precondition')

    if (!needsIndex) {
      console.error('admin/applications error:', e)
      return res.status(500).json({ message: 'حدث خطأ' })
    }

    try {
      const fetchLimit = Math.min(limit * 5, 500)
      let q2 = firestore.collection('applications').orderBy('createdAt', 'desc').limit(fetchLimit)

      if (cursor) {
        const cursorDoc = await firestore.doc(`applications/${cursor}`).get()
        if (cursorDoc.exists) q2 = q2.startAfter(cursorDoc)
      }

      const snap2 = await q2.get()
      const items2 = snap2.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => (status ? x.status === status : true))
        .slice(0, limit)

      const nextCursor = items2.length ? items2[items2.length - 1].id : null
      return res.json({ items: items2, nextCursor })
    } catch (e2) {
      console.error('admin/applications fallback error:', e2)
      return res.status(500).json({ message: 'يتطلب إنشاء فهرس (Index) في Firestore' })
    }
  }
})

router.get('/admin/applications/:id', requireRoles(REVIEW_ROLES), async (req, res) => {
  try {
    const snap = await firestore.doc(`applications/${req.params.id}`).get()
    if (!snap.exists) return res.status(404).json({ message: 'غير موجود' })

    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.post('/admin/applications/:id/approve', requireRoles(REVIEW_ROLES), async (req, res) => {
  const { reviewNotes = null } = req.body || {}
  const appId = req.params.id

  try {
    await firestore.runTransaction(async (tx) => {
      const appRef = firestore.doc(`applications/${appId}`)
      const appSnap = await tx.get(appRef)
      if (!appSnap.exists) throw new Error('NOT_FOUND')

      const appData = appSnap.data()
      if (appData.status !== 'submitted') throw new Error('INVALID_STATUS')

      const userId = appData.userId
      const userRef = firestore.doc(`users/${userId}`)

      tx.update(appRef, {
        status: 'approved',
        decisionAt: admin.firestore.FieldValue.serverTimestamp(),
        decisionBy: req.user.uid,
        reviewNotes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      tx.set(
        userRef,
        {
          role: 'volunteer',
          currentApplicationId: appId,
          currentApplicationStatus: 'approved',
        },
        { merge: true },
      )
    })

    await writeAuditLog({
      type: 'APP_DECISION',
      actorId: req.user.uid,
      targetId: appId,
      payload: { decision: 'approved' },
    })

    res.json({ ok: true })
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ message: 'غير موجود' })
    if (e.message === 'INVALID_STATUS') return res.status(400).json({ message: 'حالة غير صالحة' })
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.post('/admin/applications/:id/reject', requireRoles(REVIEW_ROLES), async (req, res) => {
  const { decisionReason, reviewNotes = null } = req.body || {}
  const appId = req.params.id

  if (!decisionReason) {
    return res.status(400).json({ message: 'سبب الرفض مطلوب' })
  }

  try {
    await firestore.runTransaction(async (tx) => {
      const appRef = firestore.doc(`applications/${appId}`)
      const appSnap = await tx.get(appRef)
      if (!appSnap.exists) throw new Error('NOT_FOUND')

      const appData = appSnap.data()
      if (appData.status !== 'submitted') throw new Error('INVALID_STATUS')

      tx.update(appRef, {
        status: 'rejected',
        decisionAt: admin.firestore.FieldValue.serverTimestamp(),
        decisionBy: req.user.uid,
        decisionReason,
        reviewNotes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const userId = appData.userId
      const userRef = firestore.doc(`users/${userId}`)
      tx.set(
        userRef,
        {
          currentApplicationId: appId,
          currentApplicationStatus: 'rejected',
        },
        { merge: true },
      )
    })

    await writeAuditLog({
      type: 'APP_DECISION',
      actorId: req.user.uid,
      targetId: appId,
      payload: { decision: 'rejected', decisionReason },
    })

    res.json({ ok: true })
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ message: 'غير موجود' })
    if (e.message === 'INVALID_STATUS') return res.status(400).json({ message: 'حالة غير صالحة' })
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.get('/admin/settings/volunteering', requireRoles(ADMIN_ROLES), async (req, res) => {
  try {
    const snap = await firestore.doc('settings/volunteering').get()
    
    if (!snap.exists) {
      return res.json({
        isApplicationOpen: false,
        openFrom: null,
        openTo: null,
      })
    }

    const data = snap.data()
    
    return res.json({
      isApplicationOpen: Boolean(data.isApplicationOpen),
      openFrom: data.openFrom ? data.openFrom.toDate().toISOString().split('T')[0] : null,
      openTo: data.openTo ? data.openTo.toDate().toISOString().split('T')[0] : null,
    })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.post('/admin/settings/volunteering', requireRoles(ADMIN_ROLES), async (req, res) => {
  const { isApplicationOpen, openFrom = null, openTo = null } = req.body || {}

  if (typeof isApplicationOpen !== 'boolean') {
    return res.status(400).json({ message: 'isApplicationOpen مطلوب' })
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const normalizeDate = (v) => {
    if (v === null || v === undefined || v === '') return null
    if (typeof v === 'string' && dateRegex.test(v)) {
      return admin.firestore.Timestamp.fromDate(new Date(`${v}T00:00:00.000Z`))
    }
    return v
  }

  try {
    await firestore.doc('settings/volunteering').set(
      {
        isApplicationOpen,
        openFrom: normalizeDate(openFrom),
        openTo: normalizeDate(openTo),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid,
      },
      { merge: true },
    )

    await writeAuditLog({
      type: 'SETTINGS_CHANGE',
      actorId: req.user.uid,
      targetId: 'settings/volunteering',
      payload: { isApplicationOpen, openFrom, openTo },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.post('/admin/roles/assign', requireRoles(ADMIN_ROLES), async (req, res) => {
  const { targetUserId, newRole } = req.body || {}
  const requesterRole = req.user.role

  if (!targetUserId || !newRole) {
    return res.status(400).json({ message: 'بيانات ناقصة' })
  }

  if (requesterRole === 'admin' && newRole === 'super_admin') {
    return res.status(403).json({ message: 'غير مسموح' })
  }

  try {
    await firestore.doc(`users/${targetUserId}`).set({ role: newRole }, { merge: true })

    await writeAuditLog({
      type: 'ROLE_ASSIGN',
      actorId: req.user.uid,
      targetId: targetUserId,
      payload: { newRole },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

export default router
