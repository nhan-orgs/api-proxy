const config = require('../configs/config')
const { matchesAnyRegex } = require('../utils/matchRegexes')

const forbiddenPath = async (req, res, next) => {
  const origin = req.body.origin
  const target = req.body.target

  if (!origin || !target) {
    return res.status(400).json({
      msg: 'Missing origin or target data',
    })
  }

  if (matchesAnyRegex(origin, config.blackList)) {
    return res.status(400).json({
      msg: `Forbidden origin data`,
    })
  }

  if (matchesAnyRegex(target, config.blackList)) {
    return res.status(400).json({
      msg: `Forbidden target data`,
    })
  }

  next()
}

module.exports = forbiddenPath
