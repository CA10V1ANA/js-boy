/** Reads UTF-8 Java-style .properties files, including escapes and continued lines. */
export function parseProperties(source: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null) as Record<string, string>;
  const unescape = (value: string) => value.replace(/\\u([0-9a-fA-F]{4})|\\(.)/g, (_match, unicode: string | undefined, escaped: string | undefined) => {
    if (unicode) return String.fromCharCode(parseInt(unicode, 16));
    return escaped === 'n' ? '\n' : escaped === 'r' ? '\r' : escaped === 't' ? '\t' : escaped === 'f' ? '\f' : escaped ?? '';
  });
  let continued = '';
  for (const raw of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = continued + raw.trimStart();
    if (!continued && (!line || /^[#!]/.test(line))) continue;
    const trailingSlashes = line.match(/\\+$/)?.[0].length ?? 0;
    if (trailingSlashes % 2 === 1) { continued = line.slice(0, -1); continue; }
    continued = '';
    let separator = line.length;
    let escaped = false;
    for (let i = 0; i < line.length; i++) {
      if (!escaped && /[=:\s]/.test(line[i])) { separator = i; break; }
      escaped = !escaped && line[i] === '\\';
    }
    const key = unescape(line.slice(0, separator));
    const value = line.slice(separator).replace(/^\s*[=:]?\s*/, '');
    if (Object.prototype.hasOwnProperty.call(result, key)) throw new Error(`Duplicate message key: ${key}`);
    result[key] = unescape(value);
  }
  if (continued) throw new Error('Unterminated .properties continuation');
  return result;
}
