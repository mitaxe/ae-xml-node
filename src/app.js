import fs from 'fs'
import chalk from 'chalk'
import yargs from 'yargs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { TEXT_CONTENT, MIN_MATCHES } from './constants'
import { validateParserParams } from './utils'

function getTargetElement (targetElementId, file) {
  const sampleFile = fs.readFileSync(path.resolve(`public/${file}`))
  const dom = new JSDOM(sampleFile)

  const button = dom.window.document.getElementById(targetElementId)
  const array = Array.prototype.slice.apply(button.attributes)
  return array.reduce((hash, item, index) => {
    if (item.name !== 'id') {
      hash[item.name] = item.value
    }

    if (array.length - 1 === index) {
      hash[TEXT_CONTENT] = button.textContent
    }
    return hash
  }, {})
}

function searchElementInDoc (file, attrs) {
  const sampleFile = fs.readFileSync(path.resolve(`public/${file}`))
  const dom = new JSDOM(sampleFile)
  const btnClass = attrs.class.split(' ')[0]
  const nodes = dom.window.document.querySelectorAll(`.${btnClass}`)
  const scoredElements = Object.keys(nodes).map(item => ({
    element: nodes[item],
    score: 0
  }))

  Object.keys(scoredElements).map(elemKey => {
    const element = scoredElements[elemKey].element
    const elementAttributes = Array.prototype.slice.apply(element.attributes)
    elementAttributes[TEXT_CONTENT] = element.textContent
    elementAttributes.map(attr => {
      if (attr.value === attrs[attr.name]) {
        scoredElements[elemKey].score += 1
      }
    })

    if (element.textContent === attrs[TEXT_CONTENT]) {
      scoredElements[elemKey].score += 1
    }
  })

  const maxScore = scoredElements.reduce((max, b) => Math.max(max, b.score), scoredElements[0].score)
  const searchable = scoredElements.find(elem => elem.score === maxScore)
  if (searchable.score < MIN_MATCHES) {
    console.log(chalk.red('Too few coincidences. Element not found'))
    return
  }

  const nodePath = getNestedNodeRecursively(searchable.element).reverse()
  userInfo(nodePath, searchable, attrs)
}

function userInfo (nodePath, searchable, attrs) {
  console.log('Path:', chalk.blue(nodePath.map(node => node.tagName && node.tagName.toLowerCase()).join(' > ') + ' > ' + searchable.element.tagName.toLowerCase()))

  const elementAttributes = Array.prototype.slice.apply(searchable.element.attributes)
  elementAttributes.map(attr => {
    if (attr.value === attrs[attr.name]) {
      console.log(`${chalk.red(attr.name)} ${attrs[attr.name]} of input element is the same`)
    }
  })

  if (searchable.element.textContent === attrs[TEXT_CONTENT]) {
    console.log(`${chalk.red('Button text')} is the same`)
  }
}

function getNestedNodeRecursively (elem, arr = []) {
  if (elem.parentNode) {
    const newNode = elem.parentNode
    arr.push(elem.parentNode)
    getNestedNodeRecursively(newNode, arr)
  }

  return arr
}

function startParser () {
  const params = yargs.argv._
  const isValid = validateParserParams(params)
  if (!isValid) {
    console.log(chalk.red('Incorrect input params.'))
    return
  }

  try {
    const inputAttrs = getTargetElement(params[0], params[1])
    console.log(chalk.green(`Successfully found element with id - '#${params[0]}'`))
    console.log(chalk.green(`Attributes: ${JSON.stringify(inputAttrs, null, 2)})`))
    searchElementInDoc(params[2], inputAttrs)
  } catch (err) {
    console.log(chalk.red('Error trying to find element by id', err))
  }
}

startParser()
