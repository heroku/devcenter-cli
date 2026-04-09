import type {Server} from 'node:http'

import {watch} from 'chokidar'
import express, {type Express, type Response} from 'express'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import open from 'open'

import {ArticleFile} from './article-file.js'
import {getArticleWorkingDirectory} from './paths.js'
import {renderNotFoundPage, renderPreviewPage} from './preview-templates.js'

export type PreviewLogger = (message: string) => void

export type PreviewApp = {
  app: Express
  broadcastReload: () => void
}

/**
 * Express app for local Dev Center preview (routes only; no listen).
 * `broadcastReload` notifies active `/stream` SSE connections (same as file save in `runPreview`).
 */
export function createPreviewApp(log: PreviewLogger): PreviewApp {
  const clients = new Set<Response>()
  const app = express()

  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end()
  })

  app.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    clients.add(res)
    const timer = setInterval(() => {
      res.write(':refreshing \n\n')
    }, 20_000)
    req.on('close', () => {
      clearInterval(timer)
      clients.delete(res)
    })
  })

  app.get('/:articleSlug', (req, res) => {
    const {articleSlug} = req.params
    log(`Local article requested: ${articleSlug}`)
    const srcPath = resolve(getArticleWorkingDirectory(), `${articleSlug}.md`)
    if (!existsSync(srcPath)) {
      const ref = typeof req.get('Referer') === 'string' ? req.get('Referer') : undefined
      res.status(404).type('html').send(renderNotFoundPage(ref))
      return
    }

    log('Parsing')
    const article = ArticleFile.read(srcPath)
    const {html} = renderPreviewPage(article, articleSlug)
    log('Serving')
    res.type('html').send(html)
  })

  const broadcastReload = () => {
    for (const clientRes of clients) {
      try {
        clientRes.write('data: reload\n\n')
      } catch {
        clients.delete(clientRes)
      }
    }
  }

  return {app, broadcastReload}
}

export async function runPreview(options: {
  host: string
  log: PreviewLogger
  mdPath: string
  port: number
  slug: string
}): Promise<void> {
  const {host, log, mdPath, port, slug} = options
  const {app, broadcastReload} = createPreviewApp(log)

  const server: Server = await new Promise(resolveListen => {
    const s = app.listen(port, host, () => {
      resolveListen(s)
    })
  })

  const watcher = watch(mdPath, {ignoreInitial: true}).on('change', () => {
    log(`File modified: ${mdPath}`)
    broadcastReload()
  })

  const url = `http://${host}:${port}/${slug}`
  log(`\nLive preview for ${slug} available at ${url}`)
  log(`It will refresh when you save ${mdPath}`)
  log('Press Ctrl+C to exit...\n')
  if (!process.env.DEVCENTER_CLI_TEST) {
    await open(url)
  }

  await new Promise<void>(resolveShutdown => {
    const stop = () => {
      watcher.close().then(() => {
        server.close(() => {
          log('\nPreview finished.')
          resolveShutdown()
        })
      })
    }

    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
}
