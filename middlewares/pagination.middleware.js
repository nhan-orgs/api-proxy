const pagination = async (req, res, next) => {
    try {
        let limit = Number(req.query.limit || 10)
        let page = Number(req.query.page || 1)

        if (limit < 0) {
            limit = 10
        }

        if (page <= 0) {
            page = 1
        }

        const offset = (page - 1) * limit
        req.limit = limit
        req.offset = offset
        req.page = page
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = {
    pagination,
}
