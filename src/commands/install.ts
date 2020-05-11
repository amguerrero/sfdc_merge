import {flags} from '@oclif/command'
import {MergeDriverBase} from '../base'
import * as path from 'path'
import * as shell from 'shelljs'
import * as mkdirp from 'mkdirp'
import * as fs from 'fs'

const PackageJson = require('../utils/package-json')
const pjson = new PackageJson()

export default class Install extends MergeDriverBase {
  static description = 'Set up the merge driver in the current git repository.'

  /*   static examples = [
    `$ sfdx-md-merge-driver hello
hello world from ./src/hello.ts!
`
  ]; */

  static flags = {
    help: flags.help({char: 'h'}),
    global: flags.boolean({
      char: 'g',
      description: 'install to your user-level git configuration',
    }),
    driver: flags.string({
      char: 'd',
      description: 'string to install as the driver in the git configuration',
      default: 'npx sfdx-md-merge-driver merge %O %A %B %P',
    }),
    name: flags.string({
      char: 'n',
      description:
        'String to use as the merge driver name in your configuration.',
      default: 'sfdx-md-merge-driver',
    }),
    files: flags.string({
      char: 't',
      description: 'Filenames that will trigger this driver.',
      multiple: true,
      options: [
        '*.profile',
        '*.profile-meta.xml',
        '*.permissionset',
        '*.permissionset-meta.xml',
        '*.labels',
        '*.labels-meta.xml',
      ],
      default: [
        '*.profile',
        '*.profile-meta.xml',
        '*.permissionset',
        '*.permissionset-meta.xml',
        '*.labels',
        '*.labels-meta.xml',
      ],
    }),
  }

  async run() {
    const {flags} = this.parse(Install)
    if (pjson.name !== 'sfdx-md-merge-driver') {
      const attrFile = path.join(
        pjson.path,
        this.findAttributes(flags.global, pjson.path).replace(
          /^\s*~\//,
          process.env.HOME + '/',
        ),
      )
      const opts = flags.global ? '--global' : '--local'
      shell.exec(
        `git config ${opts} merge."${flags.name}".name "A custom merge driver for Salesforce profiles"`,
        {
          cwd: pjson.path,
        },
      )
      shell.exec(
        `git config ${opts} merge."${flags.name}".driver "${flags.driver}"`,
        {
          cwd: pjson.path,
        },
      )
      shell.exec(`git config ${opts} merge."${flags.name}".recursive binary`, {
        cwd: pjson.path,
      })
      mkdirp.sync(path.dirname(attrFile))
      let attrContents = ''
      try {
        const RE = new RegExp(`.* merge\\s*=\\s*${flags.name}$`)
        attrContents = fs
          .readFileSync(attrFile, 'utf8')
          .split(/\r?\n/)
          .filter((line) => !line.match(RE))
          .join('\n')
      } catch (error) {}
      if (attrContents && !attrContents.match(/[\n\r]$/g)) {
        attrContents += '\n'
      }
      attrContents += flags.files
        .map((f) => `${f} merge=${flags.name}`)
        .join('\n')
      attrContents += '\n'
      fs.writeFileSync(attrFile, attrContents)
      console.error(
        'sfdx-md-merge-driver:',
        flags.name,
        'installed to `git config',
        opts + '`',
        'and',
        attrFile,
      )
    }
  }
}
