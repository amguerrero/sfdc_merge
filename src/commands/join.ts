import {Command, flags} from '@oclif/command'

export default class Join extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    meta: flags.string({char: 'm', description: 'path(s) to file(s) to join', multiple: true}),
  }

  async run() {
    const {flags} = this.parse(Join)

    // const name = flags.name || 'world'
    // this.log(`hello ${name} from C:\\GitRepos\\sfdc_md_merge_driver\\src\\commands\\join.ts`)

    console.log(flags.meta)
  }
}
