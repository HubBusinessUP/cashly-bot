import type { VercelRequest } from '@vercel/node'
import { adminAuth } from './firebaseAdmin'

export class UnauthorizedError extends Error {}

/** Verifies the Firebase ID token from the Authorization header and returns the caller's uid. */
export async function requireUid(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token')
  }
  const token = header.slice('Bearer '.length)
  try {
    const decoded = await adminAuth().verifyIdToken(token)
    return decoded.uid
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
