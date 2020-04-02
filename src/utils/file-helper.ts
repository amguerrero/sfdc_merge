import * as fs from 'fs'
import * as path from 'path'
import * as es from 'event-stream'

const regProfile = /.*<Profile xmlns/
const regPSet = /.*<PermissionSet xmlns/
const regLabel = /.*<CustomLabels xmlns/

async function getMetafromFile(file) {
  return new Promise(resolve => {
    let output
    const s = fs
      .createReadStream(file)
      .pipe(es.split())
      .pipe(
        es.mapSync(function(line) {
          switch (true) {
            case regProfile.test(line):
              output = 'Profile'
              s.destroy()
              break
            case regPSet.test(line):
              output = 'PermissionSet'
              s.destroy()
              break
            case regLabel.test(line):
              output = 'CustomLabels'
              s.destroy()
              break
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
  return new Promise(resolve => {
    let output = ''
    //   const s = fs
    //     .createReadStream(getConfigPath(meta))
    //     .pipe(es.parse())
    //     .on('end', data => {
    //       resolve(data)
    //     })
    fs.createReadStream(getConfigPath(meta))
      .pipe(
        es.mapSync(function(data) {
          // console.log(data)
          output = output.concat(data)
        }),
      )
      .on('end', () => {
        const jsonO = JSON.parse(output)
        const result = {}
        for (const x of Object.keys(jsonO)) {
          result[x] =
            jsonO[x].uniqueKeys === undefined
              ? jsonO[x].exclusiveUniqueKeys
              : jsonO[x].uniqueKeys
        }
        resolve(result)
      })
  })
}

export async function getMetadataType(files: string[]) {
  const tabPromise = []
  let output
  for (const key of files) {
    tabPromise.push(getMetafromFile(key))
  }
  await Promise.all(tabPromise)
    .then(data => {
      data = data.filter((el, i, a) => el !== undefined && i === a.indexOf(el))
      if (data.length > 1) {
        // eslint-disable-next-line no-throw-literal
        throw 'multiple metadataTypes given as input'
      }
      output = data.filter(
        (el, i, a) => el !== undefined && i === a.indexOf(el),
      )[0]
    })
    .catch(error => {
      throw error
    })
  return output
}
