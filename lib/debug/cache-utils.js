'use strict'

const REMOVE_THESE = [
  'calendar-homey/node_modules/node-ical.+',
  'calendar-homey/node_modules/axios.+',
  'calendar-homey/node_modules/rrule.+',
  'calendar-homey/node_modules/uuid.+',
  '/node_modules/node-ical.+',
  '/node_modules/axios.+',
  '/node_modules/rrule.+',
  '/node_modules/uuid.+'
]

const KEEP_THESE = [
  'calendar-homey/node_modules/moment.+',
  '/node_modules/moment.+'
]

const shouldRemoveRegex = key => REMOVE_THESE.map(rt => new RegExp(rt).test(key)).includes(true)
const shouldKeepRegex = key => KEEP_THESE.map(kt => new RegExp(kt).test(key)).includes(true)

const clearCache = () => {
  const cache = require.cache
  const removeKeys = []

  //let childIndex = 0
  const getChildren = (element) => {
    //console.log(`key ${childIndex} : '${element.id}'`)
    const resolvedKey = require.resolve(element.id)
    if (shouldKeepRegex(resolvedKey) === true) return
    removeKeys.push(resolvedKey)
    //console.log(`\tResolvedKey: '${resolvedKey}', with ${element.children.length} children will be removed`)
    //if (element.children.length > 0) console.log(element.children.map(c => c.id))
    for (const child of element.children) {
      const resolvedChildKey = require.resolve(child.id)
      if (shouldKeepRegex(resolvedChildKey) === true) continue
      removeKeys.push(resolvedChildKey)
      const childElement = cache[resolvedChildKey]
      if (childElement && childElement.children.length > 0) {
        //childIndex++
        getChildren(child)
        //childIndex--
      }
    }

    //childIndex--
  }

  for (const rootKey of Object.keys(cache)) {
    const rootElement = cache[rootKey]
    if (!rootElement) {
      console.warn(rootKey, 'not found!!!!!!!!!!!!')
      continue;
    } else if (shouldRemoveRegex(rootKey) === false) {
      continue;
    }

    getChildren(rootElement)
  }

  if (removeKeys.length > 0) {
    removeKeys.forEach(key => delete require.cache[key])
  }
}

const logCacheKeys = () => console.log(Object.keys(require.cache))

module.exports = {
  clearCache,
  logCacheKeys
}
