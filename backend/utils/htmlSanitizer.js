/**
 * HTML Sanitization Utility
 * Hardened, zero-dependency protection against Stored Cross-Site Scripting (XSS),
 * malicious event handlers, and script injection in user-authored notes and HTML slide presentations.
 */

// Tags that can execute active code or embed untrusted external contexts
const DANGEROUS_TAG_PATTERNS = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /<script\b[^>]*\/?>/gi,
    /<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi,
    /<foreignObject\b[^>]*\/?>/gi,
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    /<iframe\b[^>]*\/?>/gi,
    /<embed\b[^>]*\/?>/gi,
    /<object\b[^>]*>[\s\S]*?<\/object>/gi,
    /<object\b[^>]*\/?>/gi,
    /<applet\b[^>]*>[\s\S]*?<\/applet>/gi,
    /<base\b[^>]*\/?>/gi,
    /<meta\b[^>]*\/?>/gi,
];

// Event handler attributes that execute inline JavaScript (e.g. onload, onerror, onclick, onmouseover)
const EVENT_HANDLER_PATTERN = /\s+on[a-z0-9_-]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

/**
 * Normalizes an attribute value to detect obfuscated 'javascript:' or 'data:' schemes.
 * Decodes HTML entities and strips invisible control characters and whitespace.
 */
function normalizeUriValue(value) {
    if (!value) return '';
    return value
        .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#([0-9]+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/[\x00-\x20\s\u200B-\u200D\uFEFF]+/g, '')
        .toLowerCase();
}

/**
 * Checks if a URI string starts with an executable pseudo-protocol.
 */
function isDangerousUri(uri) {
    const normalized = normalizeUriValue(uri);
    return (
        normalized.startsWith('javascript:') ||
        normalized.startsWith('vbscript:') ||
        normalized.startsWith('data:text/html') ||
        normalized.startsWith('data:text/javascript') ||
        normalized.startsWith('data:application/javascript')
    );
}

/**
 * Sanitizes rich text or HTML note content by stripping active scripts,
 * event handlers, and executable URI protocols while preserving legitimate
 * document formatting (headings, paragraphs, lists, bold, colors, tables, and images).
 *
 * @param {string} input - Raw HTML content
 * @returns {string} Clean, safe HTML content
 */
function sanitizeNoteHtml(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input;

    // 1. Strip all dangerous executable tags
    for (const pattern of DANGEROUS_TAG_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // 2. Strip all inline event handlers (onload, onerror, onclick, etc.)
    sanitized = sanitized.replace(EVENT_HANDLER_PATTERN, '');

    // 3. Strip dangerous executable URIs from href, src, action, and xlink:href attributes
    const uriAttrPattern = /\s+(?:href|src|action|xlink:href)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+))/gi;
    sanitized = sanitized.replace(uriAttrPattern, (fullMatch, v1, v2, v3) => {
        const val = v1 || v2 || v3 || '';
        if (isDangerousUri(val)) {
            return ''; // Strip the attribute entirely
        }
        return fullMatch;
    });

    return sanitized;
}

module.exports = {
    sanitizeNoteHtml,
    isDangerousUri,
};
