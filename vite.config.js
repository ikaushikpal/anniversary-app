import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function devApiPlugin() {
  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-metadata', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const formatted = JSON.stringify(data, null, 2)
              fs.writeFileSync(path.resolve(__dirname, 'src/data/metadata.json'), formatted, 'utf-8')
              fs.writeFileSync(path.resolve(__dirname, 'public/metadata.json'), formatted, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
      })

      server.middlewares.use('/api/upload-media', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { filename, dataBase64, folder = 'photos' } = JSON.parse(body)
              const safeFolder = folder === 'music' ? 'music' : 'photos'
              const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
              const targetDir = path.resolve(__dirname, `public/${safeFolder}`)
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
              }
              const targetPath = path.resolve(targetDir, cleanName)
              const base64Data = dataBase64.replace(/^data:.*?;base64,/, '')
              fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, path: `/${safeFolder}/${cleanName}` }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiPlugin()],
})
