const HyperExpress = require('hyper-express')
const randomstring = require('randomstring')

// Node.js built-in modules
const fs = require('node:fs')
const path = require('node:path')

// Constants
const UPLOAD_DIRECTORY = path.join(__dirname, 'uploads')
const MAX_SIZE_BYTES = 256 * 1e6 // 256 MB

console.log('Starting\u2026')

const server = new HyperExpress.Server()

// APIs
const apis = new HyperExpress.Router()

apis.post('/upload', { max_body_length: MAX_SIZE_BYTES }, async (request, response) => {
  console.log(`${request.method} ${request.path}`)

  if (!request.is('multipart/form-data')) {
    throw new Error('Invalid Content-Type')
  }

  request.body = {}
  request.files = []

  console.log('await req.multipart()')
  await request.multipart({
    defParamCharset: 'utf8',
    limits: {
      fileSize: MAX_SIZE_BYTES,
      fields: 6,
      files: 10
    }
  }, async field => {
    const name = field.name
    console.log(`field: ${name}`)

    if (field.truncated) {
      // Non-file fields
      console.log(`${name} is non-file`)

      request.body[name] = field.value
    } else if (field.file) {
      // File fields
      console.log(`${name} is file`)

      if (field.name !== 'files[]') {
        throw new Error(`Invalid file field: ${field.name}`)
      }

      const file = {
        originalname: field.file.name || '',
        mimetype: field.mime_type || ''
      }
      request.files.push(file)

      file.extname = path.extname(file.originalname)
      file.filename = randomstring.generate(20) + file.extname
      file.path = path.join(UPLOAD_DIRECTORY, file.filename)

      const readStream = field.file.stream
      let writeStream

      const _logStatus = () => {
        console.log('\n' + Date.now())
        console.log(`request: { isPaused(): ${request.isPaused()}, readableFlowing: ${request.readableFlowing} }`)
        console.log(`readStream: { isPaused(): ${readStream.isPaused()}, readableFlowing: ${readStream.readableFlowing} }`)
        if (writeStream) {
          console.log(`writeStream: { bytesWritten: ${writeStream.bytesWritten} }`)
        }
      }
      _logStatus()

      let _interval
      file.promised = await new Promise((resolve, reject) => {
        readStream.once('error', reject)

        console.log(`fs.createWriteStream('${file.path}')`)
        writeStream = fs.createWriteStream(file.path)
        writeStream.once('error', reject)
        writeStream.once('finish', () => {
          console.log('writeStream: finish')
          file.size = writeStream.bytesWritten
          return resolve(true)
        })

        console.log('readStream.pause()')
        readStream.pause()
        _logStatus()

        console.log('readStream.on(\'data\', ...)')
        readStream.on('data', data => {
          console.log(`readStream:data => ${data.length}`)
        })
        _logStatus()

        console.log('readStream.pipe(writeStream, { end: true })')
        readStream.pipe(writeStream, { end: true })
        _interval = setInterval(_logStatus, 1000)
      }).catch(error => {
        if (writeStream && !writeStream.destroyed) {
          writeStream.destroy()
        }
        throw error
      }).finally(() => {
        clearInterval(_interval)
      })

      if (file.size === 0) {
        throw new Error('Invalid zero bytes files.')
      }
    }
  })
  console.log('req.multipart() resolved')

  if (request.files.length === 0) {
    throw new Error('No files.')
  }

  if (request.files.some(file => !file.promised)) {
    throw new Error('req.multipart() resolved before a file\'s Promise.')
  }

  let responseString = ''
  for (const file of request.files) {
    responseString += `${file.path}\n`
  }

  console.log(`200: ${request.path}`)
  response.send(responseString)
})

server.use('/api', apis)

// Handlers
server.set_not_found_handler((request, response) => {
  console.log(`404: ${request.path}`)
  response.status(404).end()
})

server.set_error_handler((request, response, error) => {
  console.error(error)
  console.log(`500: ${request.path}`)
  response.status(500).end()
})

// Start listening on port
const port = process.env.PORT || 8888

server.listen(port)
  .then(() => {
    console.log(`Listening on port: ${port}`)
  })
