import * as fs from 'fs'

import * as path from 'path'
import * as es from 'event-stream'
// import * as xml2js from 'xml2js'
import * as xmljs from 'xml-js'
import {buildUniqueKey} from '../utils/merge-helper'
import {startTimer, endTimer} from '../utils/verbose-helper'

const fsp = fs.promises
const regGenericMatch = /(?<=<)(\w+)(?= +xmlns)/

// const builder = new xml2js.Builder({
//   xmldec: {version: '1.0', encoding: 'UTF-8'},
//   renderOpts: {pretty: true, indent: '    ', newline: '\n'},
//   xmlns: true,
// })

export async function allFilesExist(files: string[]) {
  return Promise.all(files.map((file) => fsp.access(file, fs.constants.F_OK)))
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
  // eslint-disable-next-line dot-notation
  result['_declaration'] = {$: {version: '1.0', encoding: 'UTF-8'}}
  switch (meta) {
    default:
      result[meta] = {$: {xmlns: 'http://soap.sforce.com/2006/04/metadata'}}
      return result
  }
}

async function treatNodeUniqueKey(localType, localNode, configJson) {
  const result = []
  let nodelist = localNode
  if (!Array.isArray(nodelist)) {
    nodelist = [nodelist]
  }
  nodelist.forEach((node) => {
    const uniqueNodeKey = buildUniqueKey(node, localType, configJson)
    if (uniqueNodeKey) {
      result[uniqueNodeKey] = {
        nodeType: localType,
        node: node,
      }
    }
  })
  return result
}

export async function getKeyedFiles(
  files: string[],
  meta,
  configJson,
  verbose: boolean,
) {
  const tabPromise = []
  let output
  for (const index of files.keys()) {
    tabPromise.push(
      fsp
        .readFile(files[index], {flag: 'r', encoding: 'utf8'})
        .then((data) => {
          startTimer(
            verbose,
            'xml parsing file: ' + files[index] + ' index: ' + index,
          )
          const xmljsResult = xmljs.xml2js(data, {
            compact: true,
            textKey: '_',
            attributesKey: '$',
          })
          endTimer(
            verbose,
            'xml parsing file: ' + files[index] + ' index: ' + index,
          )
          return xmljsResult
        })
        .then((result) => {
          if (result[meta]) {
            return result[meta]
          }
          return {}
        })
        .then(async (result) => {
          startTimer(
            verbose,
            'keying file: ' + files[index] + ' index: ' + index,
          )
          if (result) {
            const keyedTab = []
            const tabPromise = []
            for (const localType of Object.keys(result)) {
              tabPromise.push(
                treatNodeUniqueKey(
                  localType,
                  result[localType],
                  configJson,
                ).then((elem) => {
                  Object.assign(keyedTab, elem)
                }),
              )
            }
            await Promise.all(tabPromise)
            endTimer(
              verbose,
              'keying file: ' + files[index] + ' index: ' + index,
            )
            return keyedTab
          }
          endTimer(verbose, 'keying file: ' + files[index] + ' index: ' + index)
          return {}
        }),
    )
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
    // fs.writeFileSync(file, builder.buildObject(base))
    fs.writeFileSync(
      file,
      xmljs.js2xml(base, {
        compact: true,
        textKey: '_',
        attributesKey: '$',
        spaces: 4,
      }),
    )
  } else {
    console.log('joined:', JSON.stringify(base))
  }
}
