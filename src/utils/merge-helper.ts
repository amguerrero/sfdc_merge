export function joinUniques(ours, theirs, attributs) {
  return ours
    .filter(
      (x) =>
        !theirs.find(
          (y) =>
            attributs.reduce(
              (acc, attribut) => `${acc}${JSON.stringify(x[attribut])}`,
              '',
            ) ===
            attributs.reduce(
              (acc, attribut) => `${acc}${JSON.stringify(y[attribut])}`,
              '',
            ),
        ),
    )
    .concat(theirs)
}
export function joinExclusives(ours, theirs, attributs) {
  return ours
    .filter(
      (x) =>
        !theirs.find(
          (y) =>
            Array.of(attributs.find((att) => y[att])).reduce(
              (acc, attribut) => `${acc}${JSON.stringify(x[attribut])}`,
              '',
            ) ===
            Array.of(attributs.find((att) => y[att])).reduce(
              (acc, attribut) => `${acc}${JSON.stringify(y[attribut])}`,
              '',
            ),
        ),
    )
    .concat(theirs)
}

export function buildUniqueKey(node, type, configJson) {
  let uniqueKey = null
  // if (configJson.uniqueKeys && configJson.uniqueKeys[type]) {
  //   uniqueKey = configJson.uniqueKeys[type].reduce(
  //     (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
  //     type.concat('#'),
  //   )
  // } else if (
  //   configJson.exclusiveUniqueKeys &&
  //   configJson.exclusiveUniqueKeys[type]
  // ) {
  //   uniqueKey = Array.of(
  //     configJson.exclusiveUniqueKeys[type].find((att) => node[att]),
  //   ).reduce(
  //     (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
  //     type.concat('#'),
  //   )
  // }
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
