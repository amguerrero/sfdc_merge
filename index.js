#!/usr/bin/env node
'use strict'

const cp = require('child_process')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const yargs = require('yargs')
const shell = require('shelljs')

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
        default:
            'groovy .git/scripts/sfdx-merge/sfdx_merge.groovy %O %A %B .git/scripts/sfdx-merge',
        description:
            'string to install as the driver in the git configuration'
      },
      'driver-name': {
        type: 'string',
        default: 'sfdx-merge-driver',
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
        default: 'sfdx-merge-driver',
        description:
            'String to use as the merge driver name in your configuration.'
      }
    },
      uninstall
    )
    .version(require('./package.json').version)
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .epilogue('For the full documentation, see sfdx-merge-driver(1)')
    .demandCommand().argv
}

function install (argv) {
  const attrFile = findAttributes(argv).replace(
    /^\s*~\//,
    process.env.HOME + '/'
  )
  const opts = argv.global ? '--global' : '--local'
  cp.execSync(
    `git config ${opts} merge."${argv.driverName}".name "A custom merge driver for Salesforce profiles"`
  )
  cp.execSync(
    `git config ${opts} merge."${argv.driverName}".driver "${argv.driver}"`
  )
  cp.execSync(`git config ${opts} merge."${argv.driverName}".recursive binary`)
  mkdirp.sync(path.dirname(attrFile))
  let attrContents = ''
  try {
    const RE = new RegExp(`.* merge\\s*=\\s*${argv.driverName}$`)
    attrContents = fs
      .readFileSync(attrFile, 'utf8')
      .split(/\r?\n/)
      .filter(line => !line.match(RE))
      .join('\n')
  } catch (e) {}
  if (attrContents && !attrContents.match(/[\n\r]$/g)) {
    attrContents = '\n'
  }
  attrContents += argv.files
    .map(f => `${f} merge=${argv.driverName}`)
    .join('\n')
  attrContents += '\n'
  fs.writeFileSync(attrFile, attrContents)
  let packagePath = path.dirname(require.resolve('sfdx-merge-driver'))
  shell.mkdir('-p', '.git/scripts/sfdx-merge/')
  shell.cp('-R', `${packagePath}/sfdx_merge.groovy`, '.git/scripts/sfdx-merge/')
  shell.cp('-R', `${packagePath}/conf`, '.git/scripts/sfdx-merge/')
  console.error(
    'sfdx-merge-driver:',
    argv.driverName,
    'installed to `git config',
    opts + '`',
    'and',
    attrFile
  )
}

function uninstall (argv) {
  const attrFile = findAttributes(argv)
  const opts = argv.global ? '--global' : '--local'
  try {
    cp.execSync(
      `git config ${opts} --remove-section merge."${argv.driverName}"`
    )
  } catch (e) {
    if (!e.message.match(/no such section/gi)) {
      throw e
    }
  }
  try {
    shell.rm('-rf', '.git/scripts')
  } catch (e) {}
  let currAttrs
  try {
    currAttrs = fs.readFileSync(attrFile, 'utf8').split('\n')
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
}

function findAttributes (argv) {
  let attrFile
  if (argv.global) {
    try {
      attrFile = cp
        .execSync(`git config --global core.attributesfile`)
        .toString('utf8')
        .trim()
    } catch (e) {}
    if (!attrFile) {
      if (process.env.XDG_CONFIG_HOME) {
        attrFile = path.join(process.env.XDG_CONFIG_HOME, 'git', 'attributes')
      } else {
        attrFile = path.join(process.env.HOME, '.config', 'git', 'attributes')
      }
    }
  } else {
    const gitDir = cp
      .execSync(`git rev-parse --git-dir`, {
        encoding: 'utf8'
      })
      .trim()
    attrFile = path.join(gitDir, 'info', 'attributes')
  }
  return attrFile
}
