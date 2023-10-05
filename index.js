const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { default: axios } = require('axios')
const ProxyModel = require('./models/Proxy.model')
const { mongoose } = require('mongoose')
const { createProxyMiddleware } = require('http-proxy-middleware')
const fs = require('fs')
const proxyJson = require('./configs/proxy.json')
const proxyRoute = require('./routes/proxy')
require('dotenv').config()

mongoose.connect(
  process.env.DB_CONN_STR ||
    'mongodb://127.0.0.1:27017/api-proxy?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.9.1'
)
const connection = mongoose.connection
connection.once('open', () => {
  console.log(new Date(), 'MongoDB database connection established successfully')
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
  cors({
    origin: '*',
  })
)

// Proxy configuration
/** @type {import('http-proxy-middleware/dist/types').RequestHandler<express.Request, express.Response>} */

if (proxyJson) {
  try {
    const proxyList = JSON.parse(JSON.stringify(proxyJson))

    proxyList.forEach((proxy) => {
      if (!proxy.origin || !proxy.target) {
        return console.log('Empty origin or target: ', proxy)
      }
      console.log(`${proxy.origin} - ${proxy.target}`)
      app.use(
        proxy.origin,
        createProxyMiddleware({
          target: proxy.target,
          pathFilter: '**',
          onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          },
          pathRewrite: {
            [`^${proxy.origin}`]: '',
          },
          changeOrigin: true,
        })
      )
    })
  } catch (error) {
    console.log('Configure proxy failed: ', error)
  }
}
// Route

app.post('/repeat', async (req, res, next) => {
  const url = req.body.url,
    method = req.body.method,
    data = req.body.data
  if (!url || !method || !data) {
    return res.status(400).json({
      msg: 'Lacking of url or method or data',
    })
  }
  try {
    const response = await axios({
      method,
      url,
      data,
    })
    res.status(200).json(response.data)
  } catch (error) {
    next(error)
  }
})

app.use('/proxy', proxyRoute)

app.use(async (req, res, next, err) => {
  console.log(err)
  res.status(500).json({
    msg: 'Internal server error',
  })
})

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server started successfully at port: ${process.env.PORT || 8080}`)
})
