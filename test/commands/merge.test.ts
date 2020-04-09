/* eslint-disable unicorn/no-process-exit, no-process-exit */
import {expect, test} from '@oclif/test'
import * as shell from 'shelljs'

describe('merge', () => {
  afterEach(function () {
    shell.exec('git checkout -q -- test/files/*')
  })

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command([
      'merge',
      './test/files/ancestor.profile-meta.xml',
      './test/files/ours.profile-meta.xml',
      './test/files/theirs.profile-meta.xml',
      './test/files/ancestor.profile-meta.xml',
    ])
    .it('runs merge', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('Conflicts Found: 2')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command([
      'merge',
      'no_file',
      './test/files/ours.profile-meta.xml',
      './test/files/theirs.profile-meta.xml',
      './test/files/ancestor.profile-meta.xml',
    ])
    .it('runs merge (w/o ancestor)', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('successfully merged')
    })

  /*   test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command([
      'merge',
      './test/files/ancestor.profile-meta.xml',
      'no_file',
      './test/files/theirs.profile-meta.xml',
      './test/files/ancestor.profile-meta.xml',
    ])
    .it('runs merge (w/o ours)', ctx => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('successfully merged')
    }) */

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command([
      'merge',
      './test/files/ancestor.profile-meta.xml',
      './test/files/ours.profile-meta.xml',
      'no_file',
      './test/files/ancestor.profile-meta.xml',
    ])
    .it('runs merge (w/o theirs)', (ctx) => {
      expect(process.exit()).to.equal('foobar')
      expect(ctx.stderr).to.contain('Conflicts Found: 2')
    })

  test
    .stub(process, 'exit', () => 'foobar')
    .stderr()
    .command([
      'merge',
      './test/files/WZ_Admin.profile',
      './test/files/WZ_Admin.profile',
      './test/files/WZ_Admin.profile',
      './test/files/WZ_Admin.profile',
    ])
    .it('runs merge big files', () => {
      expect(process.exit()).to.equal('foobar')
    })
})
