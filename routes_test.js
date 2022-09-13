const express = require('express')
// const HyperExpress = require('hyper-express')

console.log('Starting\u2026')
const server = express()
// const server = new HyperExpress.Server({ fast_abort: true })

server.use((req, res, next) => {
  console.log('root middleware')
  next()
})

server.use('/swagger', (req, res, next) => {
  console.log('/swagger', req.path)
  next()
})

/*
server.set_not_found_handler((req, res) => {
  console.log('not_found_handler')
  res.status(404).end()
})

server.set_error_handler((req, res) => {
  console.log('error_handler')
  res.status(500).end()
})
*/

;(async () => {
  const port = process.env.PORT || 3001
  await server.listen(port)
  console.log(`Started on port ${port}`)
})()
