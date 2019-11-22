const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

class MetadataMerger {
  parseStringSync (str) {
    var result
    new xml2js.Parser().parseString(str, (e, r) => {
      result = r
    })
    return result
  }

  getNodes (file) {
    return this.parseStringSync(
      fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8')
        : this.getNodeBaseXML()
    )[this.metadataType]
  }

  getBaseNodes () {
    return this.parseStringSync(this.getNodeBaseXML())
  }

  getMetadataType (path1, path2, path3) {
    let tmpFile = fs.existsSync(path1) ? fs.readFileSync(path1, 'utf8') : ''
    if (tmpFile.length === 0) {
      tmpFile = fs.existsSync(path2) ? fs.readFileSync(path2, 'utf8') : ''
      if (tmpFile.length === 0) {
        tmpFile = fs.existsSync(path3) ? fs.readFileSync(path3, 'utf8') : ''
      }
    }
    let lineToRead = 0
    const lines = tmpFile.split(/[\n\r]/)
    while (!lines[lineToRead].includes('xmlns')) {
      lineToRead = lineToRead + 1
    }
    switch (true) {
      case /.*profile.*/.test(lines[lineToRead].toLowerCase()):
        return 'Profile'
      case /.*permissionset.*/.test(lines[lineToRead].toLowerCase()):
        return 'PermissionSet'
      case /.*customlabels.*/.test(lines[lineToRead].toLowerCase()):
        return 'Labels'
      default:
        console.error('Bad input, this metadata type not handled')
        process.exit(1)
    }
  }

  getNodeBaseXML () {
    switch (this.metadataType) {
      case 'Profile':
        return '<?xml version="1.0" encoding="UTF-8"?><Profile xmlns="http://soap.sforce.com/2006/04/metadata"></Profile>'
      case 'PermissionSet':
        return '<?xml version="1.0" encoding="UTF-8"?><PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata"></PermissionSet>'
      case 'Labels':
        return '<?xml version="1.0" encoding="UTF-8"?><CustomLabels xmlns="http://soap.sforce.com/2006/04/metadata"></CustomLabels>'
      default:
        return null
    }
  }

  getConfigPath () {
    return path.join(
      __dirname,
      '..',
      '/conf/merge-' + this.metadataType.toLowerCase() + '-config.json'
    )
  }

  areNodesEqual (node1, node2, localpart) {
    const nodeTypeConfig = this.config[localpart]
    if (node2 == null || node2.node == null) {
      return [false, [null]]
    }

    if (nodeTypeConfig) {
      if (
        Array.isArray(nodeTypeConfig.equalKeys) &&
        nodeTypeConfig.equalKeys.length
      ) {
        const list = []
        for (const key of nodeTypeConfig.equalKeys) {
          if (node1[key] && node2.node) {
            if (
              node1[key][0] &&
              node2.node[key][0] &&
              node1[key][0] !== node2.node[key][0]
            ) {
              list.push({ key: key, value: node2.node[key][0] })
            }
          }
        }
        if (Array.isArray(list) && list.length) {
          return [false, list]
        } else {
          return [true, []]
        }
      } else {
        if (node1 === node2.node) {
          return [true, []]
        } else {
          return [false, node2.node]
        }
      }
    }
  }

  buildUniqueKey (node, localpart) {
    let uniqueKey = null
    const nodeTypeConfig = this.config[localpart]
    if (nodeTypeConfig) {
      uniqueKey = localpart + '#'
      if (nodeTypeConfig.uniqueKeys) {
        nodeTypeConfig.uniqueKeys.forEach(key => {
          if (node[key]) {
            uniqueKey += node[key][0] + '#'
          }
        })
      } else {
        let exclusiveUniqueKey = ''
        if (Array.isArray(nodeTypeConfig.exclusiveUniqueKeys)) {
          for (const euk of nodeTypeConfig.exclusiveUniqueKeys) {
            if (node[euk]) {
              if (node[euk][0]) {
                exclusiveUniqueKey = exclusiveUniqueKey + node[euk][0] + '#'
              }
            }
            if (exclusiveUniqueKey !== '') {
              break
            }
          }
          uniqueKey = uniqueKey + exclusiveUniqueKey
        }
      }
    }

    return uniqueKey
  }

  buildUniqueKeyCount (node, localpart, count) {
    let uniqueKey = this.buildUniqueKey(node, localpart)
    if (uniqueKey == null) {
      uniqueKey = localpart + `#${count}#`
    }

    return uniqueKey
  }

  constructor (O, A, B) {
    this.metadataType = this.getMetadataType(O, A, B)
    // console.log('using config ' + this.getConfigPath())
    this.config = JSON.parse(fs.readFileSync(this.getConfigPath(), 'utf8'))
  }
}

module.exports = MetadataMerger
