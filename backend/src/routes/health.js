import express from 'express'
import { firestore } from '../firebase/admin.js'

const router = express.Router()

router.get('/health', (req, res) => {
  res.json({ ok: true })
})

// Public endpoint for reading volunteering settings (no auth required)
router.get('/public/settings/volunteering', async (req, res) => {
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

// Public endpoint for reading all menus (no auth required)
router.get('/public/menus', async (req, res) => {
  try {
    const snap = await firestore.collection('menus').get()
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    res.json({ items })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

// Public endpoint for reading specific menu (no auth required)
router.get('/public/menus/:name', async (req, res) => {
  try {
    const snap = await firestore.doc(`menus/${req.params.name}`).get()
    if (!snap.exists) return res.status(404).json({ message: 'غير موجود' })
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ message: 'حدث خطأ' })
  }
})

export default router
