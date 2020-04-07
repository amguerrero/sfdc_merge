export function addVerboseInfo(
  verboseTab: Array<Record<string, any>>,
  stepStart: number,
  strStep: string,
): void {
  const obj = {}
  obj[strStep] = Date.now() - stepStart
  verboseTab.push(obj)
}

export function printVerboseInfo(
  verboseTab: Array<Record<string, any>>,
  tStart: number,
) {
  for (const elem of verboseTab) {
    console.log(Object.keys(elem)[0], Object.values(elem)[0])
  }
  console.log('teatment time:', Date.now() - tStart)
}
