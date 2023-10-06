const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { default: axios } = require('axios')
const { mongoose } = require('mongoose')
const proxyRoute = require('./routes/proxy')
const { getProxyMiddlewares, updateProxyMiddlewares } = require('./configs/proxy')
const ProxyModel = require('./models/Proxy.model')
require('dotenv').config()

mongoose.connect(
  process.env.DB_CONN_STR ||
    'mongodb://127.0.0.1:27017/api-proxy?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.9.1'
)
const connection = mongoose.connection
connection.once('open', async () => {
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

// Proxy
app.use(async (req, res, next) => {
  const middlewares = getProxyMiddlewares()

  // Init if empty
  if (Object.entries(middlewares).length === 0) {
    try {
      const proxy = await ProxyModel.find()
      updateProxyMiddlewares(proxy)
    } catch (error) {
      console.log('error retrieving proxy')
    }
  }

  const middleware = middlewares[req.path]

  if (typeof middleware === 'function') {
    middleware(req, res, next)
  } else {
    res.status(404).send('')
  }
})

// if (proxyJson) {
//   try {
//     const proxyList = JSON.parse(JSON.stringify(proxyJson))

//     proxyList.forEach((proxy) => {
//       if (!proxy.origin || !proxy.target) {
//         return console.log('Empty origin or target: ', proxy)
//       }
//       console.log(`${proxy.origin} - ${proxy.target}`)
//       app.use(
//         proxy.origin,
//         createProxyMiddleware({
//           target: proxy.target,
//           pathFilter: '**',
//           onProxyRes: (proxyRes, req, res) => {
//             proxyRes.headers['access-control-allow-origin'] = '*'
//           },
//           pathRewrite: {
//             [`^${proxy.origin}`]: '',
//           },
//           changeOrigin: true,
//         })
//       )
//     })
//   } catch (error) {
//     console.log('Configure proxy failed: ', error)
//   }
// }

app.use(async (req, res, next, err) => {
  console.log(err)
  res.status(500).json({
    msg: 'Internal server error',
  })
})

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server started successfully at port: ${process.env.PORT || 8080}`)
})
