console.log('Starting\u2026')

const HyperExpress = require('hyper-express')
const server = new HyperExpress.Server({ fast_abort: true })

// Global root middleware
server.use((request, response, next) => {
  request.locals.ranGlobalMiddleware = true
  next()
})

const status200 = (request, response) => {
  const status = request.locals.ranGlobalMiddleware ? 'YES' : 'NO'
  console.log(`${request.method} ${request.path} <- 200 OK (Global root middleware: ${status})`)
  response.status(200).end()
}

// without options, nor local middleware
server.get('/', status200)

server.get(
  '/with_options_but_no_local_middleware',
  {
    max_body_length: 100 * 1e6
  },
  status200
)

server.get(
  '/with_options_and_local_middleware',
  {
    max_body_length: 100 * 1e6
  },
  (request, response, next) => {
  // middleware that does nothing
    next()
  },
  status200
)

server.get(
  '/with_options_that_has_empty_middleware_array',
  {
    max_body_length: 100 * 1e6,
    middlewares: []
  },
  status200
)

server.get(
  '/with_options_and_empty_middleware_array',
  {
    max_body_length: 100 * 1e6
  },
  [], // empty middleware array
  status200
)

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
