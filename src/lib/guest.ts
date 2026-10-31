import { cookies } from "next/headers";
import { GUEST_COOKIE, readGuestToken } from "./guest-token";
import type { SocketIdentity } from "./socket-token";

// L'invité de cette requête, s'il a un cookie valide (AUTH-02).
export async function getGuest(): Promise<SocketIdentity | null> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  return readGuestToken(token, process.env.AUTH_SECRET ?? "");
}
