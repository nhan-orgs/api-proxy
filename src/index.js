const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { default: axios } = require('axios')
const Config = require('../models/Config.model')
const { default: config } = require('../configs/config')
const { default: mongoose } = require('mongoose')

// Config
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

app.get('/config', async (req, res, next) => {
  try {
    const configData = await Config.find()
    res.status(200).json(configData)
  } catch (error) {
    next(error)
  }
})

app.post('/config', async (req, res, next) => {
  const origin = req.body.origin
  const target = req.body.target
  if (!origin || !target) {
    return res.status(400).json({
      msg: 'Missing origin or target data',
    })
  }

  if (config.blackList.includes(target)) {
    return res.status(400).json({
      target: 'Forbidden target data',
    })
  }

  try {
    const config = new Config({
      origin,
      target,
    })
    const result = await config.save()
    res.status(200).json(result)
  } catch (error) {
    if ('code' in error && error.code === 11000) {
      console.log(error)
      return res.status(400).json({
        msg: 'Duplicate target, try another one',
      })
    }
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
