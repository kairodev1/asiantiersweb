import { cookies } from "next/headers";
import { ADMIN_COOKIE, SESSION_TTL_SECONDS, createSessionToken, isValidToken, verifyPassword } from "./session";


export { ADMIN_COOKIE, verifyPassword };

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(ADMIN_COOKIE)?.value);
}

export async function setSessionCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
