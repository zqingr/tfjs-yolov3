import './style.css'

import yolov3 from './yolo/yolo-eval'

const $img = document.getElementById('img') as HTMLImageElement
const $img1 = document.getElementById('img1') as HTMLImageElement
const $canvas = document.getElementById('test-canvas') as HTMLCanvasElement

const ctx = $canvas.getContext('2d') as CanvasRenderingContext2D

ctx.drawImage($img, 0, 0, 416, 416)

async function start () {
  const boxes = await yolov3($img)

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
