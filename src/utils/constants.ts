export const constants = Object.freeze({
  ERR_META_NOT_REACHABLE: new Error(
    'at least a metadataFile is not accessible',
  ),
  ERR_META_NOT_SUPPORT: new Error('unsupported metadata Type'),
  ERR_META_MULTI: new Error('multiple metadataTypes given as input'),
  steps: {
    global: 'teatment time',
    inputs: 'input check time',
    join: {
      getMeta: 'get metadaType time',
      getConf: 'get config time',
      getFiles: 'get keyed files time',
      joinFiles: 'join keyed time',
      unKeyFiles: 'transform keyed to unkeyed',
      writeFile: 'writing keyed time',
    },
  },
})
