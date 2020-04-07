/* eslint-disable unicorn/no-process-exit, no-process-exit */
import {expect, test} from '@oclif/test'
import * as shell from 'shelljs'
import * as path from 'path'

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
      path.join('.', 'test', 'files', 'ancestor.profile-meta.xml'),
      '-m',
      path.join('.', 'test', 'files', 'ours.profile-meta.xml'),
      '-m',
      path.join('.', 'test', 'files', 'theirs.profile-meta.xml'),
    ])
    .it('runs join', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('successfully joined')
      expect(ctx.stdout).to.contain(strJoin)
    })
})
