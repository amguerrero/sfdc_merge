import {Command, flags} from '@oclif/command'
import * as fs from 'fs'

export default class Join extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    meta: flags.string({
      char: 'm',
      description: 'path(s) to file(s) to join',
      multiple: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Join)

    // const name = flags.name || 'world'
    // this.log(`hello ${name} from C:\\GitRepos\\sfdc_md_merge_driver\\src\\commands\\join.ts`)

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
    console.log(flags.meta)
  }
}
