import * as tf from '@tensorflow/tfjs'
import { COCO_CLASSESS, ANCHORS, ANCHORS_TINY } from './config'

const grenerateArr = (num: number) => Array(num).fill(0).map((v, i) => i)

function yoloHead (
  feats: tf.Tensor,
  anchors: tf.Tensor2D,
  numClasses: number,
  inputShape: number[]
) {
  return tf.tidy(() => {
    const numAnchors = anchors.shape[0]

    // Reshape to height, width, num_anchors, box_params.
    const anchorsTensor = anchors.reshape([1, numAnchors, 2])

    const gridShape = feats.shape.slice(0, 2) // height, width
    const gridY = tf.tile(tf.reshape(grenerateArr(gridShape[0]), [-1, 1, 1, 1]), [1, gridShape[1], 1, 1])
    const gridX = tf.tile(tf.reshape(grenerateArr(gridShape[1]), [1, -1, 1, 1]), [gridShape[0], 1, 1, 1])

    let grid = gridX.concat(gridY, 3)

    grid = tf.cast(grid, feats.dtype)
    const newfeats = tf.reshape(feats, [gridShape[0], gridShape[1], numAnchors, numClasses + 5])

    // Adjust preditions to each spatial grid point and anchor size.
    const [xy, wh, con, probs] = tf.split(newfeats, [2, 2, 1, 80], 3)

    const boxXY = tf.div(tf.add(tf.sigmoid(xy), grid), gridShape.reverse())
    const boxWH = tf.div(tf.mul(tf.exp(wh), anchorsTensor), inputShape.reverse())

    const boxConfidence = tf.sigmoid(con)
    const boxClassProbs = tf.sigmoid(probs)

    return [boxXY, boxWH, boxConfidence, boxClassProbs]
  })
}

// Get corrected boxes

function yoloCorrectBoxes (
  boxXY: tf.Tensor,
  boxWH: tf.Tensor,
  inputShape: number[],
  imageShape: number[]
) {
  // boxXY.print()
  return tf.tidy(() => {
    let boxYX = tf.concat(tf.split(boxXY, [1, 1], 3).reverse(), 3)
    let boxHW = tf.concat(tf.split(boxWH, [1, 1], 3).reverse(), 3)

    const scale = tf.div(inputShape, imageShape)
    boxYX = tf.div(tf.mul(boxYX, inputShape), scale)
    boxHW = tf.div(tf.mul(boxHW, inputShape), scale)

    const boxMins = tf.sub(boxYX, tf.div(boxHW, 2))
    const boxMaxes = tf.add(boxYX, tf.div(boxHW, 2))

    const boxes = tf.concat([
      ...tf.split(boxMins, [1, 1], 3),
      ...tf.split(boxMaxes, [1, 1], 3)
    ], 3)

    return boxes
  })
}

/**
 * Process Conv layer output
 */
function yoloBoxesAndScores (
  feats: tf.Tensor,
  anchors: tf.Tensor2D,
  numClasses: number,
  inputShape: number[],
  imageShape: number[]
) {
  const [boxXY, boxWH, boxConfidence, boxClassProbs] = yoloHead(feats, anchors, numClasses, inputShape)
  let boxes = yoloCorrectBoxes(boxXY, boxWH, inputShape, imageShape)
  boxes = boxes.reshape([-1, 4])

  let boxScores = tf.mul(boxConfidence, boxClassProbs)
  boxScores = boxScores.reshape([-1, numClasses])

  return [boxes, boxScores]
}

/**
 * Evaluate YOLO model on given input and return filtered boxes.
 */
async function yoloEval (
  output: tf.Tensor[],
  anchors: tf.Tensor2D,
  numberClasses: number,
  imageShape: number[],
  maxBoxs: number = 20,
  scoreThreshold: number = 0.3,
  iouThreshold: number = 0.45
) {
  const numLayers = output.length
  const anchorMask = numLayers === 3 ? [[6, 7, 8], [3, 4, 5], [0, 1, 2]] : [[3, 4, 5], [1, 2, 3]] // default setting

  const inputShape = output[0].shape.slice(0, 2).map(num => num * 32)
  const boxesArr = []
  const boxScoresArr = []

  for (let index = 0; index < numLayers; index++) {
    const [_boxes, _boxScores] = yoloBoxesAndScores(
      output[index],
      anchors.gather(tf.cast(tf.tensor1d(anchorMask[index]), 'int32')),
      numberClasses,
      inputShape,
      imageShape)
    boxesArr.push(_boxes)
    boxScoresArr.push(_boxScores)
  }

  const boxes = tf.concat(boxesArr, 0)
  const boxScores = tf.concat(boxScoresArr, 0)

  let boxes_: Float32Array[][] = []
  let scores_: Float32Array[] = []
  let classes_: number[] = []

  const splitBoxScores = tf.split(boxScores, Array(numberClasses).fill(1), 1)

  for (let index = 0; index < numberClasses; index++) {
    const nmsIndex = await tf.image.nonMaxSuppressionAsync(boxes as tf.Tensor<tf.Rank.R2>, splitBoxScores[index].reshape([-1]), maxBoxs, iouThreshold, scoreThreshold)
    if (!nmsIndex.size) continue

    const classBoxes = tf.gather(boxes, nmsIndex)
    const classBoxScores = tf.gather(splitBoxScores[index], nmsIndex)

    boxes_ = boxes_.concat(tf.split(classBoxes, Array(nmsIndex.size).fill(1)).map(d => d.dataSync() as Float32Array))
    scores_ = scores_.concat(tf.split(classBoxScores, Array(nmsIndex.size).fill(1)).map(d => d.dataSync() as Float32Array))
    classes_ = classes_.concat(Array(nmsIndex.size).fill(index))

    classBoxScores.dispose()
    classBoxes.dispose()
  }

  boxes.dispose()
  boxScores.dispose()

  return boxes_.map((box, i) => {
    return {
      top: box[0],
      left: box[1],
      bottom: box[2],
      right: box[3],
      width: +box[3] - +box[1],
      height: +box[2] - +box[0],
      scores: scores_[i][0],
      classes: COCO_CLASSESS[classes_[i]]
    }
  })
}

let model: tf.Model
const $canvas = document.createElement('canvas')
$canvas.width = 416
$canvas.height = 416
const ctx = $canvas.getContext('2d') as CanvasRenderingContext2D

export async function yolov3Tiny (
  { modelUrl = 'https://zqingr.github.io/tfjs-yolov3-demo/model/yolov3-tiny/model.json', anchors = ANCHORS_TINY } :
  { modelUrl?: string, anchors?: number[] } = {}
) {
  const yoloTinyData = await yolo({ modelUrl, anchors })
  return yoloTinyData
}
export async function yolov3 (
  { modelUrl = 'https://zqingr.github.io/tfjs-yolov3-demo/model/yolov3/model.json', anchors = ANCHORS } :
  { modelUrl?: string, anchors?: number[] } = {}
) {
  const yoloData = await yolo({ modelUrl, anchors })
  return yoloData
}

async function yolo (
  { modelUrl, anchors } :
  { modelUrl: string, anchors: number[] }
) {
  const model = await tf.loadModel(modelUrl)

  return async ($img: HTMLImageElement) => {
    ctx.drawImage($img, 0, 0, 416, 416)

    const sample = tf.stack([
      // tf.div(tf.cast(tf.fromPixels(document.getElementById('test-canvas') as HTMLCanvasElement), 'float32'), 255)
      tf.div(tf.cast(tf.fromPixels($canvas), 'float32'), 255)
    ])
    let output = await model.predict(sample) as tf.Tensor[]
    output = output.map(feats => feats.reshape(feats.shape.slice(1)))

    const boxes = await yoloEval(
      output,
      tf.tensor1d(anchors).reshape([-1, 2]),
      COCO_CLASSESS.length,
      [$img.clientHeight, $img.clientWidth]
      // [416, 416]
    )
    return boxes
  }
}
