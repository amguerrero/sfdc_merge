import * as fs from 'fs'
import * as path from 'path'
import * as es from 'event-stream'
// import * as xml2js from 'xml2js'
import * as xmljs from 'xml-js'
import {buildUniqueKey} from '../utils/merge-helper'
import {startTimer, endTimer} from '../utils/verbose-helper'

const fsp = fs.promises
const regGenericMatch = /(?<=<)(\w+)(?= +xmlns)/
const optXml2js = {compact: true, textKey: '_', attributesKey: '$'}
const optJs2xml = {compact: true, textKey: '_', attributesKey: '$', spaces: 4}

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
  return fsp
    .readFile(getConfigPath(meta), {flag: 'r', encoding: 'utf8'})
    .then((data) => {
      return JSON.parse(data)
    })
}

export async function getMetadataType(files: string[]) {
  return Promise.all(
    files.map((file) => {
      return getMetafromFile(file)
    }),
  ).then((data) => {
    data = data.filter((el, i, a) => el !== undefined && i === a.indexOf(el))
    if (data.length > 1) {
      // eslint-disable-next-line no-throw-literal
      throw 'multiple metadataTypes given as input'
    }
    const filteredData = data.filter(
      (el, i, a) => el !== undefined && i === a.indexOf(el),
    )
    return filteredData[0]
  })
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

export async function getKeyedFiles(
  files: string[],
  meta,
  configJson,
  verbose: boolean,
) {
  return Promise.all(
    files.map((file, index) => {
      startTimer(
        verbose,
        'file: ' +
          file +
          ' index: ' +
          index.toString().padStart(3) +
          ' reading',
      )
      return fsp
        .readFile(file, {flag: 'r', encoding: 'utf8'})
        .then((data) => {
          endTimer(
            verbose,
            'file: ' +
              file +
              ' index: ' +
              index.toString().padStart(3) +
              ' reading',
          )
          startTimer(
            verbose,
            'file: ' +
              file +
              ' index: ' +
              index.toString().padStart(3) +
              ' parsing xml',
          )
          const xmljsResult = xmljs.xml2js(data, optXml2js)
          endTimer(
            verbose,
            'file: ' +
              file +
              ' index: ' +
              index.toString().padStart(3) +
              ' parsing xml',
          )
          return xmljsResult
        })
        .then((result) => {
          if (result[meta]) {
            return result[meta]
          }
          return {}
        })
        .then((data) => {
          startTimer(
            verbose,
            'file: ' +
              file +
              ' index: ' +
              index.toString().padStart(3) +
              ' keying',
          )
          const keyedTab = []
          for (const localType of Object.keys(data)) {
            const result = []
            let nodelist = data[localType]
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
            Object.assign(keyedTab, result)
          }
          endTimer(
            verbose,
            'file: ' +
              file +
              ' index: ' +
              index.toString().padStart(3) +
              ' keying',
          )
          return keyedTab
        })
    }),
  )
}

export async function writeOutput(meta, file, jsonOutput) {
  const base = getNodeBaseJSON(meta)
  Object.assign(base[meta], jsonOutput)
  if (file !== undefined && file !== '') {
    fsp.writeFile(file, xmljs.js2xml(base, optJs2xml), {encoding: 'utf8'})
  } else {
    console.log('joined:', JSON.stringify(base))
  }
}
