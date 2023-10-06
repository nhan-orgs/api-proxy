const express = require('express')
const ProxyModel = require('../models/Proxy.model')
const forbiddenPath = require('../middlewares/forbiddenPath.middleware')
const router = express.Router()
const { pagination } = require('../middlewares/pagination.middleware')
const { verifyPassword } = require('../middlewares/verifyPassword.middleware')
const { updateProxyMiddlewares } = require('../configs/proxy')

router.get('/', pagination, async (req, res, next) => {
  const limit = req.limit
  const offset = req.offset

  try {
    const proxyData = await ProxyModel.find().limit(limit).skip(offset)
    res.status(200).json(proxyData)
  } catch (error) {
    next(error)
  }
})

router.post('/', verifyPassword, forbiddenPath, async (req, res, next) => {
  const origin = req.body.origin
  const target = req.body.target

  try {
    const proxy = new ProxyModel({
      origin,
      target,
    })
    const result = await proxy.save()

    const proxies = await ProxyModel.find()
    await updateProxyMiddlewares(proxies)

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
        return next(error)
      }
      return res.status(400).json({
        msg: `Duplicate ${keyPattern}, try another one`,
      })
    }
    next(error)
  }
})

router.put('/:id', verifyPassword, forbiddenPath, async (req, res, next) => {
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

    const proxies = await ProxyModel.find()
    await updateProxyMiddlewares(proxies)

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
        return next(error)
      }
      return res.status(400).json({
        msg: `Duplicate ${keyPattern}, try another one`,
      })
    }
    next(error)
  }
})

router.delete('/:id', verifyPassword, async (req, res, next) => {
  const id = req.params.id
  try {
    await ProxyModel.deleteOne({
      _id: id,
    })

    const proxies = await ProxyModel.find()
    await updateProxyMiddlewares(proxies)

    res.status(200).json({
      msg: 'Deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
