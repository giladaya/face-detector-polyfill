# FaceDetector Polyfill
Polyfill for FaceDetector, part of [shape detection api](https://wicg.github.io/shape-detection-api/)

## Implementation
Uses the [BBF object detector from JsFeat](https://inspirit.github.io/jsfeat/#bbf).

Note that currently landmarks are not detected.

## Usage
### In the browser
Install:
```
bower install face-detector-polyfill
```

Use:
```
<script>
  (function () {
    function loadScript(src, done) {
      var $script = document.createElement('script');
      $script.src = src;
      $script.onload = function() {
        done();
      };
      $script.onerror = function() {
        done(new Error('Failed to load script ' + src));
      };
      document.head.appendChild($script);
    }
    if (FaceDetector in window) {
      continueToStartTheApp();
    } else {
      loadScript(
        "bower_components/face-detector-polyfill/FaceDetector.min.js", 
        continueToStartTheApp
      );
    }
  })()
  // ...
</script>
```

### With webpack
Install:
```
npm install --save face-detector-polyfill
```

Use:
```
if ('FaceDetector' in window) {
  continueToStartTheApp();
} else {
  require.ensure(['face-detector-polyfill'], function(require) {
    const FaceDetector = require('face-detector-polyfill');
    window.FaceDetector = FaceDetector;
    continueToStartTheApp();
  }, function(err) {
    console.log('Failed to load FaceDetector', err);
  });
}
```

## Examples
See the examples folder, or [live demo](https://giladaya.github.io/face-detector-polyfill/)

## Browser support
Requires Promises (can also be [polyfilled](https://github.com/stefanpenner/es6-promise)) and typed arrays which are [supported in all modern browsers](http://caniuse.com/#feat=typedarrays), down to IE11.
