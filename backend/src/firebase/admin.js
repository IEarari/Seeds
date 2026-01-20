import admin from 'firebase-admin'
import fs from 'node:fs'

const projectId = process.env.FIREBASE_PROJECT_ID || undefined

function init() {
  if (admin.apps.length) return admin

  const credsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  if (!credsPath) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    })

    return admin
  }

  const raw = fs.readFileSync(credsPath, 'utf8')
  const serviceAccount = JSON.parse(raw)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
  })

  return admin
}

init()

export const firestore = admin.firestore()
export const auth = admin.auth()
export default admin
