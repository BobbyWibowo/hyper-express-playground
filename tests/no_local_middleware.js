console.log('Starting\u2026')

const HyperExpress = require('hyper-express')
const server = new HyperExpress.Server({ fast_abort: true })

// Global root middleware
server.use((request, response, next) => {
  console.log(`Global root middleware: ${request.ip} -> ${request.method} ${request.path}`)
  next()
})

server.get('/', (request, response) => {
  console.log(`${request.method} request to ${request.path} is OK.`)
  response.status(200).end()
})

// without options, nor local middleware
server.post('/', (request, response) => {
  console.log(`${request.method} request to ${request.path} is OK.`)
  response.status(200).end()
})

server.post('/with_options_but_no_local_middleware', {
  max_body_length: 100 * 1e6
}, (request, response) => {
  console.log(`${request.method} request to ${request.path} is OK.`)
  response.status(200).end()
})

server.post('/with_options_and_local_middleware', {
  max_body_length: 100 * 1e6
}, (request, response, next) => {
  next()
},
(request, response) => {
  console.log(`${request.method} request to ${request.path} is OK.`)
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
