import * as path from 'path'
import * as pkgDir from 'pkg-dir'
import * as fs from 'fs'

class PackageJson {
  public path: string

  public name: string

  public version: string

  constructor() {
    this.path =
      (process.env.INIT_CWD && path.join(process.env.INIT_CWD, '.git')) ||
      (process.cwd() && path.join(process.cwd(), '.git')) ||
      pkgDir.sync(path.join(__dirname, '..', '..'))
    this.path = path.join(this.path, '..')
    this.name = fs.existsSync(path.join(this.path, 'package.json'))
      ? require(path.join(this.path, 'package.json')).name
      : ''
    this.version = fs.existsSync(path.join(this.path, 'package.json'))
      ? require(path.join(this.path, 'package.json')).version
      : ''
  }
}

module.exports = PackageJson
