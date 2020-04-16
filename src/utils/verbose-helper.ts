export function addVerboseInfo(verbose: boolean, ...args): void {
  if (verbose) console.log(...args)
}

export function startTimer(strStep: string, verbose: boolean) {
  if (verbose) console.time(strStep)
}

export function endTimer(strStep: string, verbose: boolean) {
  if (verbose) console.timeEnd(strStep)
}

// export function printVerboseInfo(
//   verboseTab: Array<Record<string, any>>,
//   verbose: boolean,
// ) {
//   if (verbose) {
//     for (const elem of verboseTab) {
//       console.log(Object.keys(elem)[0], Object.values(elem)[0])
//     }
//     console.timeEnd('teatment time')
//   }
// }
