const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { default: axios } = require('axios')
const ProxyModel = require('../models/Proxy.model')
const config = require('../configs/config')
const { mongoose } = require('mongoose')
const forbiddenPath = require('../middlewares/forbiddenPath.middleware')
const { createProxyMiddleware } = require('http-proxy-middleware')
const fs = require('fs')
const proxyJson = require('../configs/proxy.json')
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

const writeProxyJson = async () => {
  try {
    const proxy = await ProxyModel.find()
    fs.writeFileSync('./configs/proxy.json', JSON.stringify(proxy))
  } catch (error) {
    console.log('Write proxy json failed: ', error)
  }
}

// Route

app.post('/repeat', async (req, res) => {
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

app.get('/proxy', async (req, res, next) => {
  try {
    const proxyData = await ProxyModel.find()
    res.status(200).json(proxyData)
  } catch (error) {
    next(error)
  }
})

app.post('/proxy', forbiddenPath, async (req, res, next) => {
  const origin = req.body.origin
  const target = req.body.target

  try {
    const proxy = new ProxyModel({
      origin,
      target,
    })
    const result = await proxy.save()
    await writeProxyJson()
    res.status(201).json(result)
  } catch (error) {
    if ('code' in error && error.code === 11000) {
      let keyPattern = ''
      if (error.keyPattern?.origin === 1) {
        keyPattern = 'origin'
      } else if (error.keyPattern?.target === 1) {
        keyPattern = 'target'
      } else {
        console.log('Duplicate key but keyPattern is not origin/target')
        return next(err)
      }
      return res.status(400).json({
        msg: `Duplicate ${keyPattern}, try another one`,
      })
    }
    next(error)
  }
})

app.put('/proxy/:id', forbiddenPath, async (req, res, next) => {
  const id = req.params.id
  const origin = req.body.origin
  const target = req.body.target

  try {
    await ProxyModel.updateOne(
      {
        _id: id,
      },
      {
        origin,
        target,
      }
    )
    await writeProxyJson()
    res.status(200).json({
      msg: 'Updated successfully',
    })
  } catch (error) {
    if ('code' in error && error.code === 11000) {
      let keyPattern = ''
      if (error.keyPattern?.origin === 1) {
        keyPattern = 'origin'
      } else if (error.keyPattern?.target === 1) {
        keyPattern = 'target'
      } else {
        console.log('Duplicate key but keyPattern is not origin/target')
        return next(err)
      }
      return res.status(400).json({
        msg: `Duplicate ${keyPattern}, try another one`,
      })
    }
    next(error)
  }
})

app.delete('/proxy/:id', async (req, res, next) => {
  const id = req.params.id
  try {
    await ProxyModel.deleteOne({
      _id: id,
    })
    await writeProxyJson()
    res.status(200).json({
      msg: 'Deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

app.use(async (req, res, next, err) => {
  console.log(err)
  res.status(500).json({
    msg: 'Internal server error',
  })
})

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server started successfully at port: ${process.env.PORT || 8080}`)
})
