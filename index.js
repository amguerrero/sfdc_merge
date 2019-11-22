#!/usr/bin/env node
'use strict'

var shell = require('shelljs')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const yargs = require('yargs')
const xml2js = require('xml2js')

const builder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  xmlns: true
})

const PackageJson = require('./utils/package-json')
const pjson = new PackageJson()

// eslint-disable-next-line no-extend-native
String.prototype.replaceAll = function (search, replacement) {
  return this.split(search).join(replacement)
}

if (require.main === module) {
  parseArgs()
}

function parseArgs () {
  return yargs
    .command(
      'install',
      'Set up the merge driver in the current git repository.',
      {
        global: {
          type: 'boolean',
          default: false,
          description: 'install to your user-level git configuration'
        },
        driver: {
          type: 'string',
          default: 'npx sfdx-md-merge-driver merge %O %A %B %P',
          description:
            'string to install as the driver in the git configuration'
        },
        'driver-name': {
          type: 'string',
          default: 'sfdx-md-merge-driver',
          description:
            'String to use as the merge driver name in your configuration.'
        },
        files: {
          description: 'Filenames that will trigger this driver.',
          type: 'array',
          default: [
            '*.profile',
            '*.profile-meta.xml',
            '*.permissionset',
            '*.permissionset-meta.xml',
            '*.labels',
            '*.labels-meta.xml'
          ]
        }
      },
      install
    )
    .command(
      'uninstall',
      'Remove a previously configured driver',
      {
        global: {
          type: 'boolean',
          default: false,
          description: 'install to your user-level git configuration'
        },
        'driver-name': {
          type: 'string',
          default: 'sfdx-md-merge-driver',
          description:
            'String to use as the merge driver name in your configuration.'
        }
      },
      uninstall
    )
    .command(
      'merge <%O> <%A> <%B> <%P>',
      'Check for conflicts and merge them if possible.',
      {},
      merge
    )
    .version(require('./package.json').version)
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .epilogue('For the full documentation, see sfdx-md-merge-driver(1)')
    .demandCommand().argv
}

function install (argv) {
  if (pjson.name !== 'sfdx-md-merge-driver') {
    const attrFile = path.join(
      pjson.path,
      findAttributes(argv).replace(/^\s*~\//, process.env.HOME + '/')
    )
    const opts = argv.global ? '--global' : '--local'
    shell.exec(
      `git config ${opts} merge."${
        argv.driverName
      }".name "A custom merge driver for Salesforce profiles"`,
      {
        cwd: pjson.path
      }
    )
    shell.exec(
      `git config ${opts} merge."${argv.driverName}".driver "${argv.driver}"`,
      {
        cwd: pjson.path
      }
    )
    shell.exec(
      `git config ${opts} merge."${argv.driverName}".recursive binary`,
      {
        cwd: pjson.path
      }
    )
    mkdirp.sync(path.dirname(attrFile))
    let attrContents = ''
    try {
      const RE = new RegExp(`.* merge\\s*=\\s*${argv.driverName}$`)
      attrContents = fs
        .readFileSync(attrFile, 'utf8')
        .split(/\r?\n/)
        .filter(line => !line.match(RE))
        .join('\n')
      // eslint-disable-next-line no-empty
    } catch (e) {}
    if (attrContents && !attrContents.match(/[\n\r]$/g)) {
      attrContents = '\n'
    }
    attrContents += argv.files
      .map(f => `${f} merge=${argv.driverName}`)
      .join('\n')
    attrContents += '\n'
    fs.writeFileSync(attrFile, attrContents)
    console.error(
      'sfdx-md-merge-driver:',
      argv.driverName,
      'installed to `git config',
      opts + '`',
      'and',
      attrFile
    )
  }
}

function uninstall (argv) {
  if (pjson.name !== 'sfdx-md-merge-driver') {
    const attrFile = path.join(pjson.path, findAttributes(argv))
    const opts = argv.global ? '--global' : '--local'
    try {
      shell.exec(
        `git config ${opts} --remove-section merge."${argv.driverName}"`,
        {
          cwd: pjson.path,
          silent: true
        }
      )
    } catch (e) {}
    let currAttrs
    try {
      currAttrs = fs.readFileSync(attrFile, 'utf8').split('\n')
      // eslint-disable-next-line no-empty
    } catch (e) {}
    if (currAttrs) {
      let newAttrs = ''
      currAttrs.forEach(attr => {
        const match = attr.match(/ merge=(.*)$/i)
        if (!match || match[1].trim() !== argv.driverName) {
          newAttrs += attr + '\n'
        }
      })
      fs.writeFileSync(attrFile, newAttrs.trim())
    }
    console.error(
      'sfdx-md-merge-driver:',
      argv.driverName,
      'uninstalled from `git config',
      opts + '`',
      'and',
      attrFile
    )
  }
}

function findAttributes (argv) {
  let attrFile
  if (argv.global) {
    try {
      attrFile = shell
        .exec('git config --global core.attributesfile', {
          cwd: pjson.path,
          silent: true
        })
        .toString('utf8')
        .trim()
      // eslint-disable-next-line no-empty
    } catch (e) {}
    if (!attrFile) {
      if (process.env.XDG_CONFIG_HOME) {
        attrFile = path.join(process.env.XDG_CONFIG_HOME, 'git', 'attributes')
      } else {
        attrFile = path.join(process.env.HOME, '.config', 'git', 'attributes')
      }
    }
  } else {
    const gitDir = shell
      .exec('git rev-parse --git-dir', {
        encoding: 'utf8',
        cwd: pjson.path,
        silent: true
      })
      .trim()
    attrFile = path.join(gitDir, 'info', 'attributes')
  }
  return attrFile
}

function merge (argv) {
  const md = new (require('./utils/metadataMerger'))(
    argv['%O'],
    argv['%A'],
    argv['%B']
  )
  const base = md.getBaseNodes()
  const ancientNodes = md.getNodes(argv['%O']) // ancestor’s version of the conflicting file
  const oursNodes = md.getNodes(argv['%A']) // current version of the conflicting file
  const theirsNodes = md.getNodes(argv['%B']) // other branch's version of the conflicting file

  console.error('sfdx-md-merge-driver: merging', argv['%P'])

  const ancient = []
  Object.keys(ancientNodes).forEach(localpart => {
    let nodelist = ancientNodes[localpart]
    if (!Array.isArray(nodelist)) {
      nodelist = [nodelist]
    }
    nodelist.forEach(node => {
      const uniqueNodeKey = md.buildUniqueKey(node, localpart)
      if (uniqueNodeKey) {
        ancient[uniqueNodeKey] = {
          nodeType: localpart,
          node: node
        }
      }
    })
  })

  const ours = {}
  let oursIds = []
  let unmatchedNodeCount = 0
  Object.keys(oursNodes).forEach(localpart => {
    let nodelist = oursNodes[localpart]
    if (!Array.isArray(nodelist)) {
      nodelist = [nodelist]
    }
    nodelist.forEach(node => {
      const uniqueNodeKey = md.buildUniqueKeyCount(
        node,
        localpart,
        unmatchedNodeCount++
      )
      oursIds.push(uniqueNodeKey)
      ours[uniqueNodeKey] = {
        nodeType: localpart,
        node: node,
        existsInAncient: ancient[uniqueNodeKey] != null,
        isEqualsToAncient: md.areNodesEqual(
          node,
          ancient[uniqueNodeKey],
          localpart
        )[0],
        isEqualsToAncientFailedList: md.areNodesEqual(
          node,
          ancient[uniqueNodeKey],
          localpart
        )[1]
      }
    })
  })

  let conflictCounter = 0
  Object.keys(theirsNodes).forEach(localpart => {
    let nodelist = theirsNodes[localpart]
    if (!Array.isArray(nodelist)) {
      nodelist = [nodelist]
    }
    nodelist.forEach(node => {
      const uniqueNodeKey = md.buildUniqueKey(node, localpart)
      if (uniqueNodeKey) {
        const existsInAncient = ancient[uniqueNodeKey] != null
        const isEqualsToAncient = md.areNodesEqual(
          node,
          ancient[uniqueNodeKey],
          localpart
        )[0]
        // eslint-disable-next-line no-unused-vars
        let existsInOurs = oursIds.filter(function (value, index, arr) {
          return value !== uniqueNodeKey
        })
        if (oursIds.includes(uniqueNodeKey)) {
          existsInOurs = true
          // eslint-disable-next-line no-unused-vars
          oursIds = oursIds.filter(function (value, index, arr) {
            return value !== uniqueNodeKey
          })
        } else {
          existsInOurs = false
        }
        const isEqualsToOurs = md.areNodesEqual(
          node,
          ours[uniqueNodeKey],
          localpart
        )[0]
        const isEqualsToOursFailedList = md.areNodesEqual(
          node,
          ours[uniqueNodeKey],
          localpart
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
            node: node
          }
        } else {
          // CONFLICT detected

          isEqualsToOursFailedList.forEach(entry => {
            if (entry == null) {
              Object.keys(node).forEach(nkey => {
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
              node: node
            }
          }
        }
      }
    })
  })

  oursIds.forEach(
    id => {
      if (ours[id]) {
        if (ours[id].existsInAncient && !ours[id].isEqualsToAncient) {
          // not exists in theirs branch, modified in ours
          Object.keys(ours[id].node).forEach(nkey => {
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
    } // all left oursIds see #59
  )

  Object.keys(ours)
    .sort()
    .forEach(function (key) {
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
    argv['%A'],
    builder
      .buildObject(base)
      .replaceAll('&lt;&lt;&lt;&lt;&lt;&lt;&lt;', '<<<<<<<')
      .replaceAll('&gt;&gt;&gt;&gt;&gt;&gt;&gt;', '>>>>>>>')
  )

  if (conflictCounter > 0) {
    console.error('Conflicts Found: ' + conflictCounter)
    process.exit(conflictCounter)
  } else {
    console.error('sfdx-md-merge-driver:', argv['%P'], 'successfully merged.')
    process.exit(0)
  }
}
