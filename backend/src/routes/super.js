import express from 'express'
import admin from '../firebase/admin.js'
import { firestore } from '../firebase/admin.js'
import { requireRoles } from '../middlewares/auth.js'
import { writeAuditLog } from '../services/auditLogs.js'

const router = express.Router()

router.get('/super/menus', requireRoles(['super_admin']), async (req, res) => {
  try {
    const snap = await firestore.collection('menus').get()
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    res.json({ items })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.get('/super/menus/:name', requireRoles(['super_admin']), async (req, res) => {
  try {
    const snap = await firestore.doc(`menus/${req.params.name}`).get()
    if (!snap.exists) return res.status(404).json({ message: 'غير موجود' })
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.post('/super/menus/:name', requireRoles(['super_admin']), async (req, res) => {
  const { items } = req.body || {}

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: 'items مطلوبة' })
  }

  try {
    await firestore.doc(`menus/${req.params.name}`).set(
      {
        name: req.params.name,
        items,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid,
      },
      { merge: true },
    )

    await writeAuditLog({
      type: 'MENU_CHANGE',
      actorId: req.user.uid,
      targetId: `menus/${req.params.name}`,
      payload: { itemsCount: items.length },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.post('/super/menus/:name/items', requireRoles(['super_admin']), async (req, res) => {
  const { item } = req.body || {}

  if (!item || typeof item !== 'string') {
    return res.status(400).json({ message: 'item مطلوبة' })
  }

  try {
    const docRef = firestore.doc(`menus/${req.params.name}`)
    const snap = await docRef.get()
    
    if (!snap.exists) {
      return res.status(404).json({ message: 'القائمة غير موجودة' })
    }

    const data = snap.data()
    const items = Array.isArray(data.items) ? [...data.items] : []
    
    // Avoid duplicates
    if (!items.includes(item)) {
      items.push(item)
    }

    await docRef.update({
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid,
    })

    await writeAuditLog({
      type: 'MENU_ITEM_ADD',
      actorId: req.user.uid,
      targetId: `menus/${req.params.name}`,
      payload: { item },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

router.delete('/super/menus/:name/items', requireRoles(['super_admin']), async (req, res) => {
  const { item } = req.body || {}

  if (!item || typeof item !== 'string') {
    return res.status(400).json({ message: 'item مطلوبة' })
  }

  try {
    const docRef = firestore.doc(`menus/${req.params.name}`)
    const snap = await docRef.get()
    
    if (!snap.exists) {
      return res.status(404).json({ message: 'القائمة غير موجودة' })
    }

    const data = snap.data()
    const items = Array.isArray(data.items) ? data.items.filter(i => i !== item) : []

    await docRef.update({
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid,
    })

    await writeAuditLog({
      type: 'MENU_ITEM_DELETE',
      actorId: req.user.uid,
      targetId: `menus/${req.params.name}`,
      payload: { item },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

export default router
