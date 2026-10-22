const https = require('https');
const http = require('http');
const url = require('url');

const INDEXNOW_KEY = 'dolphincoder2026seoindexnowkey';

function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getSiteUrl() {
    return (process.env.CLIENT_URL || 'https://dolphincoder.com').replace(/\/+$/, '');
}

function generateJsonLd(page, siteUrl) {
    const pageUrl = `${siteUrl}/${page.slug}`;
    const authorName = page.author?.name || 'DolphinCoder Team';
    const description = page.summary || stripHtml(page.content).slice(0, 200);

    let imageUrl = `${siteUrl}/hero.png`;
    if (page.featuredImage) {
        imageUrl = page.featuredImage.startsWith('http')
            ? page.featuredImage
            : `${siteUrl}${page.featuredImage}`;
    }

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: page.title,
        description: description,
        url: pageUrl,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
        },
        image: [imageUrl],
        datePublished: (page.publishedAt || page.createdAt || new Date()).toISOString(),
        dateModified: (page.updatedAt || new Date()).toISOString(),
        author: {
            '@type': 'Person',
            name: authorName,
        },
        publisher: {
            '@type': 'Organization',
            name: 'DolphinCoder',
            url: siteUrl,
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/hero.png`,
            },
        },
    };

    return JSON.stringify(schema, null, 2);
}

function injectSeoTags(htmlTemplate, page, siteUrl) {
    const pageUrl = `${siteUrl}/${page.slug}`;
    const title = `${escapeHtml(page.title)} | DolphinCoder`;
    const description = escapeHtml(page.summary || stripHtml(page.content).slice(0, 180));
    const authorName = escapeHtml(page.author?.name || 'DolphinCoder Team');

    let imageUrl = `${siteUrl}/hero.png`;
    if (page.featuredImage) {
        imageUrl = page.featuredImage.startsWith('http')
            ? page.featuredImage
            : `${siteUrl}${page.featuredImage}`;
    }

    const jsonLd = generateJsonLd(page, siteUrl);

    const seoTags = `
    <!-- Dynamic SEO & AI Search Metadata -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="${authorName}" />
    <link rel="canonical" href="${pageUrl}" />

    <!-- Open Graph (Facebook, LinkedIn, AI Web Scrapers) -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="DolphinCoder" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="article:published_time" content="${(page.publishedAt || page.createdAt || new Date()).toISOString()}" />
    <meta property="article:modified_time" content="${(page.updatedAt || new Date()).toISOString()}" />

    <!-- Twitter / X Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

    <!-- Schema.org JSON-LD for Google, Gemini, ChatGPT Search -->
    <script type="application/ld+json">
${jsonLd}
    </script>
`;

    // Replace <title>...</title> and default meta description if present
    let modified = htmlTemplate.replace(/<title>[\s\S]*?<\/title>/i, '');
    modified = modified.replace(/<meta\s+name=["']description["'][^>]*>/i, '');

    // Insert new tags right before </head>
    modified = modified.replace('</head>', `${seoTags}\n  </head>`);

    // Inject crawler-readable semantic HTML inside <div id="root">
    // This allows non-JS bots (ChatGPT Bot, ClaudeBot, basic search crawlers) to read the page immediately
    // When React loads for human visitors, it mounts and renders the rich client-side interactive UI
    const crawlerPreRender = `
    <div id="root">
      <article id="crawler-prerender" style="display:none;" aria-hidden="true">
        <h1>${escapeHtml(page.title)}</h1>
        <p><strong>Published:</strong> ${(page.publishedAt || page.createdAt || new Date()).toISOString()}</p>
        <p><strong>Author:</strong> ${authorName}</p>
        <div>${page.content || ''}</div>
      </article>
    </div>`;

    modified = modified.replace('<div id="root"></div>', crawlerPreRender);

    return modified;
}

function generateSitemap(pages, siteUrl) {
    const urls = [];

    // Core high-priority public URLs
    urls.push({
        loc: `${siteUrl}/`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0',
    });
    urls.push({
        loc: `${siteUrl}/login`,
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
    });
    urls.push({
        loc: `${siteUrl}/register`,
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
    });

    // All published dynamic pages
    for (const page of pages) {
        urls.push({
            loc: `${siteUrl}/${page.slug}`,
            lastmod: (page.updatedAt || page.createdAt || new Date()).toISOString(),
            changefreq: 'weekly',
            priority: '0.8',
        });
    }

    const xmlLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    for (const u of urls) {
        xmlLines.push('  <url>');
        xmlLines.push(`    <loc>${u.loc}</loc>`);
        xmlLines.push(`    <lastmod>${u.lastmod}</lastmod>`);
        xmlLines.push(`    <changefreq>${u.changefreq}</changefreq>`);
        xmlLines.push(`    <priority>${u.priority}</priority>`);
        xmlLines.push('  </url>');
    }

    xmlLines.push('</urlset>');
    return xmlLines.join('\n');
}

function generateRobotsTxt(siteUrl) {
    return `# Robots.txt for DolphinCoder
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# Explicitly permit AI Search and Content Crawlers
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: CCBot
Allow: /

# Dynamic Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`;
}

// Notify IndexNow (Bing, Yandex, AI Engines) of a new or updated URL instantly
function pingIndexNow(slug, siteUrl = getSiteUrl()) {
    try {
        const fullUrl = `${siteUrl}/${slug}`;
        const parsedHost = url.parse(siteUrl).hostname;

        const postData = JSON.stringify({
            host: parsedHost,
            key: INDEXNOW_KEY,
            keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
            urlList: [fullUrl],
        });

        const options = {
            hostname: 'api.indexnow.org',
            port: 443,
            path: '/indexnow',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(postData),
            },
            timeout: 5000,
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 200 || res.statusCode === 202) {
                console.log(`✅ IndexNow ping succeeded for: ${fullUrl} (${res.statusCode})`);
            } else {
                console.log(`ℹ️ IndexNow ping response: ${res.statusCode} for ${fullUrl}`);
            }
        });

        req.on('error', (e) => {
            // Non-critical, log and continue
            console.log(`⚠️ IndexNow ping warning: ${e.message}`);
        });

        req.write(postData);
        req.end();
    } catch (err) {
        console.log(`⚠️ IndexNow invocation failed: ${err.message}`);
    }
}

module.exports = {
    INDEXNOW_KEY,
    getSiteUrl,
    stripHtml,
    escapeHtml,
    generateJsonLd,
    injectSeoTags,
    generateSitemap,
    generateRobotsTxt,
    pingIndexNow,
};
