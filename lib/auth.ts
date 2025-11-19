
import { NextRequest } from 'next/server';

export interface SessionData {
  userId: number;
  email: string;
}

export function getSessionFromCookie(request: NextRequest): SessionData | null {
  try {
    const cookieValue = request.cookies.get('simavi-auth')?.value;
    if (!cookieValue) return null;

    const sessionData = JSON.parse(cookieValue) as SessionData;
    
    if (!sessionData.userId || !sessionData.email) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Fehler beim Parsen der Session:', error);
    return null;
  }
}
