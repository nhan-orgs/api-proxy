const verifyPassword = async (req, res, next) => {
  const password = req.body.password
  if (!password) {
    return res.status(403).json({
      msg: 'Forbidden access',
    })
  }
  try {
    if (password !== process.env.PASSWORD) {
      return res.status(401).json({
        msg: 'Wrong password',
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  verifyPassword,
}
