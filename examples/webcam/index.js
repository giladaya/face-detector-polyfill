function startTheApp() {
  var lastResults = [];
  var $video = document.createElement('video');
  var $canvas = document.getElementById('viewCanvas');
  var detector = new FaceDetector();
  var lastDetectTs = Date.now();
  var lastDetectTime = 0;

  var ctx = $canvas.getContext('2d');

  initCamera($video).then(function() {
    $canvas.width = $video.videoWidth;
    $canvas.height = $video.videoHeight;
    tick();
    detect();
  });

  function detect() {
    detector.detect($canvas).then(function(results){
      var now = Date.now();
      lastDetectTime = now - lastDetectTs;
      lastDetectTs = now;
      lastResults = results;
      requestAnimationFrame(detect);
    })
  }

  function tick() {
    drawFrame(ctx, $video);
    drawRects(ctx, lastResults);
    var fps = Math.round(1000 / lastDetectTime);
    drawStats(ctx, 'Detection took ' + lastDetectTime + 'ms, ' + fps + 'fps')
    // Continue the cycle
    requestAnimationFrame(tick);
  }

  function drawFrame(ctx, $video) {
    ctx.drawImage($video, 0, 0);
  }

  function drawRects(ctx, results) {
    ctx.strokeStyle = '#0f0';
    var bb = {};
    results.forEach(function(res) {
      bb = res.boundingBox;
      ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);
    })
  }

  function drawStats(ctx, str) {
    ctx.fillStyle = '#0f0';
    ctx.fillText(str, 10, 10);
  }
}

function initCamera($video) {
  return new Promise(function(resolve, reject) {
    
    // create constraints for back camera from devices list
    function getBackCamConstraints(devices) {
      devices = devices.filter(function(d) {
        return d.kind === 'videoinput';
      });
      var back = devices.find(function(d) {
        return d.label.toLowerCase().indexOf('back') !== -1;
      }) || (devices.length && devices[devices.length - 1]);
      var constraints = {video: true}
      if (back) {
        constraints.video = {deviceId: back.deviceId};
        // constraints.video = {mandatory: {deviceId: back.deviceId}};
      }
      return constraints;
    }

    // initialize back camera
    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
        var constraints = getBackCamConstraints(devices);
        return navigator.mediaDevices.getUserMedia(constraints);
    })
    .then(function(mediaStream) {
      $video.srcObject = mediaStream;
      $video.onloadedmetadata = function(e) {
        $video.play();
        resolve();
      };
    })
    .catch(function(err) { 
      console.log(err.name + ": " + err.message); 
      reject(err);
    })
  })
}