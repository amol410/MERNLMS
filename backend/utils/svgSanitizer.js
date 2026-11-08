/**
 * SVG Sanitization & Validation Utility
 * Defense-in-depth protection against Stored Cross-Site Scripting (XSS),
 * XXE (XML External Entity) attacks, and malicious script execution in SVG uploads.
 */

// Tags that can execute active code or embed external untrusted contexts
const DANGEROUS_TAG_PATTERNS = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /<script\b[^>]*\/?>/gi,
    /<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi,
    /<foreignObject\b[^>]*\/?>/gi,
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    /<iframe\b[^>]*\/?>/gi,
    /<embed\b[^>]*>[\s\S]*?<\/embed>/gi,
    /<embed\b[^>]*\/?>/gi,
    /<object\b[^>]*>[\s\S]*?<\/object>/gi,
    /<object\b[^>]*\/?>/gi,
    /<audio\b[^>]*>[\s\S]*?<\/audio>/gi,
    /<video\b[^>]*>[\s\S]*?<\/video>/gi,
    /<meta\b[^>]*\/?>/gi,
    /<link\b[^>]*\/?>/gi,
    /<base\b[^>]*\/?>/gi,
    /<applet\b[^>]*>[\s\S]*?<\/applet>/gi,
];

// Dangerous attributes that execute JavaScript event handlers
const EVENT_HANDLER_PATTERN = /\s+on[a-z0-9_-]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

// XXE / DTD entity declaration patterns
const DTD_ENTITY_PATTERN = /<!(?:DOCTYPE|ENTITY)[^>]*\[[\s\S]*?\]>/gi;
const ENTITY_DECL_PATTERN = /<!ENTITY\b[^>]*>/gi;

/**
 * Normalizes an attribute value to detect obfuscated 'javascript:' or 'data:' pseudoprotocols.
 * Decodes HTML entities and strips invisible / whitespace characters.
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
 * Checks if a URI string starts with a dangerous executable scheme.
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
 * Inspects and sanitizes SVG content.
 * 
 * @param {string|Buffer} input - Raw SVG content
 * @returns {{
 *   isValid: boolean,
 *   isClean: boolean,
 *   hasMalicious: boolean,
 *   detectedThreats: string[],
 *   cleanSvg: string,
 *   error: string|null
 * }}
 */
function sanitizeSvgContent(input) {
    if (!input) {
        return {
            isValid: false,
            isClean: false,
            hasMalicious: false,
            detectedThreats: ['empty-input'],
            cleanSvg: '',
            error: 'No SVG content provided',
        };
    }

    const rawSvg = typeof input === 'string' ? input : input.toString('utf8');
    const detectedThreats = [];

    // 1. Verify basic SVG syntax
    const hasSvgTag = /<svg\b[^>]*>/i.test(rawSvg);
    if (!hasSvgTag) {
        return {
            isValid: false,
            isClean: false,
            hasMalicious: false,
            detectedThreats: ['missing-svg-tag'],
            cleanSvg: '',
            error: 'Content does not contain a valid <svg> tag',
        };
    }

    // 2. Check for XXE / DTD attack patterns
    if (DTD_ENTITY_PATTERN.test(rawSvg) || ENTITY_DECL_PATTERN.test(rawSvg)) {
        detectedThreats.push('xxe-entity-declaration');
    }

    // 3. Check for dangerous tags (<script>, <foreignObject>, etc.)
    for (const pattern of DANGEROUS_TAG_PATTERNS) {
        if (pattern.test(rawSvg)) {
            const tagMatch = pattern.source.match(/<([a-zA-Z]+)/);
            const tagName = tagMatch ? tagMatch[1] : 'dangerous-tag';
            detectedThreats.push(`tag:${tagName}`);
        }
    }

    // 4. Check for event handler attributes (onload, onerror, onclick, etc.)
    const eventMatches = rawSvg.match(EVENT_HANDLER_PATTERN);
    if (eventMatches && eventMatches.length > 0) {
        eventMatches.forEach((m) => {
            const attrName = m.trim().split('=')[0];
            detectedThreats.push(`event-handler:${attrName}`);
        });
    }

    // 5. Check for dangerous URI protocols in href, xlink:href, src, etc.
    const uriAttrPattern = /\s+(?:href|xlink:href|src|data|action)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+))/gi;
    let match;
    while ((match = uriAttrPattern.exec(rawSvg)) !== null) {
        const uriVal = match[1] || match[2] || match[3] || '';
        if (isDangerousUri(uriVal)) {
            detectedThreats.push(`dangerous-uri:${uriVal.slice(0, 30)}`);
        }
    }

    // 6. Check for dangerous <animate> or <set> attributes modifying scripts or hrefs
    const animPattern = /<(?:animate|set)\b[^>]*(?:attributeName\s*=\s*['"]?(?:href|xlink:href)['"]?)[^>]*>/gi;
    if (animPattern.test(rawSvg)) {
        detectedThreats.push('animated-uri-manipulation');
    }

    // 7. Perform stripping to generate cleanSvg
    let sanitized = rawSvg;

    // Strip DTD entities
    sanitized = sanitized.replace(DTD_ENTITY_PATTERN, '');
    sanitized = sanitized.replace(ENTITY_DECL_PATTERN, '');

    // Strip dangerous tags
    for (const pattern of DANGEROUS_TAG_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Strip event handlers
    sanitized = sanitized.replace(EVENT_HANDLER_PATTERN, '');

    // Strip dangerous href / xlink:href / src attributes
    sanitized = sanitized.replace(uriAttrPattern, (fullMatch, v1, v2, v3) => {
        const val = v1 || v2 || v3 || '';
        if (isDangerousUri(val)) {
            return ''; // Remove the attribute entirely
        }
        return fullMatch;
    });

    const hasMalicious = detectedThreats.length > 0;
    const isClean = !hasMalicious;

    return {
        isValid: true,
        isClean,
        hasMalicious,
        detectedThreats,
        cleanSvg: sanitized.trim(),
        error: hasMalicious ? `Malicious or unsafe constructs detected: ${detectedThreats.join(', ')}` : null,
    };
}

module.exports = {
    sanitizeSvgContent,
    isDangerousUri,
};
