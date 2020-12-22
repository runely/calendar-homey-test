'use strict'

const fs = require('fs')
const dirname = require('path').dirname
const { info, warn, error, debug } = require('../../config');

module.exports = (data, path) => {
  try {
    const dirPath = dirname(path)
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath)
    fs.writeFileSync(path, data)
  } catch (err) {
    error(`save-ics-file: Failed to save data to path: '${path}':`, err)
  }
}
