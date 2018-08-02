# tfjs-yolov3

### Introduction

A Tensorflow.js implementation of YOLOv3

Note: Must Tensorflow.js@v0.12.4+

## Quick Start

### Install

```
npm install tfjs-yolov3
```

### Usage Example

```javascript
import yolov3 from 'tfjs-yolov3'

async function start () {
  const $img = document.getElementById('img')
  const boxes = await yolov3({ $img })
  draw(boxes) // Some draw function
}
start()
```



![demo](./docs/img/demo1.jpg)

## API Docs

TODO

## DEMO

TODO