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
      '-o',
      './test/files/ancestor.profile-meta.xml',
      '-a',
      './test/files/ours.profile-meta.xml',
      '-b',
      './test/files/theirs.profile-meta.xml',
      '-p',
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
      '-o',
      'no_file',
      '-a',
      './test/files/ours.profile-meta.xml',
      '-b',
      './test/files/theirs.profile-meta.xml',
      '-p',
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
      '-o',
      './test/files/ancestor.profile-meta.xml',
      '-a',
      './test/files/ours.profile-meta.xml',
      '-b',
      'no_file',
      '-p',
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
      '-o',
      './test/files/WZ_Admin.profile',
      '-a',
      './test/files/WZ_Admin.profile',
      '-b',
      './test/files/WZ_Admin.profile',
      '-p',
      './test/files/WZ_Admin.profile',
    ])
    .it('runs merge big files', () => {
      expect(process.exit()).to.equal('foobar')
    })
})
