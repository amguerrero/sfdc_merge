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

export function buildUniqueKey(node, meta, configJson) {
  let uniqueKey = null
  if (configJson.uniqueKeys && configJson.uniqueKeys[meta]) {
    uniqueKey = configJson.uniqueKeys[meta].reduce(
      (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
      meta.concat('#'),
    )
  } else if (
    configJson.exclusiveUniqueKeys &&
    configJson.exclusiveUniqueKeys[meta]
  ) {
    uniqueKey = Array.of(
      configJson.exclusiveUniqueKeys[meta].find((att) => node[att]),
    ).reduce(
      (acc, attribut) => acc.concat(node[attribut][0]).concat('#'),
      meta.concat('#'),
    )
  }
  return uniqueKey
}
