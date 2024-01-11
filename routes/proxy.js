const express = require('express')
const ProxyModel = require('../models/Proxy.model')
const forbiddenPath = require('../middlewares/forbiddenPath.middleware')
const router = express.Router()
const { pagination } = require('../middlewares/pagination.middleware')
const { verifyPassword } = require('../middlewares/verifyPassword.middleware')
const { updateProxyMiddlewares } = require('../configs/proxy')
const logger = require('../utils/logger')

router.get('/', pagination, async (req, res, next) => {
    const limit = req.limit
    const offset = req.offset
    const page = req.page

    const origin = req.query.origin
    const target = req.query.target

    let filterCriteria = {}
    if (origin) {
        filterCriteria = {
            origin: {
                $regex: origin,
                $options: 'i',
            },
        }
    }
    if (target) {
        filterCriteria = {
            ...filterCriteria.match,
            target: {
                $regex: target,
                $options: 'i',
            },
        }
    }

    try {
        const proxyData = await ProxyModel.find(filterCriteria).skip(offset).limit(limit)
        res.status(200).json({
            data: proxyData,
            limit: limit,
            page: page,
            count: await ProxyModel.countDocuments(filterCriteria),
        })
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
        updateProxyMiddlewares(proxies)

        res.status(201).json(result)
        logger.log('add proxy', logger.REF_TYPES.PROXY, result._id)
    } catch (error) {
        if ('code' in error && error.code === 11000) {
            let keyPattern = ''
            if (error.keyPattern?.origin === 1) {
                keyPattern = 'origin'
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
        updateProxyMiddlewares(proxies)

        res.status(200).json({
            msg: 'Updated successfully',
        })
        logger.log('update proxy', logger.REF_TYPES.PROXY, id)
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
        updateProxyMiddlewares(proxies)

        res.status(200).json({
            msg: 'Deleted successfully',
        })
        logger.log('delete proxy', logger.REF_TYPES.PROXY, id)
    } catch (error) {
        next(error)
    }
})

module.exports = router
