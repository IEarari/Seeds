import admin, { firestore } from '../firebase/admin.js'

export async function writeAuditLog({ type, actorId, targetId = null, payload = {} }) {
  await firestore.collection('auditLogs').add({
    type,
    actorId,
    targetId,
    payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}
