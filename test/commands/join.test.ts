import {expect, test} from '@oclif/test'

describe('join', () => {
  test
    .stdout()
    .command(['join'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('')
    })
})
