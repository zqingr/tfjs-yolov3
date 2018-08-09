中文 | [English](./README_EN.md)

# tfjs-yolov3

## 介绍

完全用js来实现图片中的目标检测
基于yolov3算法和Tensorflow.js库
用tensorflow.js实现yolov3和yolov3-tiny

需要注意的是: 必须是Tensorflow.js@v0.12.4版本以上

## 特点
- 可以识别**任意尺寸**的图片
- 同时支持yolov3和yolov3-tiny

## 快速开始

### 安装

```
npm install tfjs-yolov3
```

### 用法示例

```javascript
import { yolov3, yolov3Tiny } from 'tfjs-yolov3'

async function start () {
  const yolo = await yolov3Tiny() // pre-load model (35M)
  // or
  // const yolo = await yolov3() // pre-load model (245M)

  const $img = document.getElementById('img')
  const boxes = await yolo($img) 
  draw(boxes) // Some draw function
}
start()
```

## DEMO

[点击查看在线DEMO](https://zqingr.github.io/tfjs-yolov3-demo/)  
  
![demo](./docs/img/demo1.jpg)




## API 文档

yolov3和yolov3Tiny函数接受一个options对象，并返回一个函数

```typescript
export declare function yolov3 (
  { modelUrl, anchors }? :
  { modelUrl?: string, anchors?: number[] }
): Promise<yolo>

export declare function yolov3Tiny (
  { modelUrl, anchors }? :
  { modelUrl?: string, anchors?: number[] }
): Promise<yolo>
```

| 参数  | 说明  |
| ------------ | ------------ |
|  modelUrl | 可选，预训练model的url，可把model下载到本地，加快预训练model的加载速度  |
|  anchors  | 可选，可自定义anchores，格式参考[config](https://github.com/zqingr/tfjs-yolov3/blob/master/src/yolo/config.js) |

这两个函数调用后会加载预训练model，并返回一个函数，可用这个函数去识别图片，并返回识别后的box列表，参数如下：

```typescript
type yolo = ($img: HTMLImageElement) => Promise<Box[]> 

interface Box {
  top: number
  left: number
  bottom: number
  right: number
  width: number
  height: number
  scores: number
  classes: string
}
```




