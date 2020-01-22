import * as path from 'path'
import * as pkgDir from 'pkg-dir'

class PackageJson {
  public path: string

  public name: string

  public version: string

  constructor() {
    this.path =
      pkgDir.sync(path.join(__dirname, '..', '..')) ||
      process.env.INIT_CWD ||
      process.cwd()
    this.name = require(path.join(this.path, 'package.json')).name
    this.version = require(path.join(this.path, 'package.json')).version
  }
}

module.exports = PackageJson
