import {expect, test} from '@oclif/test'
import * as shell from 'shelljs'
import {getNodes} from '../../src/utils/file-helper'

describe('join', () => {
  afterEach(function () {
    shell.exec('git checkout -q -- test/files/*')
  })
  const strJoin =
    '{"Profile":{"$":{"xmlns":"http://soap.sforce.com/2006/04/metadata"},"userPermissions":[{"enabled":["false"],"name":["ViewSetup"]}]}}'

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .stdout()
    .command([
      'join',
      '-m',
      './test/files/ancestor.profile-meta.xml',
      '-m',
      './test/files/ours.profile-meta.xml',
      '-m',
      './test/files/theirs.profile-meta.xml',
    ])
    .it('runs join', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('successfully joined')
      expect(ctx.stdout).equals(strJoin)
    })
})
