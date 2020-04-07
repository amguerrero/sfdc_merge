import {Command, flags} from '@oclif/command'
import {
  getMetadataType,
  getMetaConfigJSON,
  getFiles,
  writeOutput,
  allFilesExist,
} from '../utils/file-helper'
import {joinUniques, joinExclusives} from '../utils/merge-helper'
import {addVerboseInfo, printVerboseInfo} from '../utils/verbose-helper'

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
  }

  async run() {
    const tStart = Date.now()
    const verboseTab = []
    const {flags} = this.parse(Join)

    let stepStart = Date.now()
    if (flags.meta === undefined) {
      console.error('list of permissions to merge is empty')
      if (flags.verbose) printVerboseInfo(verboseTab, tStart)
      return ''
      // eslint-disable-next-line no-throw-literal
      // throw 'list of permissions to merge is empty'
    }
    if (!(await allFilesExist(flags.meta))) {
      console.error('at least a metadataFile is not accessible')
      if (flags.verbose) printVerboseInfo(verboseTab, tStart)
      return ''
    }
    // flags.meta.forEach((permission) => {
    //   console.log('test file', permission)
    //   // try {
    //   //   fs.access(permission, error => {
    //   //     if (error) {
    //   //       console.log(`${permission} is not accessible1`)
    //   //       return ''
    //   //     }
    //   //   })
    //   // } catch (error) {
    //   //   console.log(`${permission} is not accessible2`)
    //   //   return ''
    //   // }
    //   if (!fs.existsSync(permission)) {
    //     console.log(`${permission} is not accessible`)
    //     return ''
    //     // eslint-disable-next-line no-throw-literal
    //     // throw `${permission} is not accessible`
    //   }
    // })
    console.log('after files')
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
    let fileJSON
    await getFiles(flags.meta, meta).then((result) => {
      fileJSON = result
    })
    if (flags.verbose) addVerboseInfo(verboseTab, stepStart, 'get files time:')

    stepStart = Date.now()
    const reducer = function (acc, curr) {
      // first loop we will use the current Permission => no merge required :D
      if (Object.entries(acc).length === 0 && acc.constructor === Object) {
        return curr
      }
      Object.keys(curr).forEach((p) => {
        if (configJson.uniqueKeys && configJson.uniqueKeys[p]) {
          acc[p] = joinUniques(
            acc[p] || [],
            curr[p] || [],
            configJson.uniqueKeys[p],
          )
        } else if (
          configJson.exclusiveUniqueKeys &&
          configJson.exclusiveUniqueKeys[p]
        ) {
          acc[p] = joinExclusives(
            acc[p] || [],
            curr[p] || [],
            configJson.exclusiveUniqueKeys[p],
          )
        } else {
          verboseTab.push({'unlisted property:': p})
        }
      })
      return acc
    }
    const merged = fileJSON.reduce(reducer, {})
    if (flags.verbose) addVerboseInfo(verboseTab, stepStart, 'join time:')

    stepStart = Date.now()
    await writeOutput(meta, flags.output, merged)
    if (flags.verbose) addVerboseInfo(verboseTab, stepStart, 'writing time:')

    if (flags.verbose) printVerboseInfo(verboseTab, tStart)
    console.error('sfdx-md-merge-driver:', 'successfully joined.')
  }
}
