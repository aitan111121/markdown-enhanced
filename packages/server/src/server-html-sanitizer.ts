const URL_ATTRIBUTE_PATTERN = /\s+(href|src|poster|action|formaction|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const SRCSET_ATTRIBUTE_PATTERN = /\s+srcset\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

export function sanitizeServerHtml(html: string): string {
  return stripUnsafeUrlAttributes(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|applet)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(?:iframe|object|embed|applet|link|base|meta)\b[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ""));
}

function stripUnsafeUrlAttributes(html: string): string {
  return html
    .replace(URL_ATTRIBUTE_PATTERN, (match, _attribute: string, rawValue: string) => (
      isUnsafeUrl(unwrapAttributeValue(rawValue)) ? "" : match
    ))
    .replace(SRCSET_ATTRIBUTE_PATTERN, (match, rawValue: string) => {
      const value = unwrapAttributeValue(rawValue);
      const hasUnsafeCandidate = value
        .split(",")
        .some((candidate) => isUnsafeUrl(candidate.trim().split(/\s+/)[0] ?? ""));

      return hasUnsafeCandidate ? "" : match;
    });
}

function unwrapAttributeValue(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function isUnsafeUrl(value: string): boolean {
  const trimmed = decodeHtmlEntities(value).trim();
  const normalized = trimmed.toLowerCase().replace(/[\u0000-\u0020]+/g, "");

  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("file:") ||
    normalized.startsWith("//") ||
    normalized.startsWith("\\\\") ||
    /^[a-z]:[\\/]/i.test(trimmed)
  );
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(x[0-9a-f]+|\d+);?/gi, (_match, code: string) => decodeNumericEntity(code))
    .replace(/&(colon|sol|bsol|tab|newline);?/gi, (_match, entity: string) => {
      if (entity.toLowerCase() === "colon") {
        return ":";
      }

      if (entity.toLowerCase() === "sol") {
        return "/";
      }

      if (entity.toLowerCase() === "bsol") {
        return "\\";
      }

      return entity.toLowerCase() === "tab" ? "\t" : "\n";
    });
}

function decodeNumericEntity(code: string): string {
  const radix = code.toLowerCase().startsWith("x") ? 16 : 10;
  const value = Number.parseInt(radix === 16 ? code.slice(1) : code, radix);

  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) {
    return "";
  }

  return String.fromCodePoint(value);
}