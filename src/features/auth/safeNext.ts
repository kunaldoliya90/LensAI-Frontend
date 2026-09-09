/**
 * `?next=` comes from the URL bar, so it is attacker-controlled. Only a
 * same-origin path is followed — `//evil.example.com` is a protocol-relative
 * URL and would leave the site.
 */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/app";
  return next;
}
