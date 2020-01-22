import {expect, test} from '@oclif/test'

describe('uninstall', () => {
  test
    .stdout()
    .command(['uninstall'])
    .it('runs uninstall', ctx => {
      expect(ctx.stdout).to.contain('')
    })
})
