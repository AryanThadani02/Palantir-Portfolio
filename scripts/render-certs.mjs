// Renders page 1 of each certificate PDF in assets/ to a web-sized JPEG in public/certs, using pdf.js inside
// headless Chrome. Needs puppeteer-core + pdfjs-dist (installed in TOOLS). Run: node scripts/render-certs.mjs
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const TOOLS = 'C:/Users/aryan/AppData/Local/Temp/pf-shot/'
const require = createRequire(TOOLS)
const puppeteer = require('puppeteer-core')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PDFJS = path.join(TOOLS, 'node_modules/pdfjs-dist/build')
const CERTS = [
  ['AI Engineer', 'ai-engineer'],
  ['Data Engineer', 'data-engineer'],
  ['Application Developer', 'application-developer'],
  ['Aware', 'foundry-aware'],
]
const WIDTH = 1400

const files = {
  '/': ['text/html', Buffer.from('<!doctype html><body></body>')],
  '/pdf.mjs': ['text/javascript', fs.readFileSync(path.join(PDFJS, 'pdf.min.mjs'))],
  '/pdf.worker.mjs': ['text/javascript', fs.readFileSync(path.join(PDFJS, 'pdf.worker.min.mjs'))],
}
for (const [label, name] of CERTS) {
  files[`/${name}.pdf`] = ['application/pdf', fs.readFileSync(path.join(ROOT, 'assets', `Palantir Foundry ${label} Certificate.pdf`))]
}

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
})
const page = await browser.newPage()
await page.setRequestInterception(true)
page.on('request', (req) => {
  const f = files[new URL(req.url()).pathname]
  if (f) req.respond({ status: 200, contentType: f[0], body: f[1] })
  else req.respond({ status: 404, body: '' })
})
await page.goto('http://certs.local/')

fs.mkdirSync(path.join(ROOT, 'public/certs'), { recursive: true })
for (const [, name] of CERTS) {
  const dataUrl = await page.evaluate(
    async (name, width) => {
      const pdfjs = await import('/pdf.mjs')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'
      const doc = await pdfjs.getDocument(`/${name}.pdf`).promise
      const pg = await doc.getPage(1)
      const base = pg.getViewport({ scale: 1 })
      const viewport = pg.getViewport({ scale: width / base.width })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      await pg.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      return canvas.toDataURL('image/jpeg', 0.86)
    },
    name,
    WIDTH,
  )
  const out = path.join(ROOT, 'public/certs', `${name}.jpg`)
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'))
  console.log('cert', name, fs.statSync(out).size, 'bytes')
}
await browser.close()
