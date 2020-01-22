import {flags} from '@oclif/command'
import {MergeDriverBase} from '../base'
import * as path from 'path'
import * as shell from 'shelljs'
import * as fs from 'fs'

const PackageJson = require('../utils/package-json')
const pjson = new PackageJson()

export default class Uninstall extends MergeDriverBase {
  static description = 'Remove a previously configured driver'

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
    name: flags.string({
      char: 'n',
      description:
        'String to use as the merge driver name in your configuration.',
      default: 'sfdx-md-merge-driver',
    }),
  }

  async run() {
    const {flags} = this.parse(Uninstall)
    if (pjson.name !== 'sfdx-md-merge-driver') {
      const attrFile = path.join(
        pjson.path,
        this.findAttributes(flags.global, pjson.path),
      )
      const opts = flags.global ? '--global' : '--local'
      try {
        shell.exec(
          `git config ${opts} --remove-section merge."${flags.name}"`,
          {
            cwd: pjson.path,
            silent: true,
          },
        )
      } catch (error) {}
      let currAttrs
      try {
        currAttrs = fs.readFileSync(attrFile, 'utf8').split('\n')
      } catch (error) {}
      if (currAttrs) {
        let newAttrs = ''
        currAttrs.forEach(attr => {
          const match = attr.match(/ merge=(.*)$/i)
          if (!match || match[1].trim() !== flags.name) {
            newAttrs += attr + '\n'
          }
        })
        fs.writeFileSync(attrFile, newAttrs.trim())
      }
      console.error(
        'sfdx-md-merge-driver:',
        flags.name,
        'uninstalled from `git config',
        opts + '`',
        'and',
        attrFile,
      )
    }
  }
}
