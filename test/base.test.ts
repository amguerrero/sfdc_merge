import {Config} from '@oclif/config'
import {flags} from '@oclif/command'
import {expect} from 'chai'
import * as path from 'path'

import {MergeDriverBase} from '../src/base'

class AutocompleteTest extends MergeDriverBase {
  run(): PromiseLike<any> {
    throw new Error('Method not implemented.')
  }

  public static id = 'test:foo'

  protected static flagsConfig = {
    bar: flags.boolean({
      description: 'bar',
    }),
  }
}

const root = path.resolve(__dirname, path.join('..', '..', 'package.json'))
const config = new Config({root})

const cmd = new AutocompleteTest([], config)

describe('MergeDriverBase', () => {
  it('#findAttributes (global)', async () => {
    expect(cmd.findAttributes(true, '.')).to.contains(
      path.join('.config', 'git', 'attributes'),
    )
  })

  it('#findAttributes (local)', async () => {
    expect(cmd.findAttributes(false, '.')).to.eq(
      path.join('.git', 'info', 'attributes'),
    )
  })
})
