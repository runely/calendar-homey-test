const axios = require('axios').default

const { error } = require('../../config') // { info, warn, error, debug }

module.exports = async (name, uri) => {
  try {
    const { data } = await axios.get(uri)
    return data
  } catch (ex) {
    error(`Failed to download '${name}' from '${uri}':`, ex)
    return null
  }
}