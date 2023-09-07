const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const { default: axios } = require('axios')

// Config
require('dotenv').config()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
  cors({
    origin: '*',
  })
)

app.post('/request', async (req, res, next) => {
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
    console.log(error)
    return res.status(500).json({
      msg: 'Internal server error',
    })
  }
})

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server started successfully at port: ${process.env.PORT || 8080}`)
})
