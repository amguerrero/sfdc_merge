import {Command, flags} from '@oclif/command'
import {
  getMetadataType,
  getMetaConfigJSON,
  getKeyedFiles,
  writeOutput,
  allFilesExist,
} from '../utils/file-helper'
import {addVerboseInfo, printVerboseInfo} from '../utils/verbose-helper'
import {JSONPath} from 'jsonpath-plus'

export default class Join extends Command {
  static description = 'Additionally merge the files of same metadataType'

  static flags = {
    help: flags.help({char: 'h'}),
    meta: flags.string({
      char: 'm',
      description: 'path(s) to file(s) to join',
      multiple: true,
    }),
    output: flags.string({
      char: 'o',
      description: 'path to write output',
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'verbose mode',
    }),
    algo: flags.string({
      char: 'a',
      description: 'algorithm for join, latest or meld',
      default: 'latest',
      options: ['latest', 'meld'],
    }),
  }

  async run() {
    const tStart = Date.now()
    const verboseTab = []
    const {flags} = this.parse(Join)
    console.log('flags', flags)

    let stepStart = Date.now()
    if (flags.meta === undefined) {
      console.error('list of permissions to merge is empty')
      if (flags.verbose) printVerboseInfo(verboseTab, tStart)
      return ''
    }
    if (!(await allFilesExist(flags.meta))) {
      console.error('at least a metadataFile is not accessible')
      if (flags.verbose) printVerboseInfo(verboseTab, tStart)
      return ''
    }
    if (flags.verbose)
      addVerboseInfo(verboseTab, stepStart, 'input check time:')

    stepStart = Date.now()
    let meta
    await getMetadataType(flags.meta)
      .then((result) => {
        meta = result
        verboseTab.push({'meta to join:': meta})
      })
      .catch((error) => {
        console.error(error)
        throw error
      })
    if (flags.verbose)
      addVerboseInfo(verboseTab, stepStart, 'get metadaType time:')

    stepStart = Date.now()
    let configJson
    await getMetaConfigJSON(meta)
      .then((result) => {
        configJson = result
      })
      .catch((error) => {
        console.error(error)
        throw error
      })
    if (flags.verbose) addVerboseInfo(verboseTab, stepStart, 'get config time:')

    stepStart = Date.now()
    let fileKeyedJSON
    await getKeyedFiles(flags.meta, meta, configJson).then((result) => {
      fileKeyedJSON = result
    })
    if (flags.verbose)
      addVerboseInfo(verboseTab, stepStart, 'get keyed files time:')

    stepStart = Date.now()
    const reducerKeyed = function (acc, curr) {
      // first loop we will use the current Permission => no merge required :D
      if (Object.entries(acc).length === 0 && acc.constructor === Object) {
        return curr
      }
      if (flags.algo === 'latest') {
        Object.assign(acc, curr)
        return acc
      }
      // eslint-disable-next-line new-cap
      const jspath = JSONPath({
        path: '$..[?(@.subKeys)]',
        json: configJson,
        resultType: 'parentProperty',
        wrap: false,
      })
      // eslint-disable-next-line new-cap
      if (jspath) {
        Object.keys(curr).forEach((p) => {
          if (
            acc[p] &&
            configJson[curr[p].nodeType] &&
            jspath.includes(curr[p].nodeType)
          ) {
            configJson[curr[p].nodeType].subKeys.forEach((att) => {
              const joined = [...acc[p].node[att], ...curr[p].node[att]]
              acc[p].node[att] = joined.filter(
                (item, index) => joined.indexOf(item) === index,
              )
            })
          } else {
            acc[p] = curr[p]
          }
        })
      } else {
        Object.assign(acc, curr)
      }
      return acc
    }
    const mergedKeyed = fileKeyedJSON.reduce(reducerKeyed, {})
    if (flags.verbose) addVerboseInfo(verboseTab, stepStart, 'join keyed time:')

    stepStart = Date.now()
    const unKeyed = {}
    Object.keys(mergedKeyed)
      .sort()
      .forEach(function (key) {
        // eslint-disable-next-line no-negated-condition
        if (mergedKeyed[key].nodeType !== '$') {
          if (!Array.isArray(unKeyed[mergedKeyed[key].nodeType])) {
            unKeyed[mergedKeyed[key].nodeType] = []
          }
          unKeyed[mergedKeyed[key].nodeType].push(mergedKeyed[key].node)
        } else {
          unKeyed[mergedKeyed[key].nodeType] = mergedKeyed[key].node
        }
      })
    if (flags.verbose)
      addVerboseInfo(verboseTab, stepStart, 'transform keyed to unkeyed:')

    stepStart = Date.now()
    await writeOutput(meta, flags.output, unKeyed)
    if (flags.verbose)
      addVerboseInfo(verboseTab, stepStart, 'writing keyed time:')

    if (flags.verbose) printVerboseInfo(verboseTab, tStart)
    console.error('sfdx-md-merge-driver:', 'successfully joined.')
  }
}
