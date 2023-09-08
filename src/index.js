const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { default: axios } = require('axios')
const ConfigModel = require('../models/Config.model')
const config = require('../configs/config')
const { mongoose } = require('mongoose')
const forbiddenPath = require('../middlewares/forbiddenPath.middleware')

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
    const configData = await ConfigModel.find()
    res.status(200).json(configData)
  } catch (error) {
    next(error)
  }
})

app.post('/config', forbiddenPath, async (req, res, next) => {
  const origin = req.body.origin
  const target = req.body.target

  try {
    const config = new ConfigModel({
      origin,
      target,
    })
    const result = await config.save()
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

app.put('/config/:id', forbiddenPath, async (req, res, next) => {
  const id = req.params.id
  const origin = req.body.origin
  const target = req.body.target

  try {
    await ConfigModel.updateOne(
      {
        _id: id,
      },
      {
        origin,
        target,
      }
    )
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

app.delete('/config/:id', async (req, res, next) => {
  const id = req.params.id
  try {
    await ConfigModel.deleteOne({
      _id: id,
    })
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
