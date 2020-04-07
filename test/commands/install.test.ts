import {expect, test} from '@oclif/test'

describe('install', () => {
  test
    .timeout(10000)
    .stdout()
    .command(['install'])
    .it('runs install', (ctx) => {
      expect(ctx.stdout).to.contain('')
    })
})
