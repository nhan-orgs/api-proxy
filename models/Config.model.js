const mongoose = require('mongoose')

const ConfigSchema = new mongoose.Schema(
  {
    origin: {
      type: String,
      required: true,
      unique: true,
    },
    target: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Config', ConfigSchema)
