import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import {
  getMetadataType,
  getMetaConfigJSON,
  getFiles,
  writeOutput,
} from '../utils/file-helper'

export default class Join extends Command {
  static description = 'describe the command here'

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
      console.log('list of permissions to merge is empty')
      // eslint-disable-next-line no-throw-literal
      throw 'list of permissions to merge is empty'
    }
    flags.meta.forEach(permission => {
      if (!fs.existsSync(permission)) {
        console.error(`${permission} is not accessible`)
        // eslint-disable-next-line no-throw-literal
        throw `${permission} is not accessible`
      }
    })
    let stepEnd = Date.now()
    verboseTab.push({'input check time:': stepEnd - stepStart})

    stepStart = Date.now()
    let meta
    await getMetadataType(flags.meta)
      .then(result => {
        meta = result
        verboseTab.push({'meta to join:': meta})
      })
      .catch(error => {
        console.error(error)
        throw error
      })
    stepEnd = Date.now()
    verboseTab.push({'get metadaType time:': stepEnd - stepStart})

    stepStart = Date.now()
    let configJson
    await getMetaConfigJSON(meta)
      .then(result => {
        configJson = result
      })
      .catch(error => {
        console.error(error)
        throw error
      })
    stepEnd = Date.now()
    verboseTab.push({'get config time: ': stepEnd - stepStart})

    stepStart = Date.now()
    let fileJSON
    await getFiles(flags.meta, meta).then(result => {
      fileJSON = result
    })
    stepEnd = Date.now()
    verboseTab.push({'get files time:': stepEnd - stepStart})

    stepStart = Date.now()
    function joinUniques(ours, theirs, attributs) {
      ours
        .filter(
          x =>
            !theirs.find(
              y =>
                attributs.reduce(
                  (acc, attribut) => `${acc}${JSON.stringify(x[attribut])}#`,
                  '',
                ) ===
                attributs.reduce(
                  (acc, attribut) => `${acc}${JSON.stringify(y[attribut])}#`,
                  '',
                ),
            ),
        )
        .concat(theirs)
    }
    function joinExclusives(ours, theirs, attributs) {
      ours
        .filter(
          x =>
            !theirs.find(
              y =>
                Array.of(attributs.find(att => y[att])).reduce(
                  (acc, attribut) => `${acc}${JSON.stringify(x[attribut])}#`,
                  '',
                ) ===
                Array.of(attributs.find(att => y[att])).reduce(
                  (acc, attribut) => `${acc}${JSON.stringify(y[attribut])}#`,
                  '',
                ),
            ),
        )
        .concat(theirs)
    }
    const reducer = function(acc, curr) {
      // first loop we will use the current Permission => no merge required :D
      if (Object.entries(acc).length === 0 && acc.constructor === Object) {
        return curr
      }
      Object.keys(curr).forEach(p => {
        if (configJson.uniqueKeys && configJson.uniqueKeys[p]) {
          joinUniques(acc[p] || [], curr[p] || [], configJson.uniqueKeys[p])
        } else if (
          configJson.exclusiveUniqueKeys &&
          configJson.exclusiveUniqueKeys[p]
        ) {
          joinExclusives(
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
    stepEnd = Date.now()
    verboseTab.push({'join time:': stepEnd - stepStart})

    stepStart = Date.now()
    await writeOutput(meta, flags.output, merged)
    stepEnd = Date.now()
    verboseTab.push({'writing time:': stepEnd - stepStart})

    const tEnd = Date.now()
    if (flags.verbose) {
      for (const elem of verboseTab) {
        console.log(Object.keys(elem)[0], Object.values(elem)[0])
      }
      console.log('teatment time:', tEnd - tStart)
    }
  }
}
