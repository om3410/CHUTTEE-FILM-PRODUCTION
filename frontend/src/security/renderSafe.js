// RenderSafe — sanitize LLM output before rendering
// Prevents XSS and malicious HTML injection

const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'link', 'style', 'meta'];
const DANGEROUS_ATTRS = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'];
const JS_PROTOCOL = /^\s*javascript:/i;
const DATA_PROTOCOL = /^\s*data:(?!image\/)/i;

export function sanitize(html = '') {
  if (typeof html !== 'string') return '';

  // 1. Strip script tags and their contents
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Strip dangerous tags
  DANGEROUS_TAGS.forEach((tag) => {
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*>.*?</${tag}>`, 'gis'), '');
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gis'), '');
  });

  // 3. Strip dangerous attributes
  DANGEROUS_ATTRS.forEach((attr) => {
    clean = clean.replace(new RegExp(`\\s${attr}\\s*=\\s*(['"]?)[^'"]*\\1`, 'gi'), '');
  });

  // 4. Block javascript: and data: URIs
  clean = clean.replace(/href\s*=\s*["']([^"']*)["']/gi, (m, url) => {
    if (JS_PROTOCOL.test(url) || DATA_PROTOCOL.test(url)) return 'href="#"';
    return m;
  });

  clean = clean.replace(/src\s*=\s*["']([^"']*)["']/gi, (m, url) => {
    if (JS_PROTOCOL.test(url) || DATA_PROTOCOL.test(url)) return 'src=""';
    return m;
  });

  return clean;
}

export function safeMarkdown(md = '') {
  // Simple markdown → safe HTML (bold, italic, code, links)
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-zinc-800 px-1 py-0.5 text-xs">$1</code>')
    .replace(/\n/g, '<br/>');

  html = sanitize(html);
  return html;
}