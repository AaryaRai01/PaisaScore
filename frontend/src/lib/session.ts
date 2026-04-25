// Lightweight session management via localStorage (no JWT needed for portfolio demo)

export type UserRole = "user" | "officer";

export interface Session {
  role: UserRole;
  id?: number;          // Generic ID for current user/officer
  applicantId?: number; // Legacy, keeping for compatibility
  applicantName?: string;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("paisascore_session");
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem("paisascore_session", JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem("paisascore_session");
}
