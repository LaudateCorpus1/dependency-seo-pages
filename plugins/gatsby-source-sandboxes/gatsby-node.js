const crypto = require('crypto')
const algoliasearch = require('algoliasearch')
var uniqid = require('uniqid')
const fs = require('fs')
const { addMethods } = require('@algolia/client-common')
const customBrowse = require('./browse')

const sandboxesFile = './sandboxes.json'

const editedTime = () => {
  const week = 604800
  const stats = fs.statSync(sandboxesFile)
  const seconds = (new Date().getTime() - stats.mtime) / 1000
  return seconds > week
}

exports.sourceNodes = async ({ actions }, configOptions) => {
  const { createNode } = actions

  const index = addMethods(
    algoliasearch('ZACZHDBO7S', configOptions.apiKey).initIndex(
      configOptions.index
    ),
    { customBrowse }
  )

  function getEverything() {
    const hits = []
    return index
      .customBrowse({
        limit: '60000',
        batch(batch) {
          console.log('getting sandboxes')
          hits.push(...batch)
        }
      })
      .then(() => hits)
  }

  let data = []
  if (!fs.existsSync(sandboxesFile) || editedTime()) {
    const hits = await getEverything()
    console.log('getting info')

    const npmDeps = hits.reduce((accumulator, currentValue) => {
      currentValue.npm_dependencies.map(dep => {
        const found = accumulator.find(a => a.dependency === dep.dependency)

        if (found) {
          if (found.sandboxes.length > 50) return accumulator
          found.sandboxes.push(currentValue)
          return accumulator
        } else {
          accumulator.push({
            dependency: dep.dependency,
            sandboxes: [currentValue]
          })
          return accumulator
        }
      })

      return accumulator
    }, [])

    data = npmDeps
    fs.writeFileSync(sandboxesFile, JSON.stringify(data))
  } else {
    data = JSON.parse(fs.readFileSync(sandboxesFile))
  }
  console.log('creating data')
  data.forEach(datum =>
    createNode({
      ...datum,
      id: uniqid(),
      parent: null,
      children: [],
      internal: {
        type: 'SandboxDependency',
        contentDigest: crypto
          .createHash('md5')
          .update(JSON.stringify(datum))
          .digest('hex')
      }
    })
  )
  // We're done, return.
}
