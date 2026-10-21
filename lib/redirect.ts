// Cuma izinkan path relatif di app ini, biar ?next= nggak bisa dipakai buat open redirect.
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
