export function buildUniqueKey(node, type, configJson) {
  // eslint-disable-next-line prefer-rest-params
  // console.dir(arguments, {showHidden: true, depth: null, colors: true})
  let uniqueKey = null
  if (configJson[type]) {
    if (configJson[type].uniqueKeys) {
      uniqueKey = configJson[type].uniqueKeys.reduce(
        // (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
        (acc, attribut) => {
          if (node[attribut]) {
            if (Array.isArray(node[attribut]))
              return acc.concat(node[attribut][0]).concat('#')
            return acc.concat(node[attribut]._).concat('#')
          }
          return acc
        },
        type.concat('#'),
      )
    } else {
      uniqueKey = Array.of(
        configJson[type].exclusiveUniqueKeys.find((att) => node[att]),
      ).reduce((acc, attribut) => {
        if (Array.isArray(node[attribut]))
          return acc.concat(node[attribut][0]).concat('#')
        return acc.concat(node[attribut]._).concat('#')
      }, type.concat('#'))
    }
  }
  return uniqueKey
}
