const path = require('path')
const pkgDir = require('pkg-dir')

class PackageJson {
  constructor () {
    this.path =
      pkgDir.sync(path.join(__dirname, '..', '..')) ||
      process.env.INIT_CWD ||
      process.cwd()
    this.name = require(path.join(this.path, 'package.json')).name
  }
}

module.exports = PackageJson
