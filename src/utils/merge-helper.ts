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
