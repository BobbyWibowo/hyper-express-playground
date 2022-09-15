console.log('Starting\u2026')

// const express = require('express')
// const server = express()

const HyperExpress = require('hyper-express')
const server = new HyperExpress.Server({ fast_abort: true })

const routes = [
  '/api/login',
  '/api/register',
  '/api/album/zip',
  '/api/tokens/change',
  '/api/'
]

for (const route of routes) {
  server.use(route, (request, response, next) => {
    console.log(`${request.path} -> middleware ${route}`)
    next()
  })
}

server.use((request, response, next) => {
  console.log(`${request.path} -> middleware root`)
  next()
})

server.get('/api/login', (request, response) => {
  console.log(`${request.method} ${request.path}`)
  response.status(200).end()
})

server.set_not_found_handler((request, response) => {
  console.log('not_found_handler')
  response.status(404).end()
})

server.set_error_handler((request, response) => {
  console.log('error_handler')
  response.status(500).end()
})

;(async () => {
  const port = process.env.PORT || 3002
  await server.listen(port)
  console.log(`Started on port ${port}`)
})()
