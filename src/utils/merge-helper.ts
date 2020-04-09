export function buildUniqueKey(node, type, configJson) {
  let uniqueKey = null
  if (configJson[type]) {
    if (configJson[type].uniqueKeys) {
      uniqueKey = configJson[type].uniqueKeys.reduce(
        (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
        type.concat('#'),
      )
    } else {
      uniqueKey = Array.of(
        configJson[type].exclusiveUniqueKeys.find((att) => node[att]),
      ).reduce(
        (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
        type.concat('#'),
      )
    }
  }
  return uniqueKey
}
