import * as fs from 'fs'
import * as path from 'path'
import * as es from 'event-stream'
import * as xml2js from 'xml2js'
import {buildUniqueKey} from '../utils/merge-helper'

const regGenericMatch = /(?<=<)(\w+)(?= +xmlns)/

const builder = new xml2js.Builder({
  xmldec: {version: '1.0', encoding: 'UTF-8'},
  renderOpts: {pretty: true, indent: '    ', newline: '\n'},
  xmlns: true,
})

async function fileExists(file) {
  return new Promise((resolve) => {
    // try {
    fs.access(file, fs.constants.F_OK, (error) => {
      if (error) {
        console.error(`${file} is not accessible`)
        resolve(false)
      }
      resolve(true)
    })
  })
}

export async function allFilesExist(files: string[]) {
  const tabPromise = []
  let output
  for (const key of files) {
    tabPromise.push(fileExists(key))
  }
  await Promise.all(tabPromise).then((data) => {
    output = !data.includes(false)
  })
  return output
}

async function getMetafromFile(file) {
  return new Promise((resolve) => {
    let output
    const s = fs
      .createReadStream(file)
      .pipe(es.split())
      .pipe(
        es.mapSync(function (line) {
          const match = line.match(regGenericMatch)
          if (match !== null) {
            output = match[0]
            s.destroy()
          }
        }),
      )
      .on('close', () => {
        resolve(output)
      })
  })
}

function getConfigPath(meta) {
  return path.join(
    __dirname,
    '..',
    '..',
    '/conf/merge-' + meta.toLowerCase() + '-config.json',
  )
}

export async function getMetaConfigJSON(meta) {
  return new Promise((resolve) => {
    fs.readFile(
      getConfigPath(meta),
      {flag: 'r', encoding: 'utf8'},
      (err, data) => {
        if (err) throw err
        resolve(JSON.parse(data))
      },
    )
  })
}

export async function getMetadataType(files: string[]) {
  const tabPromise = []
  let output
  for (const key of files) {
    tabPromise.push(getMetafromFile(key))
  }
  await Promise.all(tabPromise)
    .then((data) => {
      data = data.filter((el, i, a) => el !== undefined && i === a.indexOf(el))
      if (data.length > 1) {
        // eslint-disable-next-line no-throw-literal
        throw 'multiple metadataTypes given as input'
      }
      output = data.filter(
        (el, i, a) => el !== undefined && i === a.indexOf(el),
      )[0]
    })
    .catch((error) => {
      throw error
    })
  return output
}

function getNodeBaseJSON(meta) {
  const result = {}
  switch (meta) {
    default:
      result[meta] = {$: {xmlns: 'http://soap.sforce.com/2006/04/metadata'}}
      return result
  }
}

async function getNodesFromXmlFile(file) {
  return new Promise((resolve) => {
    fs.readFile(file, {flag: 'r', encoding: 'utf8'}, (err, data) => {
      if (err) throw err
      xml2js.parseString(data, (e, r) => {
        resolve(r)
      })
    })
  })
  // .then((result) => {
  //   return result
  // })
}

async function getNodesOfMeta(file, meta) {
  return getNodesFromXmlFile(file).then((result) => {
    if (result[meta]) {
      return result[meta]
    }
    return {}
  })
}

async function getKeyedNodesOfMeta(file, meta, configJson) {
  return getNodesOfMeta(file, meta).then((result) => {
    if (result) {
      const ancient = []
      Object.keys(result).forEach((localpart) => {
        let nodelist = result[localpart]
        if (!Array.isArray(nodelist)) {
          nodelist = [nodelist]
        }
        nodelist.forEach((node) => {
          const uniqueNodeKey = buildUniqueKey(node, localpart, configJson)
          if (uniqueNodeKey) {
            ancient[uniqueNodeKey] = {
              nodeType: localpart,
              node: node,
            }
          }
        })
      })
      return ancient
    }
    return {}
  })
}

export async function getKeyedFiles(files: string[], meta, configJson) {
  const tabPromise = []
  let output
  for (const file of files) {
    tabPromise.push(getKeyedNodesOfMeta(file, meta, configJson))
  }
  await Promise.all(tabPromise)
    .then((data) => {
      output = data
    })
    .catch((error) => {
      throw error
    })
  return output
}

export async function writeOutput(meta, file, jsonOutput) {
  const base = getNodeBaseJSON(meta)
  Object.assign(base[meta], jsonOutput)
  if (file !== undefined && file !== '') {
    fs.writeFileSync(file, builder.buildObject(base))
  } else {
    console.log('joined:', JSON.stringify(base))
  }
}
