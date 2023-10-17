require('dotenv').config()
const { createLogger, format, transports } = require('winston')

const REF_TYPES = {
  PROXY: 'proxy',
}

const t = new transports.Http({
  host: process.env.LOGGING_HOST || 'localhost',
  port: process.env.LOGGING_PORT,
  ssl: process.env.LOGGING_SSL?.toLowerCase() === 'true',
  path: '/',
})

const logger = createLogger({
  format: format.json(),
  transports: [t],
})

t.on('warn', (e) => {
  console.log('failed when logging to server:', e)
})

const log = (message, refType, refId, createdBy, other) => {
  logger.info(message, {
    refType,
    refId,
    createdBy,
    other,
  })
}

module.exports = {
  log,
  REF_TYPES,
}
