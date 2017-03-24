import { Map, Set } from 'immutable'

import * as EvolvingImmutable from './transformations'
import * as NaiveImmutable from './naiveTransformations'

console.log('Comparing perf of group')
const generateLike = () => ({ 
  id: Math.floor(Math.random()*1000000),
  userId: Math.floor(Math.random()*100),
  dataPiece1: Math.floor(Math.random()*1000000)
})
const generateLikes = () => {
  const likesById = Map<any, any>().asMutable()
  for(let i=0; i<10000; ++i) {
    const like = generateLike()
    likesById.set(like.id, like)
  }
  return likesById.asImmutable()
}
const removeRandom = (likesById) => {
  const keys = likesById.keySeq()
  const chosenKey = keys.get(Math.floor(Math.random()*keys.size))
  return likesById.remove(chosenKey)
}
const addRandom = (likesById) => {
  const like = generateLike()
  return likesById.set(like.id, like)
}
const updateRandom = (likesById) => {
  const keys = likesById.keySeq()
  const chosenKey = keys.get(Math.floor(Math.random()*keys.size))
  return likesById.update(chosenKey, (like) => ({ ...generateLike(), id: like.id }))
}
const perturbLikes = (likesById) => {
  const decision = [removeRandom, addRandom, updateRandom][Math.floor(Math.random()*3)]
  return decision(likesById)
}

let likesById

const testContinuousModifications = (updateFn, noMods, sequenceLength=1000) => {
  console.log(`Sequence of ${sequenceLength} continuous objects - ${noMods} at a time`)
  console.time('sequence generation')
  const sequence = [generateLikes()]
  for(let i=0; i<sequenceLength-1; ++i) {
    const lastLikesById = sequence[sequence.length-1]
    let nextLikesById = lastLikesById
    for(let j=0; j<noMods; ++j) {
      nextLikesById = updateFn(nextLikesById)
    }
    sequence.push(nextLikesById)
  }
  console.timeEnd('sequence generation')

  const performARun = (name, fn) => {
    console.time(`${name} run`)
    for(let i=0; i<sequenceLength; ++i) {
      fn(sequence[i])
    }
    console.timeEnd(`${name} run`)
  }

  const groupByUser_ev = EvolvingImmutable.group(like => like.userId)
  performARun('evolving', groupByUser_ev)

  const groupByUser_na = NaiveImmutable.group(like => like.userId)
  performARun('naive', groupByUser_na)
}

testContinuousModifications(perturbLikes, 1)
testContinuousModifications(perturbLikes, 5)
testContinuousModifications(perturbLikes, 50)

testContinuousModifications(updateRandom, 5)
testContinuousModifications(updateRandom, 50)
testContinuousModifications(updateRandom, 500)
testContinuousModifications(updateRandom, 5000)

console.log('Discontinuous')
console.time('dry run')
for(let i=0; i<100; ++i) {
  likesById = generateLikes()
}
console.timeEnd('dry run')

console.time('evolving run')
const groupByUser_ev2 = EvolvingImmutable.group(like => like.userId)
for(let i=0; i<100; ++i) {
  likesById = generateLikes()
  groupByUser_ev2(likesById)
}
console.timeEnd('evolving run')

console.time('naive run')
const groupByUser_na2 = NaiveImmutable.group(like => like.userId)
for(let i=0; i<100; ++i) {
  likesById = generateLikes()
  groupByUser_na2(likesById)
}
console.timeEnd('naive run')
