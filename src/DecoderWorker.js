var jsfeat = require('./lib/jsfeat');
var bbfFaceCascade = require('./lib/bbf_face');

let imgU8
let lastWidth, lastHeight

(function init() {
  jsfeat.bbf.prepare_cascade(bbfFaceCascade);

  lastWidth = -1
  lastHeight = -1
})();

self.onmessage = function (e) {
  if (e.data.width !== lastWidth || e.data.height !== lastHeight) {
    // eslint-disable-next-line new-cap
    imgU8 = new jsfeat.matrix_t(e.data.width, e.data.height, jsfeat.U8_t | jsfeat.C1_t);
    lastWidth = e.data.width;
    lastHeight = e.data.height;
  }
  
  const imageData = e.data.image;
  jsfeat.imgproc.grayscale(imageData.data, e.data.width, e.data.height, imgU8);

  // possible options
  // jsfeat.imgproc.equalize_histogram(imgU8, imgU8);
  
  const pyr = jsfeat.bbf.build_pyramid(imgU8, 24 * 2, 24 * 2, 4);
  let rects = jsfeat.bbf.detect(pyr, bbfFaceCascade);
  rects = jsfeat.bbf.group_rectangles(rects, 1);

  // keep the best results
  const topResults = rects.sort((recA, recB) => recB.confidence - recA.confidence).slice(0, e.data.maxDetectedFaces)
  
  // scale and remove some values
  const scaledResults = topResults.map(res => ({
    x: res.x * e.data.scale,
    y: res.y * e.data.scale,
    width: res.width * e.data.scale,
    height: res.height * e.data.scale,
  }))

  postMessage({
    id: e.data.id,
    result: scaledResults,
    err: null,
  });
};
