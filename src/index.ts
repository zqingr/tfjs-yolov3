// import { yolov3Tiny } from './yolo/yolo-eval'
import { yolov3Tiny } from '../dist/index.bundle'

import './style.css'
import * as tf from '@tensorflow/tfjs'

// async function load () {
//   const model = await tf.loadModel('/model/yolov3-tiny/model.json')
//   // const model = await tf.loadModel('https://zqingr.github.io/tfjs-yolov3-demo/model/yolov3-tiny/model.json')

//   model.summary()
// }
// load()

const $img = document.getElementById('img') as HTMLImageElement

async function start () {
  const yolo = await yolov3Tiny({ modelUrl: '/model/yolov3-tiny/model.json' })
  const boxes = await yolo($img)

  const $imgbox = document.getElementById('img-box') as HTMLElement

  boxes.forEach(box => {
    const $div = document.createElement('div')
    $div.className = 'rect'
    $div.style.top = box.top + 'px'
    $div.style.left = box.left + 'px'
    $div.style.width = box.width + 'px'
    $div.style.height = box.height + 'px'
    $div.innerHTML = `<span class='className'>${box.classes} ${box.scores}</span>`

    $imgbox.appendChild($div)
  })

  console.log(boxes)
}
start()

// import yolov3 from './yolo/yolo-eval'

// export default yolov3
