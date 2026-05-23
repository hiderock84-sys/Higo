import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  ZIP_UPLOADS?: R2Bucket
  ZIP_MAX_BYTES?: string
  ZIP_PUBLIC_BASE_URL?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Serve static files
app.use('/static/*', serveStatic({ root: './dist' }))

// Serve index.html for root path
app.get('/', serveStatic({ path: './dist/index.html' }))
app.get('/zip-upload', serveStatic({ path: './dist/zip-upload.html' }))
app.get('/zip-upload.html', serveStatic({ path: './dist/zip-upload.html' }))

app.post('/api/upload-zip', async (c) => {
  const bucket = c.env.ZIP_UPLOADS
  if (!bucket) {
    return c.json(
      {
        ok: false,
        message:
          'サーバー設定エラー: ZIP_UPLOADS(R2) バインディングが未設定です。',
      },
      503
    )
  }

  const formData = await c.req.formData()
  const zipFile = formData.get('zipFile')
  if (!(zipFile instanceof File)) {
    return c.json(
      { ok: false, message: 'zipFile フィールドにファイルを指定してください。' },
      400
    )
  }

  if (!zipFile.name.toLowerCase().endsWith('.zip')) {
    return c.json(
      { ok: false, message: 'ZIPファイル（.zip）のみアップロードできます。' },
      400
    )
  }

  const configuredMaxBytes = Number.parseInt(c.env.ZIP_MAX_BYTES ?? '', 10)
  const maxBytes =
    Number.isFinite(configuredMaxBytes) && configuredMaxBytes > 0
      ? configuredMaxBytes
      : 10 * 1024 * 1024

  if (zipFile.size === 0) {
    return c.json(
      { ok: false, message: '空のZIPファイルはアップロードできません。' },
      400
    )
  }

  if (zipFile.size > maxBytes) {
    return c.json(
      {
        ok: false,
        message: `ファイルサイズが上限を超えています（上限: ${maxBytes} bytes）。`,
      },
      400
    )
  }

  const safeName = zipFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const objectKey = `incoming/${Date.now()}-${crypto.randomUUID()}-${safeName}`

  try {
    await bucket.put(objectKey, zipFile.stream(), {
      httpMetadata: {
        contentType: zipFile.type || 'application/zip',
      },
      customMetadata: {
        originalFileName: zipFile.name,
      },
    })
  } catch {
    return c.json(
      { ok: false, message: 'アップロードの保存に失敗しました。' },
      500
    )
  }

  const publicBaseUrl = c.env.ZIP_PUBLIC_BASE_URL?.replace(/\/+$/, '')
  const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/')
  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${encodedKey}` : null

  return c.json({
    ok: true,
    message: 'ZIPファイルをアップロードしました。',
    key: objectKey,
    size: zipFile.size,
    publicUrl,
  })
})

export default app
