import * as fs from 'fs'
import * as es from 'event-stream'

const regProfile = /.*<Profile xmlns/
const regPSet = /.*<PermissionSet xmlns/
const regLabel = /.*<CustomLabels xmlns/

async function getMetafromFile(file) {
  return new Promise((resolve, reject) => {
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

export async function getMetadataType(files: string[]) {
  const tabPromise = []
  let output
  for (const key of files) {
    tabPromise.push(getMetafromFile(key))
  }
  await Promise.race(tabPromise)
    .then(data => {
      output = data
    })
    .catch(error => {
      console.log(error)
    })
  return output
}
