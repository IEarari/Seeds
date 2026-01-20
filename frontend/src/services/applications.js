import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { firestoreDb } from '../firebase/client.js'

const ACTIVE_STATUSES = ['draft', 'submitted']

export async function getApplicationById(id) {
  const ref = doc(firestoreDb, 'applications', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function ensureDraftApplication({ uid }) {
  const settingsRef = doc(firestoreDb, 'settings', 'volunteering')
  const userRef = doc(firestoreDb, 'users', uid)

  return runTransaction(firestoreDb, async (tx) => {
    const settingsSnap = await tx.get(settingsRef)
    const isOpen = Boolean(settingsSnap.exists() ? settingsSnap.data()?.isApplicationOpen : false)
    if (!isOpen) throw new Error('CLOSED')

    const userSnap = await tx.get(userRef)
    const userData = userSnap.exists() ? userSnap.data() : null

    const currentId = userData?.currentApplicationId || null
    const currentStatus = userData?.currentApplicationStatus || null

    if (currentId && ACTIVE_STATUSES.includes(currentStatus)) {
      return { applicationId: currentId, created: false }
    }

    const lastVersion = Number(userData?.lastApplicationVersion || 0)
    const nextVersion = lastVersion + 1

    const appRef = doc(collection(firestoreDb, 'applications'))

    tx.set(appRef, {
      userId: uid,
      status: 'draft',
      version: nextVersion,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      submittedAt: null,
      decisionAt: null,
      decisionBy: null,
      decisionReason: null,
      reviewNotes: null,
      profile: {
        firstName: '',
        fatherName: '',
        grandFatherName: '',
        lastName: '',
        nationalId: '',
        dateOfBirth: '',
        mobile: '',
        whatsappE164: '',
        facebookId: null,
        instagramId: null,
        emergencyPhone: '',
        referees: [
          { name: '', phone: '' },
          { name: '', phone: '' },
        ],
        educationLevel: '',
        educationPlace: '',
      },
    })

    tx.set(
      userRef,
      {
        currentApplicationId: appRef.id,
        currentApplicationStatus: 'draft',
        lastApplicationVersion: nextVersion,
      },
      { merge: true },
    )

    return { applicationId: appRef.id, created: true }
  })
}

export async function saveDraft({ uid, applicationId, profile }) {
  const appRef = doc(firestoreDb, 'applications', applicationId)
  await runTransaction(firestoreDb, async (tx) => {
    const snap = await tx.get(appRef)
    if (!snap.exists()) throw new Error('NOT_FOUND')
    const data = snap.data()
    if (data.userId !== uid) throw new Error('FORBIDDEN')
    if (data.status !== 'draft') throw new Error('INVALID_STATUS')

    tx.update(appRef, {
      profile,
      updatedAt: serverTimestamp(),
    })
  })
}

function validateProfile(profile) {
  const required = [
    'firstName',
    'fatherName',
    'grandFatherName',
    'lastName',
    'nationalId',
    'dateOfBirth',
    'mobile',
    'whatsappE164',
    'emergencyPhone',
    'educationLevel',
    'educationPlace',
  ]

  for (const k of required) {
    if (!profile?.[k]) return `الحقل مطلوب: ${k}`
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)) return 'تاريخ الميلاد غير صحيح (YYYY-MM-DD)'

  if (!/^\+\d{8,15}$/.test(profile.whatsappE164)) return 'رقم واتساب غير صحيح (E.164)'

  if (!Array.isArray(profile.referees) || profile.referees.length !== 2) return 'يجب إدخال معرفين عدد 2'

  for (let i = 0; i < 2; i++) {
    const r = profile.referees[i]
    if (!r?.name || !r?.phone) return 'بيانات المعرفين ناقصة'
  }

  return null
}

export async function submitApplication({ uid, applicationId, profile }) {
  const settingsRef = doc(firestoreDb, 'settings', 'volunteering')
  const appRef = doc(firestoreDb, 'applications', applicationId)
  const userRef = doc(firestoreDb, 'users', uid)

  const err = validateProfile(profile)
  if (err) throw new Error(err)

  await runTransaction(firestoreDb, async (tx) => {
    const settingsSnap = await tx.get(settingsRef)
    const isOpen = Boolean(settingsSnap.exists() ? settingsSnap.data()?.isApplicationOpen : false)
    if (!isOpen) throw new Error('CLOSED')

    const appSnap = await tx.get(appRef)
    if (!appSnap.exists()) throw new Error('NOT_FOUND')
    const appData = appSnap.data()
    if (appData.userId !== uid) throw new Error('FORBIDDEN')
    if (appData.status !== 'draft') throw new Error('INVALID_STATUS')

    tx.update(appRef, {
      profile,
      status: 'submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const fullNameAr = `${profile.firstName} ${profile.fatherName} ${profile.grandFatherName} ${profile.lastName}`

    tx.set(
      userRef,
      {
        currentApplicationId: applicationId,
        currentApplicationStatus: 'submitted',
        profileSummary: {
          fullNameAr,
          mobile: profile.mobile,
          whatsappE164: profile.whatsappE164,
        },
      },
      { merge: true },
    )
  })
}
