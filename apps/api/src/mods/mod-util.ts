/** Turn HTML (CurseForge) or BBCode (Steam) into readable plain text for the
 *  mod detail view — we render it as text, never as markup, so it's XSS-safe. */
export function stripMarkup(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // strip HTML tags
    .replace(/\[\/?[^\]]{0,40}\]/g, "") // strip BBCode tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
