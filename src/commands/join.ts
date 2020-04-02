import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import {getMetadataType, getMetaConfigJSON} from '../utils/file-helper'

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
    // let meta
    // await getMetadataType(flags.meta).then(data => {
    //   meta = data
    // })
    // console.log('meta: ' + meta)
    let meta
    await getMetadataType(flags.meta)
      .then(result => {
        meta = result
        console.log('result meta:', meta)
      })
      .catch(error => {
        console.error(error)
        throw error
      })
    await getMetaConfigJSON(meta)
      .then(result => {
        console.log(JSON.stringify(result))
      })
      .catch(error => {
        console.error(error)
        throw error
      })
    // await getMetaConfigJSON(meta).then(result => {
    //   console.log(result)
    // })
  }
}
