import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../firebase/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userDocLoading, setUserDocLoading] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(firebaseAuth, (u) => {
      setAuthUser(u)
      setLoading(false)
    })

    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!authUser) {
      setUserDoc(null)
      setUserDocLoading(false)
      return
    }

    setUserDocLoading(true)

    const ref = doc(firestoreDb, 'users', authUser.uid)

    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        await setDoc(
          ref,
          {
            email: authUser.email || null,
            role: 'applicant',
            createdAt: serverTimestamp(),
            isActive: true,
            currentApplicationId: null,
            currentApplicationStatus: null,
            lastApplicationVersion: 0,
            profileSummary: {
              fullNameAr: null,
              mobile: null,
              whatsappE164: null,
            },
          },
          { merge: true },
        )

        setUserDoc({
          id: authUser.uid,
          email: authUser.email || null,
          role: 'applicant',
          isActive: true,
          currentApplicationId: null,
          currentApplicationStatus: null,
          lastApplicationVersion: 0,
          profileSummary: {
            fullNameAr: null,
            mobile: null,
            whatsappE164: null,
          },
        })
        setUserDocLoading(false)
        return
      }

      setUserDoc({ id: snap.id, ...snap.data() })
      setUserDocLoading(false)
    })

    return () => unsub()
  }, [authUser])

  const value = useMemo(() => {
    const role = userDoc?.role || null

    return {
      loading,
      userDocLoading,
      authUser,
      userDoc,
      role,
      async login(email, password) {
        return signInWithEmailAndPassword(firebaseAuth, email, password)
      },
      async register(email, password) {
        return createUserWithEmailAndPassword(firebaseAuth, email, password)
      },
      async logout() {
        return signOut(firebaseAuth)
      },
      async getIdToken() {
        if (!firebaseAuth.currentUser) return null
        return firebaseAuth.currentUser.getIdToken()
      },
    }
  }, [authUser, loading, userDoc, userDocLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider is missing')
  return ctx
}
