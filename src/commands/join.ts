import {Command, flags} from '@oclif/command'
import {
  getMetadataType,
  getMetaConfigJSON,
  getKeyedFiles,
  writeOutput,
  allFilesExist,
} from '../utils/file-helper'
import {addVerboseInfo, startTimer, endTimer} from '../utils/verbose-helper'
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
    const {flags} = this.parse(Join)
    startTimer('teatment time', flags.verbose)

    startTimer('input check time', flags.verbose)
    if (flags.meta === undefined) {
      console.error('list of permissions to merge is empty')
      endTimer('teatment time', flags.verbose)
      return ''
    }
    if (!(await allFilesExist(flags.meta))) {
      console.error('at least a metadataFile is not accessible')
      endTimer('teatment time', flags.verbose)
      return ''
    }
    endTimer('input check time', flags.verbose)

    startTimer('get metadaType time', flags.verbose)
    let meta
    await getMetadataType(flags.meta)
      .then((result) => {
        meta = result
        addVerboseInfo(flags.verbose, 'meta to join:', meta)
      })
      .catch((error) => {
        console.error(error)
        throw error
      })
    endTimer('get metadaType time', flags.verbose)

    startTimer('get config time', flags.verbose)
    let configJson
    await getMetaConfigJSON(meta)
      .then((result) => {
        configJson = result
      })
      .catch((error) => {
        console.error(error)
        throw error
      })
    endTimer('get config time', flags.verbose)

    startTimer('get keyed files time', flags.verbose)
    let fileKeyedJSON
    await getKeyedFiles(flags.meta, meta, configJson, flags.verbose).then(
      (result) => {
        fileKeyedJSON = result
      },
    )
    endTimer('get keyed files time', flags.verbose)

    startTimer('join keyed time', flags.verbose)
    const reducerKeyedLatest = function (acc, curr) {
      // first loop we will use the current Permission => no merge required :D
      if (Object.entries(acc).length === 0 && acc.constructor === Object) {
        return curr
      }
      Object.assign(acc, curr)
      return acc
    }
    const reducerKeyedmeld = function (acc, curr) {
      // first loop we will use the current Permission => no merge required :D
      if (Object.entries(acc).length === 0 && acc.constructor === Object) {
        return curr
      }
      // eslint-disable-next-line new-cap
      const jspath = JSONPath({
        path: '$..[?(@.subKeys)]',
        json: configJson,
        resultType: 'parentProperty',
        wrap: false,
      })
      if (jspath) {
        Object.keys(curr).forEach((p) => {
          if (
            acc[p] &&
            configJson[curr[p].nodeType] &&
            jspath.includes(curr[p].nodeType)
          ) {
            // make sure we aggregate only the subKeys elements, the rest remains only curr
            configJson[curr[p].nodeType].subKeys.forEach((att) => {
              if (acc[p].node[att]) {
                let accArray = []
                if (Array.isArray(acc[p].node[att])) {
                  accArray = acc[p].node[att]
                } else if (acc[p].node[att] !== undefined) {
                  accArray = [acc[p].node[att]]
                }
                let currArray = []
                if (Array.isArray(curr[p].node[att])) {
                  currArray = curr[p].node[att]
                } else if (curr[p].node[att] !== undefined) {
                  currArray = [curr[p].node[att]]
                }
                const mapper = function (acc, curr) {
                  if (typeof curr === 'string') {
                    acc[curr] = curr
                  } else {
                    acc[curr._] = curr
                  }
                  return acc
                }
                accArray = accArray.reduce(mapper, [])
                currArray = currArray.reduce(mapper, [])
                Object.assign(accArray, currArray)
                const result = []
                for (const val of Object.values(accArray)) result.push(val)
                curr[p].node[att] = result
              }
            })
            Object.assign(acc[p], curr[p])
          } else {
            acc[p] = curr[p]
          }
        })
      } else {
        Object.assign(acc, curr)
      }
      return acc
    }
    let mergedKeyed
    if (flags.algo === 'latest') {
      mergedKeyed = fileKeyedJSON.reduce(reducerKeyedLatest, {})
    } else {
      mergedKeyed = fileKeyedJSON.reduce(reducerKeyedmeld, [])
    }
    endTimer('join keyed time', flags.verbose)

    startTimer('transform keyed to unkeyed', flags.verbose)
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
    endTimer('transform keyed to unkeyed', flags.verbose)

    startTimer('writing keyed time', flags.verbose)
    await writeOutput(meta, flags.output, unKeyed)
    endTimer('writing keyed time', flags.verbose)

    endTimer('teatment time', flags.verbose)
    console.log('sfdx-md-merge-driver:', 'successfully joined.')
  }
}
