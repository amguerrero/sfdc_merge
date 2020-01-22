import {expect, test} from '@oclif/test'

describe('install', () => {
  test
    .stdout()
    .command(['install'])
    .it('runs install', ctx => {
      expect(ctx.stdout).to.contain('')
    })
})
