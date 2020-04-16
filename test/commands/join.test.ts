/* eslint-disable unicorn/no-process-exit, no-process-exit */
import {expect, test} from '@oclif/test'

describe('join', () => {
  const strJoin =
    '{"_declaration":{"$":{"version":"1.0","encoding":"UTF-8"}},"Profile":{"$":{"xmlns":"http://soap.sforce.com/2006/04/metadata"},"layoutAssignments":[{"layout":{"_":"Account-Account Layout"}},{"layout":{"_":"Account-Account Layout"},"recordType":{"_":"Account.Customer"}}],"userPermissions":[{"enabled":{"_":"false"},"name":{"_":"ViewSetup"}}]}}'

  test
    .stub(process, 'exit', () => 'foobar')
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
      expect(ctx.stdout).to.contain('successfully joined')
      expect(ctx.stdout).to.contain(strJoin)
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stdout()
    .command([
      'join',
      '-m',
      './test/files/ancestor.profile-meta.xml',
      '-m',
      './test/files/empty.profile',
    ])
    .it('runs join with one empty', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stdout).to.contain('successfully joined')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stdout()
    .command([
      'join',
      '-m',
      './test/files/package1.xml',
      '-o',
      './test/files/package2.xml',
      '-v',
    ])
    .it('runs join verbose', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stdout).to.contain('teatment time')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stdout()
    .command([
      'join',
      '-a',
      'meld',
      '-m',
      './test/files/package1.xml',
      '-m',
      './test/files/package2.xml',
    ])
    .it('runs join meld', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stdout).to.contain('successfully joined')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stdout()
    .command([
      'join',
      '-a',
      'meld',
      '-m',
      './test/files/Case-fr.objectTranslation',
      '-m',
      './test/files/Case-fr.objectTranslation',
    ])
    .it('runs join variant unique key', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stdout).to.contain('successfully joined')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command(['join'])
    .it('runs join with no file', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('list of permissions to merge is empty')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command(['join', '-m', './test/files/non_existing.profile-meta.xml'])
    .it('runs join with inexisting file', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('at least a metadataFile is not accessible')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stdout()
    .command([
      'join',
      '-m',
      './test/files/WZ_Admin.profile',
      '-m',
      './test/files/WZ_Admin.profile',
      '-m',
      './test/files/WZ_Admin.profile',
      '-o',
      './test/files/WZ_Admin.profile',
    ])
    .it('runs join with big file', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stdout).to.contain('successfully joined')
    })
})
