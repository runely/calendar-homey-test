'use strict';

const fs = require('fs');
const dirname = require('path').dirname;
const { error } = require('../../config'); // { info, warn, error, debug }

module.exports = (data, path) => {
  try {
    const dirPath = dirname(path);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    fs.writeFileSync(path, data);
  } catch (error_) {
    error(`save-ics-file: Failed to save data to path: '${path}':`, error_);
  }
};
