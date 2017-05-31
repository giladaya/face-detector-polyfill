var Worker = require('worker-loader?inline!./DecoderWorker')

// static
let lastMsgId = 0
const resolves = {}
const rejects = {}

const FaceDetectorCallback = (e) => {
  // transform results in e.data.result
  const id = e.data.id
  const resolve = resolves[id]
  // const results = [
  //   {
  //     boundingBox: {
  //       x: 10,
  //       y: 20,
  //       width: 30,
  //       height: 40,
  //     },
  //     landmarks: null
  //   }
  // ]

  if (resolve !== undefined) {
    const results = e.data.result.map(res => ({
      boundingBox: res,
      landmarks: null,
    }))

    resolve(results)
  }

  // cleanup
  delete resolves[id]
  delete rejects[id]
}

const DEFAULT_OPTIONS = {
  maxDetectedFaces: 1,
  fastMode: true,
}
const MAX_WORK_SIZE_FAST = 320
const MAX_WORK_SIZE_SLOW = 640

export default class Library {
  constructor(options) {
    const config = Object.assign({},
      DEFAULT_OPTIONS,
      options
    )

    this.maxDetectedFaces = config.maxDetectedFaces
    this.maxWorkSize = config.fastMode ? MAX_WORK_SIZE_FAST : MAX_WORK_SIZE_SLOW
    this.worker = new Worker();
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')

    // document.body.appendChild(this.canvas)

    this.worker.onmessage = FaceDetectorCallback
  }

  detect(image) {
    return new Promise((resolve, reject) => {
      // book keeping
      const msgId = lastMsgId++

      resolves[msgId] = resolve
      rejects[msgId] = reject

      const W = image.naturalWidth || image.width
      const H = image.naturalHeight || image.height

      const scale = Math.min(this.maxWorkSize / W, this.maxWorkSize / H);
      this.canvas.width = W * scale;
      this.canvas.height = H * scale;
      
      this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);

      let msg = {
        id: msgId,
        image: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
        width: this.canvas.width,
        height: this.canvas.height,
        scale: 1 / scale,
        maxDetectedFaces: this.maxDetectedFaces,
      }

      this.worker.postMessage(msg)

      msg = null
    });
  }
}
