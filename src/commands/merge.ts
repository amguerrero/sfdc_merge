import {flags} from '@oclif/command'
import {MergeDriverBase} from '../base'
import * as fs from 'fs'
import * as xml2js from 'xml2js'

const builder = new xml2js.Builder({
  xmldec: {version: '1.0', encoding: 'UTF-8'},
  renderOpts: {pretty: true, indent: '    ', newline: '\n'},
  xmlns: true,
})

export default class Merge extends MergeDriverBase {
  static description = 'Check for conflicts and merge them if possible.'

  /*   static examples = [
    `$ sfdx-md-merge-driver hello
hello world from ./src/hello.ts!
`
  ]; */

  static flags = {
    help: flags.help({char: 'h'}),
    ancestor: flags.string({
      char: 'o',
      description: 'ancestor’s version',
      required: true,
    }),
    current: flags.string({
      char: 'a',
      description: 'current version',
      required: true,
    }),
    other: flags.string({
      char: 'b',
      description: 'other branches’ version',
      required: true,
    }),
    output: flags.string({
      char: 'p',
      description: 'pathname in which the merged result will be stored',
    }),
  }

  static args = []

  async run() {
    const {args, flags} = this.parse(Merge)
    if (flags.ancestor) {
      args['%O'] = flags.ancestor
    }
    if (flags.current) {
      args['%A'] = flags.current
    }
    if (flags.other) {
      args['%B'] = flags.other
    }
    if (flags.output) {
      args['%P'] = flags.output
    }
    const md = new (require('../utils/metadata-merger'))(
      args['%O'],
      args['%A'],
      args['%B'],
    )
    const base = md.getBaseNodes()
    const ancientNodes = md.getNodes(args['%O']) // ancestor’s version of the conflicting file
    const oursNodes = md.getNodes(args['%A']) // current version of the conflicting file
    const theirsNodes = md.getNodes(args['%B']) // other branch's version of the conflicting file

    console.error('sfdx-md-merge-driver: merging', args['%P'])

    const ancient = []
    Object.keys(ancientNodes).forEach((localpart) => {
      let nodelist = ancientNodes[localpart]
      if (!Array.isArray(nodelist)) {
        nodelist = [nodelist]
      }
      nodelist.forEach((node) => {
        const uniqueNodeKey = md.buildUniqueKey(node, localpart)
        if (uniqueNodeKey) {
          ancient[uniqueNodeKey] = {
            nodeType: localpart,
            node: node,
          }
        }
      })
    })

    const ours = {}
    let oursIds = []
    let unmatchedNodeCount = 0
    Object.keys(oursNodes).forEach((localpart) => {
      let nodelist = oursNodes[localpart]
      if (!Array.isArray(nodelist)) {
        nodelist = [nodelist]
      }
      nodelist.forEach((node) => {
        const uniqueNodeKey = md.buildUniqueKeyCount(
          node,
          localpart,
          unmatchedNodeCount++,
        )
        oursIds.push(uniqueNodeKey)
        ours[uniqueNodeKey] = {
          nodeType: localpart,
          node: node,
          // eslint-disable-next-line no-eq-null, eqeqeq
          existsInAncient: ancient[uniqueNodeKey] != null,
          isEqualsToAncient: md.areNodesEqual(
            node,
            ancient[uniqueNodeKey],
            localpart,
          )[0],
          isEqualsToAncientFailedList: md.areNodesEqual(
            node,
            ancient[uniqueNodeKey],
            localpart,
          )[1],
        }
      })
    })

    let conflictCounter = 0
    Object.keys(theirsNodes).forEach((localpart) => {
      let nodelist = theirsNodes[localpart]
      if (!Array.isArray(nodelist)) {
        nodelist = [nodelist]
      }
      nodelist.forEach((node) => {
        const uniqueNodeKey = md.buildUniqueKey(node, localpart)
        if (uniqueNodeKey) {
          // eslint-disable-next-line no-eq-null, eqeqeq
          const existsInAncient = ancient[uniqueNodeKey] != null
          const isEqualsToAncient = md.areNodesEqual(
            node,
            ancient[uniqueNodeKey],
            localpart,
          )[0]
          let existsInOurs /* = oursIds.filter(function(value, index, arr) {
            return value !== uniqueNodeKey
          }) */
          if (oursIds.includes(uniqueNodeKey)) {
            existsInOurs = true
            // oursIds = oursIds.filter(function(value, index, arr) {
            oursIds = oursIds.filter(function (value) {
              return value !== uniqueNodeKey
            })
          } else {
            existsInOurs = false
          }
          const isEqualsToOurs = md.areNodesEqual(
            node,
            ours[uniqueNodeKey],
            localpart,
          )[0]
          const isEqualsToOursFailedList = md.areNodesEqual(
            node,
            ours[uniqueNodeKey],
            localpart,
          )[1]
          if (
            (!existsInAncient && existsInOurs && isEqualsToOurs) ||
            (existsInAncient &&
              ((existsInOurs && (isEqualsToOurs || isEqualsToAncient)) ||
                (!existsInOurs && isEqualsToAncient)))
          ) {
            // Keep OURS
            // do nothing
          } else if (
            existsInAncient &&
            existsInOurs &&
            ours[uniqueNodeKey].isEqualsToAncient
          ) {
            // existed before, not modified in ours, use theirs (incomming)
            // Use THEIRS
            ours[uniqueNodeKey].node = node
          } else if (!existsInAncient && !existsInOurs) {
            // Use THEIRS
            ours[uniqueNodeKey] = {
              nodeType: localpart,
              node: node,
            }
          } else {
            // CONFLICT detected

            isEqualsToOursFailedList.forEach((entry) => {
              // eslint-disable-next-line no-eq-null, eqeqeq
              if (entry == null) {
                Object.keys(node).forEach((nkey) => {
                  conflictCounter++
                  node[nkey][0] =
                    '\n<<<<<<< CURRENT\n=======\n' +
                    node[nkey][0] +
                    '\n>>>>>>> OTHER\n'
                })
              } else {
                conflictCounter++
                node[entry.key][0] =
                  '\n<<<<<<< CURRENT\n' +
                  entry.value +
                  '\n=======\n' +
                  node[entry.key][0] +
                  '\n>>>>>>> OTHER\n'
              }
            })

            if (existsInOurs) {
              ours[uniqueNodeKey].node = node
            } else {
              ours[uniqueNodeKey] = {
                nodeType: localpart,
                node: node,
              }
            }
          }
        }
      })
    })

    oursIds.forEach(
      (id) => {
        if (ours[id]) {
          if (ours[id].existsInAncient && !ours[id].isEqualsToAncient) {
            // not exists in theirs branch, modified in ours
            Object.keys(ours[id].node).forEach((nkey) => {
              conflictCounter++
              ours[id].node[nkey][0] =
                '\n<<<<<<< CURRENT\n' +
                ours[id].node[nkey][0] +
                '\n=======\n>>>>>>> OTHER\n'
            })
          } else if (ours[id].isEqualsToAncient) {
            delete ours[id] // deleted in theirs branch, delete in ours
          }
        }
      }, // all left oursIds see #59
    )

    Object.keys(ours)
      .sort()
      .forEach(function (key) {
        // eslint-disable-next-line no-negated-condition
        if (ours[key].nodeType !== '$') {
          if (!Array.isArray(base[md.metadataType][ours[key].nodeType])) {
            base[md.metadataType][ours[key].nodeType] = []
          }
          base[md.metadataType][ours[key].nodeType].push(ours[key].node)
        } else {
          base[md.metadataType][ours[key].nodeType] = ours[key].node
        }
      })

    fs.writeFileSync(
      args['%A'],
      builder
        .buildObject(base)
        .split('&lt;&lt;&lt;&lt;&lt;&lt;&lt;')
        .join('<<<<<<<')
        .split('&gt;&gt;&gt;&gt;&gt;&gt;&gt;')
        .join('>>>>>>>'),
    )

    if (conflictCounter > 0) {
      console.error('Conflicts Found: ' + conflictCounter)
      // eslint-disable-next-line unicorn/no-process-exit, no-process-exit
      process.exit(conflictCounter)
    } else {
      console.error('sfdx-md-merge-driver:', args['%P'], 'successfully merged.')
      // eslint-disable-next-line unicorn/no-process-exit, no-process-exit
      process.exit(0)
    }
  }
}
