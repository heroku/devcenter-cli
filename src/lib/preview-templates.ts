import type {ArticleFile} from './article-file.js'

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const PREVIEW_CSS = `
body { font-family: system-ui, -apple-system, sans-serif; margin: 0; line-height: 1.5; color: #1b1b1b; }
.page-wrapper { min-height: 100vh; display: flex; flex-direction: column; }
header { background: linear-gradient(135deg, #79589f 0%, #4b2866 100%); color: #fff; padding: 0.75rem 0; }
.heroku-header .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; display: flex; align-items: center; gap: 1rem; }
.heroku-brand { color: #fff; font-weight: 600; text-decoration: none; }
.nav { list-style: none; margin: 0; padding: 0; display: flex; gap: 1rem; }
.nav a { color: #e8e0f0; text-decoration: none; }
.container { max-width: 1200px; margin: 0 auto; padding: 1rem; }
.content { max-width: 48rem; }
footer { margin-top: auto; border-top: 1px solid #e5e5e5; padding: 1rem 0; font-size: 0.875rem; }
footer ul { list-style: none; margin: 0; padding: 0; display: flex; gap: 1rem; }
.warning { background: #fff3cd; border: 1px solid #ffc107; padding: 1rem; border-radius: 4px; }
#table-of-contents { margin-bottom: 1.5rem; }
pre { background: #f5f5f5; padding: 1rem; overflow: auto; border-radius: 4px; }
code { background: #f5f5f5; padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.9em; }
.last-updated { color: #666; font-size: 0.9rem; }
`

export function renderPreviewPage(article: ArticleFile, slug: string): {html: string; title: string;} {
  const title = article.metadata.title || slug
  let inner: string
  if (article.html) {
    const tocItems = article.toc
      .map(s => `<li><a href="#${esc(s.id)}">${esc(s.text)}</a></li>`)
      .join('')
    const tocBlock
      = tocItems.length > 0
        ? `<div id="table-of-contents"><h3>Table of Contents</h3><ul>${tocItems}</ul></div>`
        : ''
    inner = `
<article class="js-autolink">
  <h1>${esc(article.metadata.title)}</h1>
  <p class="last-updated">Last updated (local preview)</p>
  ${tocBlock}
  ${article.html}
</article>`
  } else if (article.parsingError) {
    inner = `<article><div class="warning"><p>Parsing error: ${esc(article.parsingError)}</p></div></article>`
  } else {
    inner = '<article><p>No content.</p></article>'
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preview: ${esc(title)}</title>
  <style>${PREVIEW_CSS}</style>
  <script>
  try {
    var es = new EventSource('/stream');
    es.onmessage = function() { document.location.reload(); };
    es.onerror = function() { es.close(); };
  } catch (e) { console.error(e); }
  </script>
</head>
<body>
  <div class="page-wrapper">
    <header><div class="heroku-header"><div class="container">
      <span class="heroku-brand">Heroku Dev Center</span>
      <ul class="nav"><li><a href="#">Local Preview</a></li></ul>
    </div></div></header>
    <div class="container"><div class="content">${inner}</div></div>
    <footer><div class="container"><ul>
      <li><a href="https://www.heroku.com/home">heroku.com</a></li>
      <li><a href="https://www.heroku.com/policy/privacy">Privacy Policy</a></li>
    </ul></div></footer>
  </div>
</body>
</html>`
  return {html, title}
}

export function renderNotFoundPage(referrerUrl?: string): string {
  const back
    = referrerUrl
      ? `<a href="${esc(referrerUrl)}">Return to your article</a>.`
      : ''
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Not found</title><style>${PREVIEW_CSS}</style></head>
<body><div class="container content">
<article><h1>Ooops</h1><div class="warning"><p>
You clicked a relative link for a URL not available locally. ${back}
</p></div></article>
</div></body></html>`
}
