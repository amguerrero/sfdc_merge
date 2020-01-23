import {Command} from '@oclif/command'
import * as shell from 'shelljs'
import * as path from 'path'

export abstract class MergeDriverBase extends Command {
  public findAttributes(global: boolean, pjpath: string) {
    let attrFile
    if (global) {
      try {
        attrFile = shell
          .exec('git config --global core.attributesfile', {
            cwd: pjpath,
            silent: true,
          })
          .toString()
          .trim()
      } catch (error) {}
      // istanbul ignore else
      if (!attrFile) {
        // if (process.env.XDG_CONFIG_HOME) {
        // attrFile = path.join(process.env.XDG_CONFIG_HOME, 'git', 'attributes')
        // } else {
        attrFile = path.join(process.env.HOME, '.config', 'git', 'attributes')
        // }
      }
    } else {
      const gitDir = shell
        .exec('git rev-parse --git-dir', {
          encoding: 'utf8',
          cwd: pjpath,
          silent: true,
        })
        .trim()
      attrFile = path.join(gitDir, 'info', 'attributes')
    }
    return attrFile
  }
}
