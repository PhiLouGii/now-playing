import type { NextFunction, Request, Response } from 'express'
import { getAuth } from 'firebase-admin/auth'

export interface AuthenticatedRequest
  extends Request {
  user?: {
    uid: string
    email?: string
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const idToken =
      authHeader.substring('Bearer '.length)

    const decodedToken =
      await getAuth().verifyIdToken(idToken)

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    }

    console.log(
      'AUTHENTICATED REQUEST:',
      decodedToken.uid,
    )

    next()
  } catch (error) {
    console.error(
      'AUTHENTICATION ERROR:',
      error,
    )

    return res.status(401).json({
      error: 'Invalid or expired authentication token',
    })
  }
}