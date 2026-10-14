const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const HMAC: Record<string, string> = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };

/** True when `signature` is the HMAC (HS256/384/512) of `header.payload` under `secret`. Throws on an unsupported alg. */
export async function verifyHmac(raw: { header: string; payload: string; signature: string }, alg: string, secret: string): Promise<boolean> {
  const hash = HMAC[alg];
  if (!hash) throw new Error(`Unsupported algorithm: ${alg}`);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(`${raw.header}.${raw.payload}`))) === raw.signature;
}
