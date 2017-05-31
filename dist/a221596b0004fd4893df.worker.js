/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* eslint-disable */
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

// namespace ?
var jsfeat = jsfeat || { REVISION: 'ALPHA' };
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function (global) {
    "use strict";
    //

    // CONSTANTS

    var EPSILON = 0.0000001192092896;
    var FLT_MIN = 1E-37;

    // implementation from CCV project
    // currently working only with u8,s32,f32
    var U8_t = 0x0100,
        S32_t = 0x0200,
        F32_t = 0x0400,
        S64_t = 0x0800,
        F64_t = 0x1000;

    var C1_t = 0x01,
        C2_t = 0x02,
        C3_t = 0x03,
        C4_t = 0x04;

    var _data_type_size = new Int32Array([-1, 1, 4, -1, 4, -1, -1, -1, 8, -1, -1, -1, -1, -1, -1, -1, 8]);

    var get_data_type = function () {
        return function (type) {
            return type & 0xFF00;
        };
    }();

    var get_channel = function () {
        return function (type) {
            return type & 0xFF;
        };
    }();

    var get_data_type_size = function () {
        return function (type) {
            return _data_type_size[(type & 0xFF00) >> 8];
        };
    }();

    // color conversion
    var COLOR_RGBA2GRAY = 0;
    var COLOR_RGB2GRAY = 1;
    var COLOR_BGRA2GRAY = 2;
    var COLOR_BGR2GRAY = 3;

    // box blur option
    var BOX_BLUR_NOSCALE = 0x01;
    // svd options
    var SVD_U_T = 0x01;
    var SVD_V_T = 0x02;

    var data_t = function () {
        function data_t(size_in_bytes, buffer) {
            // we need align size to multiple of 8
            this.size = (size_in_bytes + 7 | 0) & -8;
            if (typeof buffer === "undefined") {
                this.buffer = new ArrayBuffer(this.size);
            } else {
                this.buffer = buffer;
                this.size = buffer.length;
            }
            this.u8 = new Uint8Array(this.buffer);
            this.i32 = new Int32Array(this.buffer);
            this.f32 = new Float32Array(this.buffer);
            this.f64 = new Float64Array(this.buffer);
        }
        return data_t;
    }();

    var matrix_t = function () {
        // columns, rows, data_type
        function matrix_t(c, r, data_type, data_buffer) {
            this.type = get_data_type(data_type) | 0;
            this.channel = get_channel(data_type) | 0;
            this.cols = c | 0;
            this.rows = r | 0;
            if (typeof data_buffer === "undefined") {
                this.allocate();
            } else {
                this.buffer = data_buffer;
                // data user asked for
                this.data = this.type & U8_t ? this.buffer.u8 : this.type & S32_t ? this.buffer.i32 : this.type & F32_t ? this.buffer.f32 : this.buffer.f64;
            }
        }
        matrix_t.prototype.allocate = function () {
            // clear references
            delete this.data;
            delete this.buffer;
            //
            this.buffer = new data_t(this.cols * get_data_type_size(this.type) * this.channel * this.rows);
            this.data = this.type & U8_t ? this.buffer.u8 : this.type & S32_t ? this.buffer.i32 : this.type & F32_t ? this.buffer.f32 : this.buffer.f64;
        };
        matrix_t.prototype.copy_to = function (other) {
            var od = other.data,
                td = this.data;
            var i = 0,
                n = this.cols * this.rows * this.channel | 0;
            for (; i < n - 4; i += 4) {
                od[i] = td[i];
                od[i + 1] = td[i + 1];
                od[i + 2] = td[i + 2];
                od[i + 3] = td[i + 3];
            }
            for (; i < n; ++i) {
                od[i] = td[i];
            }
        };
        matrix_t.prototype.resize = function (c, r, ch) {
            if (typeof ch === "undefined") {
                ch = this.channel;
            }
            // relocate buffer only if new size doesnt fit
            var new_size = c * get_data_type_size(this.type) * ch * r;
            if (new_size > this.buffer.size) {
                this.cols = c;
                this.rows = r;
                this.channel = ch;
                this.allocate();
            } else {
                this.cols = c;
                this.rows = r;
                this.channel = ch;
            }
        };

        return matrix_t;
    }();

    var pyramid_t = function () {

        function pyramid_t(levels) {
            this.levels = levels | 0;
            this.data = new Array(levels);
            this.pyrdown = jsfeat.imgproc.pyrdown;
        }

        pyramid_t.prototype.allocate = function (start_w, start_h, data_type) {
            var i = this.levels;
            while (--i >= 0) {
                this.data[i] = new matrix_t(start_w >> i, start_h >> i, data_type);
            }
        };

        pyramid_t.prototype.build = function (input, skip_first_level) {
            if (typeof skip_first_level === "undefined") {
                skip_first_level = true;
            }
            // just copy data to first level
            var i = 2,
                a = input,
                b = this.data[0];
            if (!skip_first_level) {
                var j = input.cols * input.rows;
                while (--j >= 0) {
                    b.data[j] = input.data[j];
                }
            }
            b = this.data[1];
            this.pyrdown(a, b);
            for (; i < this.levels; ++i) {
                a = b;
                b = this.data[i];
                this.pyrdown(a, b);
            }
        };

        return pyramid_t;
    }();

    var keypoint_t = function () {
        function keypoint_t(x, y, score, level, angle) {
            if (typeof x === "undefined") {
                x = 0;
            }
            if (typeof y === "undefined") {
                y = 0;
            }
            if (typeof score === "undefined") {
                score = 0;
            }
            if (typeof level === "undefined") {
                level = 0;
            }
            if (typeof angle === "undefined") {
                angle = -1.0;
            }

            this.x = x;
            this.y = y;
            this.score = score;
            this.level = level;
            this.angle = angle;
        }
        return keypoint_t;
    }();

    // data types
    global.U8_t = U8_t;
    global.S32_t = S32_t;
    global.F32_t = F32_t;
    global.S64_t = S64_t;
    global.F64_t = F64_t;
    // data channels
    global.C1_t = C1_t;
    global.C2_t = C2_t;
    global.C3_t = C3_t;
    global.C4_t = C4_t;

    // popular formats
    global.U8C1_t = U8_t | C1_t;
    global.U8C3_t = U8_t | C3_t;
    global.U8C4_t = U8_t | C4_t;

    global.F32C1_t = F32_t | C1_t;
    global.F32C2_t = F32_t | C2_t;
    global.S32C1_t = S32_t | C1_t;
    global.S32C2_t = S32_t | C2_t;

    // constants
    global.EPSILON = EPSILON;
    global.FLT_MIN = FLT_MIN;

    // color convert
    global.COLOR_RGBA2GRAY = COLOR_RGBA2GRAY;
    global.COLOR_RGB2GRAY = COLOR_RGB2GRAY;
    global.COLOR_BGRA2GRAY = COLOR_BGRA2GRAY;
    global.COLOR_BGR2GRAY = COLOR_BGR2GRAY;

    // options
    global.BOX_BLUR_NOSCALE = BOX_BLUR_NOSCALE;
    global.SVD_U_T = SVD_U_T;
    global.SVD_V_T = SVD_V_T;

    global.get_data_type = get_data_type;
    global.get_channel = get_channel;
    global.get_data_type_size = get_data_type_size;

    global.data_t = data_t;
    global.matrix_t = matrix_t;
    global.pyramid_t = pyramid_t;
    global.keypoint_t = keypoint_t;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function (global) {
    "use strict";
    //

    var cache = function () {

        // very primitive array cache, still need testing if it helps
        // of course V8 has its own powerful cache sys but i'm not sure
        // it caches several multichannel 640x480 buffer creations each frame

        var _pool_node_t = function () {
            function _pool_node_t(size_in_bytes) {
                this.next = null;
                this.data = new jsfeat.data_t(size_in_bytes);
                this.size = this.data.size;
                this.buffer = this.data.buffer;
                this.u8 = this.data.u8;
                this.i32 = this.data.i32;
                this.f32 = this.data.f32;
                this.f64 = this.data.f64;
            }
            _pool_node_t.prototype.resize = function (size_in_bytes) {
                delete this.data;
                this.data = new jsfeat.data_t(size_in_bytes);
                this.size = this.data.size;
                this.buffer = this.data.buffer;
                this.u8 = this.data.u8;
                this.i32 = this.data.i32;
                this.f32 = this.data.f32;
                this.f64 = this.data.f64;
            };
            return _pool_node_t;
        }();

        var _pool_head, _pool_tail;
        var _pool_size = 0;

        return {

            allocate: function allocate(capacity, data_size) {
                _pool_head = _pool_tail = new _pool_node_t(data_size);
                for (var i = 0; i < capacity; ++i) {
                    var node = new _pool_node_t(data_size);
                    _pool_tail = _pool_tail.next = node;

                    _pool_size++;
                }
            },

            get_buffer: function get_buffer(size_in_bytes) {
                // assume we have enough free nodes
                var node = _pool_head;
                _pool_head = _pool_head.next;
                _pool_size--;

                if (size_in_bytes > node.size) {
                    node.resize(size_in_bytes);
                }

                return node;
            },

            put_buffer: function put_buffer(node) {
                _pool_tail = _pool_tail.next = node;
                _pool_size++;
            }
        };
    }();

    global.cache = cache;
    // for now we dont need more than 30 buffers
    // if having cache sys really helps we can add auto extending sys
    cache.allocate(30, 640 * 4);
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function (global) {
    "use strict";
    //

    var math = function () {

        var qsort_stack = new Int32Array(48 * 2);

        return {
            get_gaussian_kernel: function get_gaussian_kernel(size, sigma, kernel, data_type) {
                var i = 0,
                    x = 0.0,
                    t = 0.0,
                    sigma_x = 0.0,
                    scale_2x = 0.0;
                var sum = 0.0;
                var kern_node = jsfeat.cache.get_buffer(size << 2);
                var _kernel = kern_node.f32; //new Float32Array(size);

                if ((size & 1) == 1 && size <= 7 && sigma <= 0) {
                    switch (size >> 1) {
                        case 0:
                            _kernel[0] = 1.0;
                            sum = 1.0;
                            break;
                        case 1:
                            _kernel[0] = 0.25, _kernel[1] = 0.5, _kernel[2] = 0.25;
                            sum = 0.25 + 0.5 + 0.25;
                            break;
                        case 2:
                            _kernel[0] = 0.0625, _kernel[1] = 0.25, _kernel[2] = 0.375, _kernel[3] = 0.25, _kernel[4] = 0.0625;
                            sum = 0.0625 + 0.25 + 0.375 + 0.25 + 0.0625;
                            break;
                        case 3:
                            _kernel[0] = 0.03125, _kernel[1] = 0.109375, _kernel[2] = 0.21875, _kernel[3] = 0.28125, _kernel[4] = 0.21875, _kernel[5] = 0.109375, _kernel[6] = 0.03125;
                            sum = 0.03125 + 0.109375 + 0.21875 + 0.28125 + 0.21875 + 0.109375 + 0.03125;
                            break;
                    }
                } else {
                    sigma_x = sigma > 0 ? sigma : ((size - 1) * 0.5 - 1.0) * 0.3 + 0.8;
                    scale_2x = -0.5 / (sigma_x * sigma_x);

                    for (; i < size; ++i) {
                        x = i - (size - 1) * 0.5;
                        t = Math.exp(scale_2x * x * x);

                        _kernel[i] = t;
                        sum += t;
                    }
                }

                if (data_type & jsfeat.U8_t) {
                    // int based kernel
                    sum = 256.0 / sum;
                    for (i = 0; i < size; ++i) {
                        kernel[i] = _kernel[i] * sum + 0.5 | 0;
                    }
                } else {
                    // classic kernel
                    sum = 1.0 / sum;
                    for (i = 0; i < size; ++i) {
                        kernel[i] = _kernel[i] * sum;
                    }
                }

                jsfeat.cache.put_buffer(kern_node);
            },

            // model is 3x3 matrix_t
            perspective_4point_transform: function perspective_4point_transform(model, src_x0, src_y0, dst_x0, dst_y0, src_x1, src_y1, dst_x1, dst_y1, src_x2, src_y2, dst_x2, dst_y2, src_x3, src_y3, dst_x3, dst_y3) {
                var t1 = src_x0;
                var t2 = src_x2;
                var t4 = src_y1;
                var t5 = t1 * t2 * t4;
                var t6 = src_y3;
                var t7 = t1 * t6;
                var t8 = t2 * t7;
                var t9 = src_y2;
                var t10 = t1 * t9;
                var t11 = src_x1;
                var t14 = src_y0;
                var t15 = src_x3;
                var t16 = t14 * t15;
                var t18 = t16 * t11;
                var t20 = t15 * t11 * t9;
                var t21 = t15 * t4;
                var t24 = t15 * t9;
                var t25 = t2 * t4;
                var t26 = t6 * t2;
                var t27 = t6 * t11;
                var t28 = t9 * t11;
                var t30 = 1.0 / (t21 - t24 - t25 + t26 - t27 + t28);
                var t32 = t1 * t15;
                var t35 = t14 * t11;
                var t41 = t4 * t1;
                var t42 = t6 * t41;
                var t43 = t14 * t2;
                var t46 = t16 * t9;
                var t48 = t14 * t9 * t11;
                var t51 = t4 * t6 * t2;
                var t55 = t6 * t14;
                var Hr0 = -(t8 - t5 + t10 * t11 - t11 * t7 - t16 * t2 + t18 - t20 + t21 * t2) * t30;
                var Hr1 = (t5 - t8 - t32 * t4 + t32 * t9 + t18 - t2 * t35 + t27 * t2 - t20) * t30;
                var Hr2 = t1;
                var Hr3 = (-t9 * t7 + t42 + t43 * t4 - t16 * t4 + t46 - t48 + t27 * t9 - t51) * t30;
                var Hr4 = (-t42 + t41 * t9 - t55 * t2 + t46 - t48 + t55 * t11 + t51 - t21 * t9) * t30;
                var Hr5 = t14;
                var Hr6 = (-t10 + t41 + t43 - t35 + t24 - t21 - t26 + t27) * t30;
                var Hr7 = (-t7 + t10 + t16 - t43 + t27 - t28 - t21 + t25) * t30;

                t1 = dst_x0;
                t2 = dst_x2;
                t4 = dst_y1;
                t5 = t1 * t2 * t4;
                t6 = dst_y3;
                t7 = t1 * t6;
                t8 = t2 * t7;
                t9 = dst_y2;
                t10 = t1 * t9;
                t11 = dst_x1;
                t14 = dst_y0;
                t15 = dst_x3;
                t16 = t14 * t15;
                t18 = t16 * t11;
                t20 = t15 * t11 * t9;
                t21 = t15 * t4;
                t24 = t15 * t9;
                t25 = t2 * t4;
                t26 = t6 * t2;
                t27 = t6 * t11;
                t28 = t9 * t11;
                t30 = 1.0 / (t21 - t24 - t25 + t26 - t27 + t28);
                t32 = t1 * t15;
                t35 = t14 * t11;
                t41 = t4 * t1;
                t42 = t6 * t41;
                t43 = t14 * t2;
                t46 = t16 * t9;
                t48 = t14 * t9 * t11;
                t51 = t4 * t6 * t2;
                t55 = t6 * t14;
                var Hl0 = -(t8 - t5 + t10 * t11 - t11 * t7 - t16 * t2 + t18 - t20 + t21 * t2) * t30;
                var Hl1 = (t5 - t8 - t32 * t4 + t32 * t9 + t18 - t2 * t35 + t27 * t2 - t20) * t30;
                var Hl2 = t1;
                var Hl3 = (-t9 * t7 + t42 + t43 * t4 - t16 * t4 + t46 - t48 + t27 * t9 - t51) * t30;
                var Hl4 = (-t42 + t41 * t9 - t55 * t2 + t46 - t48 + t55 * t11 + t51 - t21 * t9) * t30;
                var Hl5 = t14;
                var Hl6 = (-t10 + t41 + t43 - t35 + t24 - t21 - t26 + t27) * t30;
                var Hl7 = (-t7 + t10 + t16 - t43 + t27 - t28 - t21 + t25) * t30;

                // the following code computes R = Hl * inverse Hr
                t2 = Hr4 - Hr7 * Hr5;
                t4 = Hr0 * Hr4;
                t5 = Hr0 * Hr5;
                t7 = Hr3 * Hr1;
                t8 = Hr2 * Hr3;
                t10 = Hr1 * Hr6;
                var t12 = Hr2 * Hr6;
                t15 = 1.0 / (t4 - t5 * Hr7 - t7 + t8 * Hr7 + t10 * Hr5 - t12 * Hr4);
                t18 = -Hr3 + Hr5 * Hr6;
                var t23 = -Hr3 * Hr7 + Hr4 * Hr6;
                t28 = -Hr1 + Hr2 * Hr7;
                var t31 = Hr0 - t12;
                t35 = Hr0 * Hr7 - t10;
                t41 = -Hr1 * Hr5 + Hr2 * Hr4;
                var t44 = t5 - t8;
                var t47 = t4 - t7;
                t48 = t2 * t15;
                var t49 = t28 * t15;
                var t50 = t41 * t15;
                var mat = model.data;
                mat[0] = Hl0 * t48 + Hl1 * (t18 * t15) - Hl2 * (t23 * t15);
                mat[1] = Hl0 * t49 + Hl1 * (t31 * t15) - Hl2 * (t35 * t15);
                mat[2] = -Hl0 * t50 - Hl1 * (t44 * t15) + Hl2 * (t47 * t15);
                mat[3] = Hl3 * t48 + Hl4 * (t18 * t15) - Hl5 * (t23 * t15);
                mat[4] = Hl3 * t49 + Hl4 * (t31 * t15) - Hl5 * (t35 * t15);
                mat[5] = -Hl3 * t50 - Hl4 * (t44 * t15) + Hl5 * (t47 * t15);
                mat[6] = Hl6 * t48 + Hl7 * (t18 * t15) - t23 * t15;
                mat[7] = Hl6 * t49 + Hl7 * (t31 * t15) - t35 * t15;
                mat[8] = -Hl6 * t50 - Hl7 * (t44 * t15) + t47 * t15;
            },

            // The current implementation was derived from *BSD system qsort():
            // Copyright (c) 1992, 1993
            // The Regents of the University of California.  All rights reserved.
            qsort: function qsort(array, low, high, cmp) {
                var isort_thresh = 7;
                var t, ta, tb, tc;
                var sp = 0,
                    left = 0,
                    right = 0,
                    i = 0,
                    n = 0,
                    m = 0,
                    ptr = 0,
                    ptr2 = 0,
                    d = 0;
                var left0 = 0,
                    left1 = 0,
                    right0 = 0,
                    right1 = 0,
                    pivot = 0,
                    a = 0,
                    b = 0,
                    c = 0,
                    swap_cnt = 0;

                var stack = qsort_stack;

                if (high - low + 1 <= 1) return;

                stack[0] = low;
                stack[1] = high;

                while (sp >= 0) {

                    left = stack[sp << 1];
                    right = stack[(sp << 1) + 1];
                    sp--;

                    for (;;) {
                        n = right - left + 1;

                        if (n <= isort_thresh) {
                            //insert_sort:
                            for (ptr = left + 1; ptr <= right; ptr++) {
                                for (ptr2 = ptr; ptr2 > left && cmp(array[ptr2], array[ptr2 - 1]); ptr2--) {
                                    t = array[ptr2];
                                    array[ptr2] = array[ptr2 - 1];
                                    array[ptr2 - 1] = t;
                                }
                            }
                            break;
                        } else {
                            swap_cnt = 0;

                            left0 = left;
                            right0 = right;
                            pivot = left + (n >> 1);

                            if (n > 40) {
                                d = n >> 3;
                                a = left, b = left + d, c = left + (d << 1);
                                ta = array[a], tb = array[b], tc = array[c];
                                left = cmp(ta, tb) ? cmp(tb, tc) ? b : cmp(ta, tc) ? c : a : cmp(tc, tb) ? b : cmp(ta, tc) ? a : c;

                                a = pivot - d, b = pivot, c = pivot + d;
                                ta = array[a], tb = array[b], tc = array[c];
                                pivot = cmp(ta, tb) ? cmp(tb, tc) ? b : cmp(ta, tc) ? c : a : cmp(tc, tb) ? b : cmp(ta, tc) ? a : c;

                                a = right - (d << 1), b = right - d, c = right;
                                ta = array[a], tb = array[b], tc = array[c];
                                right = cmp(ta, tb) ? cmp(tb, tc) ? b : cmp(ta, tc) ? c : a : cmp(tc, tb) ? b : cmp(ta, tc) ? a : c;
                            }

                            a = left, b = pivot, c = right;
                            ta = array[a], tb = array[b], tc = array[c];
                            pivot = cmp(ta, tb) ? cmp(tb, tc) ? b : cmp(ta, tc) ? c : a : cmp(tc, tb) ? b : cmp(ta, tc) ? a : c;
                            if (pivot != left0) {
                                t = array[pivot];
                                array[pivot] = array[left0];
                                array[left0] = t;
                                pivot = left0;
                            }
                            left = left1 = left0 + 1;
                            right = right1 = right0;

                            ta = array[pivot];
                            for (;;) {
                                while (left <= right && !cmp(ta, array[left])) {
                                    if (!cmp(array[left], ta)) {
                                        if (left > left1) {
                                            t = array[left1];
                                            array[left1] = array[left];
                                            array[left] = t;
                                        }
                                        swap_cnt = 1;
                                        left1++;
                                    }
                                    left++;
                                }

                                while (left <= right && !cmp(array[right], ta)) {
                                    if (!cmp(ta, array[right])) {
                                        if (right < right1) {
                                            t = array[right1];
                                            array[right1] = array[right];
                                            array[right] = t;
                                        }
                                        swap_cnt = 1;
                                        right1--;
                                    }
                                    right--;
                                }

                                if (left > right) break;

                                t = array[left];
                                array[left] = array[right];
                                array[right] = t;
                                swap_cnt = 1;
                                left++;
                                right--;
                            }

                            if (swap_cnt == 0) {
                                left = left0, right = right0;
                                //goto insert_sort;
                                for (ptr = left + 1; ptr <= right; ptr++) {
                                    for (ptr2 = ptr; ptr2 > left && cmp(array[ptr2], array[ptr2 - 1]); ptr2--) {
                                        t = array[ptr2];
                                        array[ptr2] = array[ptr2 - 1];
                                        array[ptr2 - 1] = t;
                                    }
                                }
                                break;
                            }

                            n = Math.min(left1 - left0, left - left1);
                            m = left - n | 0;
                            for (i = 0; i < n; ++i, ++m) {
                                t = array[left0 + i];
                                array[left0 + i] = array[m];
                                array[m] = t;
                            }

                            n = Math.min(right0 - right1, right1 - right);
                            m = right0 - n + 1 | 0;
                            for (i = 0; i < n; ++i, ++m) {
                                t = array[left + i];
                                array[left + i] = array[m];
                                array[m] = t;
                            }
                            n = left - left1;
                            m = right1 - right;
                            if (n > 1) {
                                if (m > 1) {
                                    if (n > m) {
                                        ++sp;
                                        stack[sp << 1] = left0;
                                        stack[(sp << 1) + 1] = left0 + n - 1;
                                        left = right0 - m + 1, right = right0;
                                    } else {
                                        ++sp;
                                        stack[sp << 1] = right0 - m + 1;
                                        stack[(sp << 1) + 1] = right0;
                                        left = left0, right = left0 + n - 1;
                                    }
                                } else {
                                    left = left0, right = left0 + n - 1;
                                }
                            } else if (m > 1) left = right0 - m + 1, right = right0;else break;
                        }
                    }
                }
            },

            median: function median(array, low, high) {
                var w;
                var middle = 0,
                    ll = 0,
                    hh = 0,
                    median = low + high >> 1;
                for (;;) {
                    if (high <= low) return array[median];
                    if (high == low + 1) {
                        if (array[low] > array[high]) {
                            w = array[low];
                            array[low] = array[high];
                            array[high] = w;
                        }
                        return array[median];
                    }
                    middle = low + high >> 1;
                    if (array[middle] > array[high]) {
                        w = array[middle];
                        array[middle] = array[high];
                        array[high] = w;
                    }
                    if (array[low] > array[high]) {
                        w = array[low];
                        array[low] = array[high];
                        array[high] = w;
                    }
                    if (array[middle] > array[low]) {
                        w = array[middle];
                        array[middle] = array[low];
                        array[low] = w;
                    }
                    ll = low + 1;
                    w = array[middle];
                    array[middle] = array[ll];
                    array[ll] = w;
                    hh = high;
                    for (;;) {
                        do {
                            ++ll;
                        } while (array[low] > array[ll]);
                        do {
                            --hh;
                        } while (array[hh] > array[low]);
                        if (hh < ll) break;
                        w = array[ll];
                        array[ll] = array[hh];
                        array[hh] = w;
                    }
                    w = array[low];
                    array[low] = array[hh];
                    array[hh] = w;
                    if (hh <= median) low = ll;else if (hh >= median) high = hh - 1;
                }
                return 0;
            }
        };
    }();

    global.math = math;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 */

(function (global) {
    "use strict";
    //

    var matmath = function () {

        return {
            identity: function identity(M, value) {
                if (typeof value === "undefined") {
                    value = 1;
                }
                var src = M.data;
                var rows = M.rows,
                    cols = M.cols,
                    cols_1 = cols + 1 | 0;
                var len = rows * cols;
                var k = len;
                while (--len >= 0) {
                    src[len] = 0.0;
                }len = k;
                k = 0;
                while (k < len) {
                    src[k] = value;
                    k = k + cols_1;
                }
            },

            transpose: function transpose(At, A) {
                var i = 0,
                    j = 0,
                    nrows = A.rows,
                    ncols = A.cols;
                var Ai = 0,
                    Ati = 0,
                    pAt = 0;
                var ad = A.data,
                    atd = At.data;

                for (; i < nrows; Ati += 1, Ai += ncols, i++) {
                    pAt = Ati;
                    for (j = 0; j < ncols; pAt += nrows, j++) {
                        atd[pAt] = ad[Ai + j];
                    }
                }
            },

            // C = A * B
            multiply: function multiply(C, A, B) {
                var i = 0,
                    j = 0,
                    k = 0;
                var Ap = 0,
                    pA = 0,
                    pB = 0,
                    p_B = 0,
                    Cp = 0;
                var ncols = A.cols,
                    nrows = A.rows,
                    mcols = B.cols;
                var ad = A.data,
                    bd = B.data,
                    cd = C.data;
                var sum = 0.0;

                for (; i < nrows; Ap += ncols, i++) {
                    for (p_B = 0, j = 0; j < mcols; Cp++, p_B++, j++) {
                        pB = p_B;
                        pA = Ap;
                        sum = 0.0;
                        for (k = 0; k < ncols; pA++, pB += mcols, k++) {
                            sum += ad[pA] * bd[pB];
                        }
                        cd[Cp] = sum;
                    }
                }
            },

            // C = A * B'
            multiply_ABt: function multiply_ABt(C, A, B) {
                var i = 0,
                    j = 0,
                    k = 0;
                var Ap = 0,
                    pA = 0,
                    pB = 0,
                    Cp = 0;
                var ncols = A.cols,
                    nrows = A.rows,
                    mrows = B.rows;
                var ad = A.data,
                    bd = B.data,
                    cd = C.data;
                var sum = 0.0;

                for (; i < nrows; Ap += ncols, i++) {
                    for (pB = 0, j = 0; j < mrows; Cp++, j++) {
                        pA = Ap;
                        sum = 0.0;
                        for (k = 0; k < ncols; pA++, pB++, k++) {
                            sum += ad[pA] * bd[pB];
                        }
                        cd[Cp] = sum;
                    }
                }
            },

            // C = A' * B
            multiply_AtB: function multiply_AtB(C, A, B) {
                var i = 0,
                    j = 0,
                    k = 0;
                var Ap = 0,
                    pA = 0,
                    pB = 0,
                    p_B = 0,
                    Cp = 0;
                var ncols = A.cols,
                    nrows = A.rows,
                    mcols = B.cols;
                var ad = A.data,
                    bd = B.data,
                    cd = C.data;
                var sum = 0.0;

                for (; i < ncols; Ap++, i++) {
                    for (p_B = 0, j = 0; j < mcols; Cp++, p_B++, j++) {
                        pB = p_B;
                        pA = Ap;
                        sum = 0.0;
                        for (k = 0; k < nrows; pA += ncols, pB += mcols, k++) {
                            sum += ad[pA] * bd[pB];
                        }
                        cd[Cp] = sum;
                    }
                }
            },

            // C = A * A'
            multiply_AAt: function multiply_AAt(C, A) {
                var i = 0,
                    j = 0,
                    k = 0;
                var pCdiag = 0,
                    p_A = 0,
                    pA = 0,
                    pB = 0,
                    pC = 0,
                    pCt = 0;
                var ncols = A.cols,
                    nrows = A.rows;
                var ad = A.data,
                    cd = C.data;
                var sum = 0.0;

                for (; i < nrows; pCdiag += nrows + 1, p_A = pA, i++) {
                    pC = pCdiag;
                    pCt = pCdiag;
                    pB = p_A;
                    for (j = i; j < nrows; pC++, pCt += nrows, j++) {
                        pA = p_A;
                        sum = 0.0;
                        for (k = 0; k < ncols; k++) {
                            sum += ad[pA++] * ad[pB++];
                        }
                        cd[pC] = sum;
                        cd[pCt] = sum;
                    }
                }
            },

            // C = A' * A
            multiply_AtA: function multiply_AtA(C, A) {
                var i = 0,
                    j = 0,
                    k = 0;
                var p_A = 0,
                    pA = 0,
                    pB = 0,
                    p_C = 0,
                    pC = 0,
                    p_CC = 0;
                var ncols = A.cols,
                    nrows = A.rows;
                var ad = A.data,
                    cd = C.data;
                var sum = 0.0;

                for (; i < ncols; p_C += ncols, i++) {
                    p_A = i;
                    p_CC = p_C + i;
                    pC = p_CC;
                    for (j = i; j < ncols; pC++, p_CC += ncols, j++) {
                        pA = p_A;
                        pB = j;
                        sum = 0.0;
                        for (k = 0; k < nrows; pA += ncols, pB += ncols, k++) {
                            sum += ad[pA] * ad[pB];
                        }
                        cd[pC] = sum;
                        cd[p_CC] = sum;
                    }
                }
            },

            // various small matrix operations
            identity_3x3: function identity_3x3(M, value) {
                if (typeof value === "undefined") {
                    value = 1;
                }
                var dt = M.data;
                dt[0] = dt[4] = dt[8] = value;
                dt[1] = dt[2] = dt[3] = 0;
                dt[5] = dt[6] = dt[7] = 0;
            },

            invert_3x3: function invert_3x3(from, to) {
                var A = from.data,
                    invA = to.data;
                var t1 = A[4];
                var t2 = A[8];
                var t4 = A[5];
                var t5 = A[7];
                var t8 = A[0];

                var t9 = t8 * t1;
                var t11 = t8 * t4;
                var t13 = A[3];
                var t14 = A[1];
                var t15 = t13 * t14;
                var t17 = A[2];
                var t18 = t13 * t17;
                var t20 = A[6];
                var t21 = t20 * t14;
                var t23 = t20 * t17;
                var t26 = 1.0 / (t9 * t2 - t11 * t5 - t15 * t2 + t18 * t5 + t21 * t4 - t23 * t1);
                invA[0] = (t1 * t2 - t4 * t5) * t26;
                invA[1] = -(t14 * t2 - t17 * t5) * t26;
                invA[2] = -(-t14 * t4 + t17 * t1) * t26;
                invA[3] = -(t13 * t2 - t4 * t20) * t26;
                invA[4] = (t8 * t2 - t23) * t26;
                invA[5] = -(t11 - t18) * t26;
                invA[6] = -(-t13 * t5 + t1 * t20) * t26;
                invA[7] = -(t8 * t5 - t21) * t26;
                invA[8] = (t9 - t15) * t26;
            },
            // C = A * B
            multiply_3x3: function multiply_3x3(C, A, B) {
                var Cd = C.data,
                    Ad = A.data,
                    Bd = B.data;
                var m1_0 = Ad[0],
                    m1_1 = Ad[1],
                    m1_2 = Ad[2];
                var m1_3 = Ad[3],
                    m1_4 = Ad[4],
                    m1_5 = Ad[5];
                var m1_6 = Ad[6],
                    m1_7 = Ad[7],
                    m1_8 = Ad[8];

                var m2_0 = Bd[0],
                    m2_1 = Bd[1],
                    m2_2 = Bd[2];
                var m2_3 = Bd[3],
                    m2_4 = Bd[4],
                    m2_5 = Bd[5];
                var m2_6 = Bd[6],
                    m2_7 = Bd[7],
                    m2_8 = Bd[8];

                Cd[0] = m1_0 * m2_0 + m1_1 * m2_3 + m1_2 * m2_6;
                Cd[1] = m1_0 * m2_1 + m1_1 * m2_4 + m1_2 * m2_7;
                Cd[2] = m1_0 * m2_2 + m1_1 * m2_5 + m1_2 * m2_8;
                Cd[3] = m1_3 * m2_0 + m1_4 * m2_3 + m1_5 * m2_6;
                Cd[4] = m1_3 * m2_1 + m1_4 * m2_4 + m1_5 * m2_7;
                Cd[5] = m1_3 * m2_2 + m1_4 * m2_5 + m1_5 * m2_8;
                Cd[6] = m1_6 * m2_0 + m1_7 * m2_3 + m1_8 * m2_6;
                Cd[7] = m1_6 * m2_1 + m1_7 * m2_4 + m1_8 * m2_7;
                Cd[8] = m1_6 * m2_2 + m1_7 * m2_5 + m1_8 * m2_8;
            },

            mat3x3_determinant: function mat3x3_determinant(M) {
                var md = M.data;
                return md[0] * md[4] * md[8] - md[0] * md[5] * md[7] - md[3] * md[1] * md[8] + md[3] * md[2] * md[7] + md[6] * md[1] * md[5] - md[6] * md[2] * md[4];
            },

            determinant_3x3: function determinant_3x3(M11, M12, M13, M21, M22, M23, M31, M32, M33) {
                return M11 * M22 * M33 - M11 * M23 * M32 - M21 * M12 * M33 + M21 * M13 * M32 + M31 * M12 * M23 - M31 * M13 * M22;
            }
        };
    }();

    global.matmath = matmath;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 */

(function (global) {
    "use strict";
    //

    var linalg = function () {

        var swap = function swap(A, i0, i1, t) {
            t = A[i0];
            A[i0] = A[i1];
            A[i1] = t;
        };

        var hypot = function hypot(a, b) {
            a = Math.abs(a);
            b = Math.abs(b);
            if (a > b) {
                b /= a;
                return a * Math.sqrt(1.0 + b * b);
            }
            if (b > 0) {
                a /= b;
                return b * Math.sqrt(1.0 + a * a);
            }
            return 0.0;
        };

        var JacobiImpl = function JacobiImpl(A, astep, W, V, vstep, n) {
            var eps = jsfeat.EPSILON;
            var i = 0,
                j = 0,
                k = 0,
                m = 0,
                l = 0,
                idx = 0,
                _in = 0,
                _in2 = 0;
            var iters = 0,
                max_iter = n * n * 30;
            var mv = 0.0,
                val = 0.0,
                p = 0.0,
                y = 0.0,
                t = 0.0,
                s = 0.0,
                c = 0.0,
                a0 = 0.0,
                b0 = 0.0;

            var indR_buff = jsfeat.cache.get_buffer(n << 2);
            var indC_buff = jsfeat.cache.get_buffer(n << 2);
            var indR = indR_buff.i32;
            var indC = indC_buff.i32;

            if (V) {
                for (; i < n; i++) {
                    k = i * vstep;
                    for (j = 0; j < n; j++) {
                        V[k + j] = 0.0;
                    }
                    V[k + i] = 1.0;
                }
            }

            for (k = 0; k < n; k++) {
                W[k] = A[(astep + 1) * k];
                if (k < n - 1) {
                    for (m = k + 1, mv = Math.abs(A[astep * k + m]), i = k + 2; i < n; i++) {
                        val = Math.abs(A[astep * k + i]);
                        if (mv < val) mv = val, m = i;
                    }
                    indR[k] = m;
                }
                if (k > 0) {
                    for (m = 0, mv = Math.abs(A[k]), i = 1; i < k; i++) {
                        val = Math.abs(A[astep * i + k]);
                        if (mv < val) mv = val, m = i;
                    }
                    indC[k] = m;
                }
            }

            if (n > 1) for (; iters < max_iter; iters++) {
                // find index (k,l) of pivot p
                for (k = 0, mv = Math.abs(A[indR[0]]), i = 1; i < n - 1; i++) {
                    val = Math.abs(A[astep * i + indR[i]]);
                    if (mv < val) mv = val, k = i;
                }
                l = indR[k];
                for (i = 1; i < n; i++) {
                    val = Math.abs(A[astep * indC[i] + i]);
                    if (mv < val) mv = val, k = indC[i], l = i;
                }

                p = A[astep * k + l];

                if (Math.abs(p) <= eps) break;

                y = (W[l] - W[k]) * 0.5;
                t = Math.abs(y) + hypot(p, y);
                s = hypot(p, t);
                c = t / s;
                s = p / s;t = p / t * p;
                if (y < 0) s = -s, t = -t;
                A[astep * k + l] = 0;

                W[k] -= t;
                W[l] += t;

                // rotate rows and columns k and l
                for (i = 0; i < k; i++) {
                    _in = astep * i + k;
                    _in2 = astep * i + l;
                    a0 = A[_in];
                    b0 = A[_in2];
                    A[_in] = a0 * c - b0 * s;
                    A[_in2] = a0 * s + b0 * c;
                }
                for (i = k + 1; i < l; i++) {
                    _in = astep * k + i;
                    _in2 = astep * i + l;
                    a0 = A[_in];
                    b0 = A[_in2];
                    A[_in] = a0 * c - b0 * s;
                    A[_in2] = a0 * s + b0 * c;
                }
                i = l + 1;
                _in = astep * k + i;
                _in2 = astep * l + i;
                for (; i < n; i++, _in++, _in2++) {
                    a0 = A[_in];
                    b0 = A[_in2];
                    A[_in] = a0 * c - b0 * s;
                    A[_in2] = a0 * s + b0 * c;
                }

                // rotate eigenvectors
                if (V) {
                    _in = vstep * k;
                    _in2 = vstep * l;
                    for (i = 0; i < n; i++, _in++, _in2++) {
                        a0 = V[_in];
                        b0 = V[_in2];
                        V[_in] = a0 * c - b0 * s;
                        V[_in2] = a0 * s + b0 * c;
                    }
                }

                for (j = 0; j < 2; j++) {
                    idx = j == 0 ? k : l;
                    if (idx < n - 1) {
                        for (m = idx + 1, mv = Math.abs(A[astep * idx + m]), i = idx + 2; i < n; i++) {
                            val = Math.abs(A[astep * idx + i]);
                            if (mv < val) mv = val, m = i;
                        }
                        indR[idx] = m;
                    }
                    if (idx > 0) {
                        for (m = 0, mv = Math.abs(A[idx]), i = 1; i < idx; i++) {
                            val = Math.abs(A[astep * i + idx]);
                            if (mv < val) mv = val, m = i;
                        }
                        indC[idx] = m;
                    }
                }
            }

            // sort eigenvalues & eigenvectors
            for (k = 0; k < n - 1; k++) {
                m = k;
                for (i = k + 1; i < n; i++) {
                    if (W[m] < W[i]) m = i;
                }
                if (k != m) {
                    swap(W, m, k, mv);
                    if (V) {
                        for (i = 0; i < n; i++) {
                            swap(V, vstep * m + i, vstep * k + i, mv);
                        }
                    }
                }
            }

            jsfeat.cache.put_buffer(indR_buff);
            jsfeat.cache.put_buffer(indC_buff);
        };

        var JacobiSVDImpl = function JacobiSVDImpl(At, astep, _W, Vt, vstep, m, n, n1) {
            var eps = jsfeat.EPSILON * 2.0;
            var minval = jsfeat.FLT_MIN;
            var i = 0,
                j = 0,
                k = 0,
                iter = 0,
                max_iter = Math.max(m, 30);
            var Ai = 0,
                Aj = 0,
                Vi = 0,
                Vj = 0,
                changed = 0;
            var c = 0.0,
                s = 0.0,
                t = 0.0;
            var t0 = 0.0,
                t1 = 0.0,
                sd = 0.0,
                beta = 0.0,
                gamma = 0.0,
                delta = 0.0,
                a = 0.0,
                p = 0.0,
                b = 0.0;
            var seed = 0x1234;
            var val = 0.0,
                val0 = 0.0,
                asum = 0.0;

            var W_buff = jsfeat.cache.get_buffer(n << 3);
            var W = W_buff.f64;

            for (; i < n; i++) {
                for (k = 0, sd = 0; k < m; k++) {
                    t = At[i * astep + k];
                    sd += t * t;
                }
                W[i] = sd;

                if (Vt) {
                    for (k = 0; k < n; k++) {
                        Vt[i * vstep + k] = 0;
                    }
                    Vt[i * vstep + i] = 1;
                }
            }

            for (; iter < max_iter; iter++) {
                changed = 0;

                for (i = 0; i < n - 1; i++) {
                    for (j = i + 1; j < n; j++) {
                        Ai = i * astep | 0, Aj = j * astep | 0;
                        a = W[i], p = 0, b = W[j];

                        k = 2;
                        p += At[Ai] * At[Aj];
                        p += At[Ai + 1] * At[Aj + 1];

                        for (; k < m; k++) {
                            p += At[Ai + k] * At[Aj + k];
                        }if (Math.abs(p) <= eps * Math.sqrt(a * b)) continue;

                        p *= 2.0;
                        beta = a - b, gamma = hypot(p, beta);
                        if (beta < 0) {
                            delta = (gamma - beta) * 0.5;
                            s = Math.sqrt(delta / gamma);
                            c = p / (gamma * s * 2.0);
                        } else {
                            c = Math.sqrt((gamma + beta) / (gamma * 2.0));
                            s = p / (gamma * c * 2.0);
                        }

                        a = 0.0, b = 0.0;

                        k = 2; // unroll
                        t0 = c * At[Ai] + s * At[Aj];
                        t1 = -s * At[Ai] + c * At[Aj];
                        At[Ai] = t0;At[Aj] = t1;
                        a += t0 * t0;b += t1 * t1;

                        t0 = c * At[Ai + 1] + s * At[Aj + 1];
                        t1 = -s * At[Ai + 1] + c * At[Aj + 1];
                        At[Ai + 1] = t0;At[Aj + 1] = t1;
                        a += t0 * t0;b += t1 * t1;

                        for (; k < m; k++) {
                            t0 = c * At[Ai + k] + s * At[Aj + k];
                            t1 = -s * At[Ai + k] + c * At[Aj + k];
                            At[Ai + k] = t0;At[Aj + k] = t1;

                            a += t0 * t0;b += t1 * t1;
                        }

                        W[i] = a;W[j] = b;

                        changed = 1;

                        if (Vt) {
                            Vi = i * vstep | 0, Vj = j * vstep | 0;

                            k = 2;
                            t0 = c * Vt[Vi] + s * Vt[Vj];
                            t1 = -s * Vt[Vi] + c * Vt[Vj];
                            Vt[Vi] = t0;Vt[Vj] = t1;

                            t0 = c * Vt[Vi + 1] + s * Vt[Vj + 1];
                            t1 = -s * Vt[Vi + 1] + c * Vt[Vj + 1];
                            Vt[Vi + 1] = t0;Vt[Vj + 1] = t1;

                            for (; k < n; k++) {
                                t0 = c * Vt[Vi + k] + s * Vt[Vj + k];
                                t1 = -s * Vt[Vi + k] + c * Vt[Vj + k];
                                Vt[Vi + k] = t0;Vt[Vj + k] = t1;
                            }
                        }
                    }
                }
                if (changed == 0) break;
            }

            for (i = 0; i < n; i++) {
                for (k = 0, sd = 0; k < m; k++) {
                    t = At[i * astep + k];
                    sd += t * t;
                }
                W[i] = Math.sqrt(sd);
            }

            for (i = 0; i < n - 1; i++) {
                j = i;
                for (k = i + 1; k < n; k++) {
                    if (W[j] < W[k]) j = k;
                }
                if (i != j) {
                    swap(W, i, j, sd);
                    if (Vt) {
                        for (k = 0; k < m; k++) {
                            swap(At, i * astep + k, j * astep + k, t);
                        }

                        for (k = 0; k < n; k++) {
                            swap(Vt, i * vstep + k, j * vstep + k, t);
                        }
                    }
                }
            }

            for (i = 0; i < n; i++) {
                _W[i] = W[i];
            }

            if (!Vt) {
                jsfeat.cache.put_buffer(W_buff);
                return;
            }

            for (i = 0; i < n1; i++) {

                sd = i < n ? W[i] : 0;

                while (sd <= minval) {
                    // if we got a zero singular value, then in order to get the corresponding left singular vector
                    // we generate a random vector, project it to the previously computed left singular vectors,
                    // subtract the projection and normalize the difference.
                    val0 = 1.0 / m;
                    for (k = 0; k < m; k++) {
                        seed = seed * 214013 + 2531011;
                        val = (seed >> 16 & 0x7fff & 256) != 0 ? val0 : -val0;
                        At[i * astep + k] = val;
                    }
                    for (iter = 0; iter < 2; iter++) {
                        for (j = 0; j < i; j++) {
                            sd = 0;
                            for (k = 0; k < m; k++) {
                                sd += At[i * astep + k] * At[j * astep + k];
                            }
                            asum = 0.0;
                            for (k = 0; k < m; k++) {
                                t = At[i * astep + k] - sd * At[j * astep + k];
                                At[i * astep + k] = t;
                                asum += Math.abs(t);
                            }
                            asum = asum ? 1.0 / asum : 0;
                            for (k = 0; k < m; k++) {
                                At[i * astep + k] *= asum;
                            }
                        }
                    }
                    sd = 0;
                    for (k = 0; k < m; k++) {
                        t = At[i * astep + k];
                        sd += t * t;
                    }
                    sd = Math.sqrt(sd);
                }

                s = 1.0 / sd;
                for (k = 0; k < m; k++) {
                    At[i * astep + k] *= s;
                }
            }

            jsfeat.cache.put_buffer(W_buff);
        };

        return {

            lu_solve: function lu_solve(A, B) {
                var i = 0,
                    j = 0,
                    k = 0,
                    p = 1,
                    astep = A.cols;
                var ad = A.data,
                    bd = B.data;
                var t, alpha, d, s;

                for (i = 0; i < astep; i++) {
                    k = i;
                    for (j = i + 1; j < astep; j++) {
                        if (Math.abs(ad[j * astep + i]) > Math.abs(ad[k * astep + i])) {
                            k = j;
                        }
                    }

                    if (Math.abs(ad[k * astep + i]) < jsfeat.EPSILON) {
                        return 0; // FAILED
                    }

                    if (k != i) {
                        for (j = i; j < astep; j++) {
                            swap(ad, i * astep + j, k * astep + j, t);
                        }

                        swap(bd, i, k, t);
                        p = -p;
                    }

                    d = -1.0 / ad[i * astep + i];

                    for (j = i + 1; j < astep; j++) {
                        alpha = ad[j * astep + i] * d;

                        for (k = i + 1; k < astep; k++) {
                            ad[j * astep + k] += alpha * ad[i * astep + k];
                        }

                        bd[j] += alpha * bd[i];
                    }

                    ad[i * astep + i] = -d;
                }

                for (i = astep - 1; i >= 0; i--) {
                    s = bd[i];
                    for (k = i + 1; k < astep; k++) {
                        s -= ad[i * astep + k] * bd[k];
                    }
                    bd[i] = s * ad[i * astep + i];
                }

                return 1; // OK
            },

            cholesky_solve: function cholesky_solve(A, B) {
                var col = 0,
                    row = 0,
                    col2 = 0,
                    cs = 0,
                    rs = 0,
                    i = 0,
                    j = 0;
                var size = A.cols;
                var ad = A.data,
                    bd = B.data;
                var val, inv_diag;

                for (col = 0; col < size; col++) {
                    inv_diag = 1.0;
                    cs = col * size;
                    rs = cs;
                    for (row = col; row < size; row++) {
                        // correct for the parts of cholesky already computed
                        val = ad[rs + col];
                        for (col2 = 0; col2 < col; col2++) {
                            val -= ad[col2 * size + col] * ad[rs + col2];
                        }
                        if (row == col) {
                            // this is the diagonal element so don't divide
                            ad[rs + col] = val;
                            if (val == 0) {
                                return 0;
                            }
                            inv_diag = 1.0 / val;
                        } else {
                            // cache the value without division in the upper half
                            ad[cs + row] = val;
                            // divide my the diagonal element for all others
                            ad[rs + col] = val * inv_diag;
                        }
                        rs = rs + size;
                    }
                }

                // first backsub through L
                cs = 0;
                for (i = 0; i < size; i++) {
                    val = bd[i];
                    for (j = 0; j < i; j++) {
                        val -= ad[cs + j] * bd[j];
                    }
                    bd[i] = val;
                    cs = cs + size;
                }
                // backsub through diagonal
                cs = 0;
                for (i = 0; i < size; i++) {
                    bd[i] /= ad[cs + i];
                    cs = cs + size;
                }
                // backsub through L Transpose
                i = size - 1;
                for (; i >= 0; i--) {
                    val = bd[i];
                    j = i + 1;
                    cs = j * size;
                    for (; j < size; j++) {
                        val -= ad[cs + i] * bd[j];
                        cs = cs + size;
                    }
                    bd[i] = val;
                }

                return 1;
            },

            svd_decompose: function svd_decompose(A, W, U, V, options) {
                if (typeof options === "undefined") {
                    options = 0;
                };
                var at = 0,
                    i = 0,
                    j = 0,
                    _m = A.rows,
                    _n = A.cols,
                    m = _m,
                    n = _n;
                var dt = A.type | jsfeat.C1_t; // we only work with single channel

                if (m < n) {
                    at = 1;
                    i = m;
                    m = n;
                    n = i;
                }

                var a_buff = jsfeat.cache.get_buffer(m * m << 3);
                var w_buff = jsfeat.cache.get_buffer(n << 3);
                var v_buff = jsfeat.cache.get_buffer(n * n << 3);

                var a_mt = new jsfeat.matrix_t(m, m, dt, a_buff.data);
                var w_mt = new jsfeat.matrix_t(1, n, dt, w_buff.data);
                var v_mt = new jsfeat.matrix_t(n, n, dt, v_buff.data);

                if (at == 0) {
                    // transpose
                    jsfeat.matmath.transpose(a_mt, A);
                } else {
                    for (i = 0; i < _n * _m; i++) {
                        a_mt.data[i] = A.data[i];
                    }
                    for (; i < n * m; i++) {
                        a_mt.data[i] = 0;
                    }
                }

                JacobiSVDImpl(a_mt.data, m, w_mt.data, v_mt.data, n, m, n, m);

                if (W) {
                    for (i = 0; i < n; i++) {
                        W.data[i] = w_mt.data[i];
                    }
                    for (; i < _n; i++) {
                        W.data[i] = 0;
                    }
                }

                if (at == 0) {
                    if (U && options & jsfeat.SVD_U_T) {
                        i = m * m;
                        while (--i >= 0) {
                            U.data[i] = a_mt.data[i];
                        }
                    } else if (U) {
                        jsfeat.matmath.transpose(U, a_mt);
                    }

                    if (V && options & jsfeat.SVD_V_T) {
                        i = n * n;
                        while (--i >= 0) {
                            V.data[i] = v_mt.data[i];
                        }
                    } else if (V) {
                        jsfeat.matmath.transpose(V, v_mt);
                    }
                } else {
                    if (U && options & jsfeat.SVD_U_T) {
                        i = n * n;
                        while (--i >= 0) {
                            U.data[i] = v_mt.data[i];
                        }
                    } else if (U) {
                        jsfeat.matmath.transpose(U, v_mt);
                    }

                    if (V && options & jsfeat.SVD_V_T) {
                        i = m * m;
                        while (--i >= 0) {
                            V.data[i] = a_mt.data[i];
                        }
                    } else if (V) {
                        jsfeat.matmath.transpose(V, a_mt);
                    }
                }

                jsfeat.cache.put_buffer(a_buff);
                jsfeat.cache.put_buffer(w_buff);
                jsfeat.cache.put_buffer(v_buff);
            },

            svd_solve: function svd_solve(A, X, B) {
                var i = 0,
                    j = 0,
                    k = 0;
                var pu = 0,
                    pv = 0;
                var nrows = A.rows,
                    ncols = A.cols;
                var sum = 0.0,
                    xsum = 0.0,
                    tol = 0.0;
                var dt = A.type | jsfeat.C1_t;

                var u_buff = jsfeat.cache.get_buffer(nrows * nrows << 3);
                var w_buff = jsfeat.cache.get_buffer(ncols << 3);
                var v_buff = jsfeat.cache.get_buffer(ncols * ncols << 3);

                var u_mt = new jsfeat.matrix_t(nrows, nrows, dt, u_buff.data);
                var w_mt = new jsfeat.matrix_t(1, ncols, dt, w_buff.data);
                var v_mt = new jsfeat.matrix_t(ncols, ncols, dt, v_buff.data);

                var bd = B.data,
                    ud = u_mt.data,
                    wd = w_mt.data,
                    vd = v_mt.data;

                this.svd_decompose(A, w_mt, u_mt, v_mt, 0);

                tol = jsfeat.EPSILON * wd[0] * ncols;

                for (; i < ncols; i++, pv += ncols) {
                    xsum = 0.0;
                    for (j = 0; j < ncols; j++) {
                        if (wd[j] > tol) {
                            for (k = 0, sum = 0.0, pu = 0; k < nrows; k++, pu += ncols) {
                                sum += ud[pu + j] * bd[k];
                            }
                            xsum += sum * vd[pv + j] / wd[j];
                        }
                    }
                    X.data[i] = xsum;
                }

                jsfeat.cache.put_buffer(u_buff);
                jsfeat.cache.put_buffer(w_buff);
                jsfeat.cache.put_buffer(v_buff);
            },

            svd_invert: function svd_invert(Ai, A) {
                var i = 0,
                    j = 0,
                    k = 0;
                var pu = 0,
                    pv = 0,
                    pa = 0;
                var nrows = A.rows,
                    ncols = A.cols;
                var sum = 0.0,
                    tol = 0.0;
                var dt = A.type | jsfeat.C1_t;

                var u_buff = jsfeat.cache.get_buffer(nrows * nrows << 3);
                var w_buff = jsfeat.cache.get_buffer(ncols << 3);
                var v_buff = jsfeat.cache.get_buffer(ncols * ncols << 3);

                var u_mt = new jsfeat.matrix_t(nrows, nrows, dt, u_buff.data);
                var w_mt = new jsfeat.matrix_t(1, ncols, dt, w_buff.data);
                var v_mt = new jsfeat.matrix_t(ncols, ncols, dt, v_buff.data);

                var id = Ai.data,
                    ud = u_mt.data,
                    wd = w_mt.data,
                    vd = v_mt.data;

                this.svd_decompose(A, w_mt, u_mt, v_mt, 0);

                tol = jsfeat.EPSILON * wd[0] * ncols;

                for (; i < ncols; i++, pv += ncols) {
                    for (j = 0, pu = 0; j < nrows; j++, pa++) {
                        for (k = 0, sum = 0.0; k < ncols; k++, pu++) {
                            if (wd[k] > tol) sum += vd[pv + k] * ud[pu] / wd[k];
                        }
                        id[pa] = sum;
                    }
                }

                jsfeat.cache.put_buffer(u_buff);
                jsfeat.cache.put_buffer(w_buff);
                jsfeat.cache.put_buffer(v_buff);
            },

            eigenVV: function eigenVV(A, vects, vals) {
                var n = A.cols,
                    i = n * n;
                var dt = A.type | jsfeat.C1_t;

                var a_buff = jsfeat.cache.get_buffer(n * n << 3);
                var w_buff = jsfeat.cache.get_buffer(n << 3);
                var a_mt = new jsfeat.matrix_t(n, n, dt, a_buff.data);
                var w_mt = new jsfeat.matrix_t(1, n, dt, w_buff.data);

                while (--i >= 0) {
                    a_mt.data[i] = A.data[i];
                }

                JacobiImpl(a_mt.data, n, w_mt.data, vects ? vects.data : null, n, n);

                if (vals) {
                    while (--n >= 0) {
                        vals.data[n] = w_mt.data[n];
                    }
                }

                jsfeat.cache.put_buffer(a_buff);
                jsfeat.cache.put_buffer(w_buff);
            }

        };
    }();

    global.linalg = linalg;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 */

(function (global) {
    "use strict";
    //

    var motion_model = function () {

        var sqr = function sqr(x) {
            return x * x;
        };

        // does isotropic normalization
        var iso_normalize_points = function iso_normalize_points(from, to, T0, T1, count) {
            var i = 0;
            var cx0 = 0.0,
                cy0 = 0.0,
                d0 = 0.0,
                s0 = 0.0;
            var cx1 = 0.0,
                cy1 = 0.0,
                d1 = 0.0,
                s1 = 0.0;
            var dx = 0.0,
                dy = 0.0;

            for (; i < count; ++i) {
                cx0 += from[i].x;
                cy0 += from[i].y;
                cx1 += to[i].x;
                cy1 += to[i].y;
            }

            cx0 /= count;cy0 /= count;
            cx1 /= count;cy1 /= count;

            for (i = 0; i < count; ++i) {
                dx = from[i].x - cx0;
                dy = from[i].y - cy0;
                d0 += Math.sqrt(dx * dx + dy * dy);
                dx = to[i].x - cx1;
                dy = to[i].y - cy1;
                d1 += Math.sqrt(dx * dx + dy * dy);
            }

            d0 /= count;d1 /= count;

            s0 = Math.SQRT2 / d0;s1 = Math.SQRT2 / d1;

            T0[0] = T0[4] = s0;
            T0[2] = -cx0 * s0;
            T0[5] = -cy0 * s0;
            T0[1] = T0[3] = T0[6] = T0[7] = 0.0;
            T0[8] = 1.0;

            T1[0] = T1[4] = s1;
            T1[2] = -cx1 * s1;
            T1[5] = -cy1 * s1;
            T1[1] = T1[3] = T1[6] = T1[7] = 0.0;
            T1[8] = 1.0;
        };

        var have_collinear_points = function have_collinear_points(points, count) {
            var j = 0,
                k = 0,
                i = count - 1 | 0;
            var dx1 = 0.0,
                dy1 = 0.0,
                dx2 = 0.0,
                dy2 = 0.0;

            // check that the i-th selected point does not belong
            // to a line connecting some previously selected points
            for (; j < i; ++j) {
                dx1 = points[j].x - points[i].x;
                dy1 = points[j].y - points[i].y;
                for (k = 0; k < j; ++k) {
                    dx2 = points[k].x - points[i].x;
                    dy2 = points[k].y - points[i].y;
                    if (Math.abs(dx2 * dy1 - dy2 * dx1) <= jsfeat.EPSILON * (Math.abs(dx1) + Math.abs(dy1) + Math.abs(dx2) + Math.abs(dy2))) return true;
                }
            }
            return false;
        };

        var T0 = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
        var T1 = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
        var AtA = new jsfeat.matrix_t(6, 6, jsfeat.F32_t | jsfeat.C1_t);
        var AtB = new jsfeat.matrix_t(6, 1, jsfeat.F32_t | jsfeat.C1_t);

        var affine2d = function () {

            function affine2d() {
                // empty constructor
            }

            affine2d.prototype.run = function (from, to, model, count) {
                var i = 0,
                    j = 0;
                var dt = model.type | jsfeat.C1_t;
                var md = model.data,
                    t0d = T0.data,
                    t1d = T1.data;
                var pt0,
                    pt1,
                    px = 0.0,
                    py = 0.0;

                iso_normalize_points(from, to, t0d, t1d, count);

                var a_buff = jsfeat.cache.get_buffer(2 * count * 6 << 3);
                var b_buff = jsfeat.cache.get_buffer(2 * count << 3);

                var a_mt = new jsfeat.matrix_t(6, 2 * count, dt, a_buff.data);
                var b_mt = new jsfeat.matrix_t(1, 2 * count, dt, b_buff.data);
                var ad = a_mt.data,
                    bd = b_mt.data;

                for (; i < count; ++i) {
                    pt0 = from[i];
                    pt1 = to[i];

                    px = t0d[0] * pt0.x + t0d[1] * pt0.y + t0d[2];
                    py = t0d[3] * pt0.x + t0d[4] * pt0.y + t0d[5];

                    j = i * 2 * 6;
                    ad[j] = px, ad[j + 1] = py, ad[j + 2] = 1.0, ad[j + 3] = 0.0, ad[j + 4] = 0.0, ad[j + 5] = 0.0;

                    j += 6;
                    ad[j] = 0.0, ad[j + 1] = 0.0, ad[j + 2] = 0.0, ad[j + 3] = px, ad[j + 4] = py, ad[j + 5] = 1.0;

                    bd[i << 1] = t1d[0] * pt1.x + t1d[1] * pt1.y + t1d[2];
                    bd[(i << 1) + 1] = t1d[3] * pt1.x + t1d[4] * pt1.y + t1d[5];
                }

                jsfeat.matmath.multiply_AtA(AtA, a_mt);
                jsfeat.matmath.multiply_AtB(AtB, a_mt, b_mt);

                jsfeat.linalg.lu_solve(AtA, AtB);

                md[0] = AtB.data[0], md[1] = AtB.data[1], md[2] = AtB.data[2];
                md[3] = AtB.data[3], md[4] = AtB.data[4], md[5] = AtB.data[5];
                md[6] = 0.0, md[7] = 0.0, md[8] = 1.0; // fill last row

                // denormalize
                jsfeat.matmath.invert_3x3(T1, T1);
                jsfeat.matmath.multiply_3x3(model, T1, model);
                jsfeat.matmath.multiply_3x3(model, model, T0);

                // free buffer
                jsfeat.cache.put_buffer(a_buff);
                jsfeat.cache.put_buffer(b_buff);

                return 1;
            };

            affine2d.prototype.error = function (from, to, model, err, count) {
                var i = 0;
                var pt0, pt1;
                var m = model.data;

                for (; i < count; ++i) {
                    pt0 = from[i];
                    pt1 = to[i];

                    err[i] = sqr(pt1.x - m[0] * pt0.x - m[1] * pt0.y - m[2]) + sqr(pt1.y - m[3] * pt0.x - m[4] * pt0.y - m[5]);
                }
            };

            affine2d.prototype.check_subset = function (from, to, count) {
                return true; // all good
            };

            return affine2d;
        }();

        var mLtL = new jsfeat.matrix_t(9, 9, jsfeat.F32_t | jsfeat.C1_t);
        var Evec = new jsfeat.matrix_t(9, 9, jsfeat.F32_t | jsfeat.C1_t);

        var homography2d = function () {

            function homography2d() {
                // empty constructor
                //this.T0 = new jsfeat.matrix_t(3, 3, jsfeat.F32_t|jsfeat.C1_t);
                //this.T1 = new jsfeat.matrix_t(3, 3, jsfeat.F32_t|jsfeat.C1_t);
                //this.mLtL = new jsfeat.matrix_t(9, 9, jsfeat.F32_t|jsfeat.C1_t);
                //this.Evec = new jsfeat.matrix_t(9, 9, jsfeat.F32_t|jsfeat.C1_t);
            }

            homography2d.prototype.run = function (from, to, model, count) {
                var i = 0,
                    j = 0;
                var md = model.data,
                    t0d = T0.data,
                    t1d = T1.data;
                var LtL = mLtL.data,
                    evd = Evec.data;
                var x = 0.0,
                    y = 0.0,
                    X = 0.0,
                    Y = 0.0;

                // norm
                var smx = 0.0,
                    smy = 0.0,
                    cmx = 0.0,
                    cmy = 0.0,
                    sMx = 0.0,
                    sMy = 0.0,
                    cMx = 0.0,
                    cMy = 0.0;

                for (; i < count; ++i) {
                    cmx += to[i].x;
                    cmy += to[i].y;
                    cMx += from[i].x;
                    cMy += from[i].y;
                }

                cmx /= count;cmy /= count;
                cMx /= count;cMy /= count;

                for (i = 0; i < count; ++i) {
                    smx += Math.abs(to[i].x - cmx);
                    smy += Math.abs(to[i].y - cmy);
                    sMx += Math.abs(from[i].x - cMx);
                    sMy += Math.abs(from[i].y - cMy);
                }

                if (Math.abs(smx) < jsfeat.EPSILON || Math.abs(smy) < jsfeat.EPSILON || Math.abs(sMx) < jsfeat.EPSILON || Math.abs(sMy) < jsfeat.EPSILON) return 0;

                smx = count / smx;smy = count / smy;
                sMx = count / sMx;sMy = count / sMy;

                t0d[0] = sMx;t0d[1] = 0;t0d[2] = -cMx * sMx;
                t0d[3] = 0;t0d[4] = sMy;t0d[5] = -cMy * sMy;
                t0d[6] = 0;t0d[7] = 0;t0d[8] = 1;

                t1d[0] = 1.0 / smx;t1d[1] = 0;t1d[2] = cmx;
                t1d[3] = 0;t1d[4] = 1.0 / smy;t1d[5] = cmy;
                t1d[6] = 0;t1d[7] = 0;t1d[8] = 1;
                //

                // construct system
                i = 81;
                while (--i >= 0) {
                    LtL[i] = 0.0;
                }
                for (i = 0; i < count; ++i) {
                    x = (to[i].x - cmx) * smx;
                    y = (to[i].y - cmy) * smy;
                    X = (from[i].x - cMx) * sMx;
                    Y = (from[i].y - cMy) * sMy;

                    LtL[0] += X * X;
                    LtL[1] += X * Y;
                    LtL[2] += X;

                    LtL[6] += X * -x * X;
                    LtL[7] += X * -x * Y;
                    LtL[8] += X * -x;
                    LtL[10] += Y * Y;
                    LtL[11] += Y;

                    LtL[15] += Y * -x * X;
                    LtL[16] += Y * -x * Y;
                    LtL[17] += Y * -x;
                    LtL[20] += 1.0;

                    LtL[24] += -x * X;
                    LtL[25] += -x * Y;
                    LtL[26] += -x;
                    LtL[30] += X * X;
                    LtL[31] += X * Y;
                    LtL[32] += X;
                    LtL[33] += X * -y * X;
                    LtL[34] += X * -y * Y;
                    LtL[35] += X * -y;
                    LtL[40] += Y * Y;
                    LtL[41] += Y;
                    LtL[42] += Y * -y * X;
                    LtL[43] += Y * -y * Y;
                    LtL[44] += Y * -y;
                    LtL[50] += 1.0;
                    LtL[51] += -y * X;
                    LtL[52] += -y * Y;
                    LtL[53] += -y;
                    LtL[60] += -x * X * -x * X + -y * X * -y * X;
                    LtL[61] += -x * X * -x * Y + -y * X * -y * Y;
                    LtL[62] += -x * X * -x + -y * X * -y;
                    LtL[70] += -x * Y * -x * Y + -y * Y * -y * Y;
                    LtL[71] += -x * Y * -x + -y * Y * -y;
                    LtL[80] += -x * -x + -y * -y;
                }
                //

                // symmetry
                for (i = 0; i < 9; ++i) {
                    for (j = 0; j < i; ++j) {
                        LtL[i * 9 + j] = LtL[j * 9 + i];
                    }
                }

                jsfeat.linalg.eigenVV(mLtL, Evec);

                md[0] = evd[72], md[1] = evd[73], md[2] = evd[74];
                md[3] = evd[75], md[4] = evd[76], md[5] = evd[77];
                md[6] = evd[78], md[7] = evd[79], md[8] = evd[80];

                // denormalize
                jsfeat.matmath.multiply_3x3(model, T1, model);
                jsfeat.matmath.multiply_3x3(model, model, T0);

                // set bottom right to 1.0
                x = 1.0 / md[8];
                md[0] *= x;md[1] *= x;md[2] *= x;
                md[3] *= x;md[4] *= x;md[5] *= x;
                md[6] *= x;md[7] *= x;md[8] = 1.0;

                return 1;
            };

            homography2d.prototype.error = function (from, to, model, err, count) {
                var i = 0;
                var pt0,
                    pt1,
                    ww = 0.0,
                    dx = 0.0,
                    dy = 0.0;
                var m = model.data;

                for (; i < count; ++i) {
                    pt0 = from[i];
                    pt1 = to[i];

                    ww = 1.0 / (m[6] * pt0.x + m[7] * pt0.y + 1.0);
                    dx = (m[0] * pt0.x + m[1] * pt0.y + m[2]) * ww - pt1.x;
                    dy = (m[3] * pt0.x + m[4] * pt0.y + m[5]) * ww - pt1.y;
                    err[i] = dx * dx + dy * dy;
                }
            };

            homography2d.prototype.check_subset = function (from, to, count) {
                // seems to reject good subsets actually
                //if( have_collinear_points(from, count) || have_collinear_points(to, count) ) {
                //return false;
                //}
                if (count == 4) {
                    var negative = 0;

                    var fp0 = from[0],
                        fp1 = from[1],
                        fp2 = from[2],
                        fp3 = from[3];
                    var tp0 = to[0],
                        tp1 = to[1],
                        tp2 = to[2],
                        tp3 = to[3];

                    // set1
                    var A11 = fp0.x,
                        A12 = fp0.y,
                        A13 = 1.0;
                    var A21 = fp1.x,
                        A22 = fp1.y,
                        A23 = 1.0;
                    var A31 = fp2.x,
                        A32 = fp2.y,
                        A33 = 1.0;

                    var B11 = tp0.x,
                        B12 = tp0.y,
                        B13 = 1.0;
                    var B21 = tp1.x,
                        B22 = tp1.y,
                        B23 = 1.0;
                    var B31 = tp2.x,
                        B32 = tp2.y,
                        B33 = 1.0;

                    var detA = jsfeat.matmath.determinant_3x3(A11, A12, A13, A21, A22, A23, A31, A32, A33);
                    var detB = jsfeat.matmath.determinant_3x3(B11, B12, B13, B21, B22, B23, B31, B32, B33);

                    if (detA * detB < 0) negative++;

                    // set2
                    A11 = fp1.x, A12 = fp1.y;
                    A21 = fp2.x, A22 = fp2.y;
                    A31 = fp3.x, A32 = fp3.y;

                    B11 = tp1.x, B12 = tp1.y;
                    B21 = tp2.x, B22 = tp2.y;
                    B31 = tp3.x, B32 = tp3.y;

                    detA = jsfeat.matmath.determinant_3x3(A11, A12, A13, A21, A22, A23, A31, A32, A33);
                    detB = jsfeat.matmath.determinant_3x3(B11, B12, B13, B21, B22, B23, B31, B32, B33);

                    if (detA * detB < 0) negative++;

                    // set3
                    A11 = fp0.x, A12 = fp0.y;
                    A21 = fp2.x, A22 = fp2.y;
                    A31 = fp3.x, A32 = fp3.y;

                    B11 = tp0.x, B12 = tp0.y;
                    B21 = tp2.x, B22 = tp2.y;
                    B31 = tp3.x, B32 = tp3.y;

                    detA = jsfeat.matmath.determinant_3x3(A11, A12, A13, A21, A22, A23, A31, A32, A33);
                    detB = jsfeat.matmath.determinant_3x3(B11, B12, B13, B21, B22, B23, B31, B32, B33);

                    if (detA * detB < 0) negative++;

                    // set4
                    A11 = fp0.x, A12 = fp0.y;
                    A21 = fp1.x, A22 = fp1.y;
                    A31 = fp3.x, A32 = fp3.y;

                    B11 = tp0.x, B12 = tp0.y;
                    B21 = tp1.x, B22 = tp1.y;
                    B31 = tp3.x, B32 = tp3.y;

                    detA = jsfeat.matmath.determinant_3x3(A11, A12, A13, A21, A22, A23, A31, A32, A33);
                    detB = jsfeat.matmath.determinant_3x3(B11, B12, B13, B21, B22, B23, B31, B32, B33);

                    if (detA * detB < 0) negative++;

                    if (negative != 0 && negative != 4) {
                        return false;
                    }
                }
                return true; // all good
            };

            return homography2d;
        }();

        return {

            affine2d: affine2d,
            homography2d: homography2d

        };
    }();

    var ransac_params_t = function () {
        function ransac_params_t(size, thresh, eps, prob) {
            if (typeof size === "undefined") {
                size = 0;
            }
            if (typeof thresh === "undefined") {
                thresh = 0.5;
            }
            if (typeof eps === "undefined") {
                eps = 0.5;
            }
            if (typeof prob === "undefined") {
                prob = 0.99;
            }

            this.size = size;
            this.thresh = thresh;
            this.eps = eps;
            this.prob = prob;
        };
        ransac_params_t.prototype.update_iters = function (_eps, max_iters) {
            var num = Math.log(1 - this.prob);
            var denom = Math.log(1 - Math.pow(1 - _eps, this.size));
            return (denom >= 0 || -num >= max_iters * -denom ? max_iters : Math.round(num / denom)) | 0;
        };
        return ransac_params_t;
    }();

    var motion_estimator = function () {

        var get_subset = function get_subset(kernel, from, to, need_cnt, max_cnt, from_sub, to_sub) {
            var max_try = 1000;
            var indices = [];
            var i = 0,
                j = 0,
                ssiter = 0,
                idx_i = 0,
                ok = false;
            for (; ssiter < max_try; ++ssiter) {
                i = 0;
                for (; i < need_cnt && ssiter < max_try;) {
                    ok = false;
                    idx_i = 0;
                    while (!ok) {
                        ok = true;
                        idx_i = indices[i] = Math.floor(Math.random() * max_cnt) | 0;
                        for (j = 0; j < i; ++j) {
                            if (idx_i == indices[j]) {
                                ok = false;break;
                            }
                        }
                    }
                    from_sub[i] = from[idx_i];
                    to_sub[i] = to[idx_i];
                    if (!kernel.check_subset(from_sub, to_sub, i + 1)) {
                        ssiter++;
                        continue;
                    }
                    ++i;
                }
                break;
            }

            return i == need_cnt && ssiter < max_try;
        };

        var find_inliers = function find_inliers(kernel, model, from, to, count, thresh, err, mask) {
            var numinliers = 0,
                i = 0,
                f = 0;
            var t = thresh * thresh;

            kernel.error(from, to, model, err, count);

            for (; i < count; ++i) {
                f = err[i] <= t;
                mask[i] = f;
                numinliers += f;
            }
            return numinliers;
        };

        return {

            ransac: function ransac(params, kernel, from, to, count, model, mask, max_iters) {
                if (typeof max_iters === "undefined") {
                    max_iters = 1000;
                }

                if (count < params.size) return false;

                var model_points = params.size;
                var niters = max_iters,
                    iter = 0;
                var result = false;

                var subset0 = [];
                var subset1 = [];
                var found = false;

                var mc = model.cols,
                    mr = model.rows;
                var dt = model.type | jsfeat.C1_t;

                var m_buff = jsfeat.cache.get_buffer(mc * mr << 3);
                var ms_buff = jsfeat.cache.get_buffer(count);
                var err_buff = jsfeat.cache.get_buffer(count << 2);
                var M = new jsfeat.matrix_t(mc, mr, dt, m_buff.data);
                var curr_mask = new jsfeat.matrix_t(count, 1, jsfeat.U8C1_t, ms_buff.data);

                var inliers_max = -1,
                    numinliers = 0;
                var nmodels = 0;

                var err = err_buff.f32;

                // special case
                if (count == model_points) {
                    if (kernel.run(from, to, M, count) <= 0) {
                        jsfeat.cache.put_buffer(m_buff);
                        jsfeat.cache.put_buffer(ms_buff);
                        jsfeat.cache.put_buffer(err_buff);
                        return false;
                    }

                    M.copy_to(model);
                    if (mask) {
                        while (--count >= 0) {
                            mask.data[count] = 1;
                        }
                    }
                    jsfeat.cache.put_buffer(m_buff);
                    jsfeat.cache.put_buffer(ms_buff);
                    jsfeat.cache.put_buffer(err_buff);
                    return true;
                }

                for (; iter < niters; ++iter) {
                    // generate subset
                    found = get_subset(kernel, from, to, model_points, count, subset0, subset1);
                    if (!found) {
                        if (iter == 0) {
                            jsfeat.cache.put_buffer(m_buff);
                            jsfeat.cache.put_buffer(ms_buff);
                            jsfeat.cache.put_buffer(err_buff);
                            return false;
                        }
                        break;
                    }

                    nmodels = kernel.run(subset0, subset1, M, model_points);
                    if (nmodels <= 0) continue;

                    // TODO handle multimodel output

                    numinliers = find_inliers(kernel, M, from, to, count, params.thresh, err, curr_mask.data);

                    if (numinliers > Math.max(inliers_max, model_points - 1)) {
                        M.copy_to(model);
                        inliers_max = numinliers;
                        if (mask) curr_mask.copy_to(mask);
                        niters = params.update_iters((count - numinliers) / count, niters);
                        result = true;
                    }
                }

                jsfeat.cache.put_buffer(m_buff);
                jsfeat.cache.put_buffer(ms_buff);
                jsfeat.cache.put_buffer(err_buff);

                return result;
            },

            lmeds: function lmeds(params, kernel, from, to, count, model, mask, max_iters) {
                if (typeof max_iters === "undefined") {
                    max_iters = 1000;
                }

                if (count < params.size) return false;

                var model_points = params.size;
                var niters = max_iters,
                    iter = 0;
                var result = false;

                var subset0 = [];
                var subset1 = [];
                var found = false;

                var mc = model.cols,
                    mr = model.rows;
                var dt = model.type | jsfeat.C1_t;

                var m_buff = jsfeat.cache.get_buffer(mc * mr << 3);
                var ms_buff = jsfeat.cache.get_buffer(count);
                var err_buff = jsfeat.cache.get_buffer(count << 2);
                var M = new jsfeat.matrix_t(mc, mr, dt, m_buff.data);
                var curr_mask = new jsfeat.matrix_t(count, 1, jsfeat.U8_t | jsfeat.C1_t, ms_buff.data);

                var numinliers = 0;
                var nmodels = 0;

                var err = err_buff.f32;
                var min_median = 1000000000.0,
                    sigma = 0.0,
                    median = 0.0;

                params.eps = 0.45;
                niters = params.update_iters(params.eps, niters);

                // special case
                if (count == model_points) {
                    if (kernel.run(from, to, M, count) <= 0) {
                        jsfeat.cache.put_buffer(m_buff);
                        jsfeat.cache.put_buffer(ms_buff);
                        jsfeat.cache.put_buffer(err_buff);
                        return false;
                    }

                    M.copy_to(model);
                    if (mask) {
                        while (--count >= 0) {
                            mask.data[count] = 1;
                        }
                    }
                    jsfeat.cache.put_buffer(m_buff);
                    jsfeat.cache.put_buffer(ms_buff);
                    jsfeat.cache.put_buffer(err_buff);
                    return true;
                }

                for (; iter < niters; ++iter) {
                    // generate subset
                    found = get_subset(kernel, from, to, model_points, count, subset0, subset1);
                    if (!found) {
                        if (iter == 0) {
                            jsfeat.cache.put_buffer(m_buff);
                            jsfeat.cache.put_buffer(ms_buff);
                            jsfeat.cache.put_buffer(err_buff);
                            return false;
                        }
                        break;
                    }

                    nmodels = kernel.run(subset0, subset1, M, model_points);
                    if (nmodels <= 0) continue;

                    // TODO handle multimodel output

                    kernel.error(from, to, M, err, count);
                    median = jsfeat.math.median(err, 0, count - 1);

                    if (median < min_median) {
                        min_median = median;
                        M.copy_to(model);
                        result = true;
                    }
                }

                if (result) {
                    sigma = 2.5 * 1.4826 * (1 + 5.0 / (count - model_points)) * Math.sqrt(min_median);
                    sigma = Math.max(sigma, 0.001);

                    numinliers = find_inliers(kernel, model, from, to, count, sigma, err, curr_mask.data);
                    if (mask) curr_mask.copy_to(mask);

                    result = numinliers >= model_points;
                }

                jsfeat.cache.put_buffer(m_buff);
                jsfeat.cache.put_buffer(ms_buff);
                jsfeat.cache.put_buffer(err_buff);

                return result;
            }

        };
    }();

    global.ransac_params_t = ransac_params_t;
    global.motion_model = motion_model;
    global.motion_estimator = motion_estimator;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function (global) {
    "use strict";
    //

    var imgproc = function () {

        var _resample_u8 = function _resample_u8(src, dst, nw, nh) {
            var xofs_count = 0;
            var ch = src.channel,
                w = src.cols,
                h = src.rows;
            var src_d = src.data,
                dst_d = dst.data;
            var scale_x = w / nw,
                scale_y = h / nh;
            var inv_scale_256 = scale_x * scale_y * 0x10000 | 0;
            var dx = 0,
                dy = 0,
                sx = 0,
                sy = 0,
                sx1 = 0,
                sx2 = 0,
                i = 0,
                k = 0,
                fsx1 = 0.0,
                fsx2 = 0.0;
            var a = 0,
                b = 0,
                dxn = 0,
                alpha = 0,
                beta = 0,
                beta1 = 0;

            var buf_node = jsfeat.cache.get_buffer(nw * ch << 2);
            var sum_node = jsfeat.cache.get_buffer(nw * ch << 2);
            var xofs_node = jsfeat.cache.get_buffer(w * 2 * 3 << 2);

            var buf = buf_node.i32;
            var sum = sum_node.i32;
            var xofs = xofs_node.i32;

            for (; dx < nw; dx++) {
                fsx1 = dx * scale_x, fsx2 = fsx1 + scale_x;
                sx1 = fsx1 + 1.0 - 1e-6 | 0, sx2 = fsx2 | 0;
                sx1 = Math.min(sx1, w - 1);
                sx2 = Math.min(sx2, w - 1);

                if (sx1 > fsx1) {
                    xofs[k++] = dx * ch | 0;
                    xofs[k++] = (sx1 - 1) * ch | 0;
                    xofs[k++] = (sx1 - fsx1) * 0x100 | 0;
                    xofs_count++;
                }
                for (sx = sx1; sx < sx2; sx++) {
                    xofs_count++;
                    xofs[k++] = dx * ch | 0;
                    xofs[k++] = sx * ch | 0;
                    xofs[k++] = 256;
                }
                if (fsx2 - sx2 > 1e-3) {
                    xofs_count++;
                    xofs[k++] = dx * ch | 0;
                    xofs[k++] = sx2 * ch | 0;
                    xofs[k++] = (fsx2 - sx2) * 256 | 0;
                }
            }

            for (dx = 0; dx < nw * ch; dx++) {
                buf[dx] = sum[dx] = 0;
            }
            dy = 0;
            for (sy = 0; sy < h; sy++) {
                a = w * sy;
                for (k = 0; k < xofs_count; k++) {
                    dxn = xofs[k * 3];
                    sx1 = xofs[k * 3 + 1];
                    alpha = xofs[k * 3 + 2];
                    for (i = 0; i < ch; i++) {
                        buf[dxn + i] += src_d[a + sx1 + i] * alpha;
                    }
                }
                if ((dy + 1) * scale_y <= sy + 1 || sy == h - 1) {
                    beta = Math.max(sy + 1 - (dy + 1) * scale_y, 0.0) * 256 | 0;
                    beta1 = 256 - beta;
                    b = nw * dy;
                    if (beta <= 0) {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b + dx] = Math.min(Math.max((sum[dx] + buf[dx] * 256) / inv_scale_256, 0), 255);
                            sum[dx] = buf[dx] = 0;
                        }
                    } else {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b + dx] = Math.min(Math.max((sum[dx] + buf[dx] * beta1) / inv_scale_256, 0), 255);
                            sum[dx] = buf[dx] * beta;
                            buf[dx] = 0;
                        }
                    }
                    dy++;
                } else {
                    for (dx = 0; dx < nw * ch; dx++) {
                        sum[dx] += buf[dx] * 256;
                        buf[dx] = 0;
                    }
                }
            }

            jsfeat.cache.put_buffer(sum_node);
            jsfeat.cache.put_buffer(buf_node);
            jsfeat.cache.put_buffer(xofs_node);
        };

        var _resample = function _resample(src, dst, nw, nh) {
            var xofs_count = 0;
            var ch = src.channel,
                w = src.cols,
                h = src.rows;
            var src_d = src.data,
                dst_d = dst.data;
            var scale_x = w / nw,
                scale_y = h / nh;
            var scale = 1.0 / (scale_x * scale_y);
            var dx = 0,
                dy = 0,
                sx = 0,
                sy = 0,
                sx1 = 0,
                sx2 = 0,
                i = 0,
                k = 0,
                fsx1 = 0.0,
                fsx2 = 0.0;
            var a = 0,
                b = 0,
                dxn = 0,
                alpha = 0.0,
                beta = 0.0,
                beta1 = 0.0;

            var buf_node = jsfeat.cache.get_buffer(nw * ch << 2);
            var sum_node = jsfeat.cache.get_buffer(nw * ch << 2);
            var xofs_node = jsfeat.cache.get_buffer(w * 2 * 3 << 2);

            var buf = buf_node.f32;
            var sum = sum_node.f32;
            var xofs = xofs_node.f32;

            for (; dx < nw; dx++) {
                fsx1 = dx * scale_x, fsx2 = fsx1 + scale_x;
                sx1 = fsx1 + 1.0 - 1e-6 | 0, sx2 = fsx2 | 0;
                sx1 = Math.min(sx1, w - 1);
                sx2 = Math.min(sx2, w - 1);

                if (sx1 > fsx1) {
                    xofs_count++;
                    xofs[k++] = (sx1 - 1) * ch | 0;
                    xofs[k++] = dx * ch | 0;
                    xofs[k++] = (sx1 - fsx1) * scale;
                }
                for (sx = sx1; sx < sx2; sx++) {
                    xofs_count++;
                    xofs[k++] = sx * ch | 0;
                    xofs[k++] = dx * ch | 0;
                    xofs[k++] = scale;
                }
                if (fsx2 - sx2 > 1e-3) {
                    xofs_count++;
                    xofs[k++] = sx2 * ch | 0;
                    xofs[k++] = dx * ch | 0;
                    xofs[k++] = (fsx2 - sx2) * scale;
                }
            }

            for (dx = 0; dx < nw * ch; dx++) {
                buf[dx] = sum[dx] = 0;
            }
            dy = 0;
            for (sy = 0; sy < h; sy++) {
                a = w * sy;
                for (k = 0; k < xofs_count; k++) {
                    sx1 = xofs[k * 3] | 0;
                    dxn = xofs[k * 3 + 1] | 0;
                    alpha = xofs[k * 3 + 2];
                    for (i = 0; i < ch; i++) {
                        buf[dxn + i] += src_d[a + sx1 + i] * alpha;
                    }
                }
                if ((dy + 1) * scale_y <= sy + 1 || sy == h - 1) {
                    beta = Math.max(sy + 1 - (dy + 1) * scale_y, 0.0);
                    beta1 = 1.0 - beta;
                    b = nw * dy;
                    if (Math.abs(beta) < 1e-3) {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b + dx] = sum[dx] + buf[dx];
                            sum[dx] = buf[dx] = 0;
                        }
                    } else {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b + dx] = sum[dx] + buf[dx] * beta1;
                            sum[dx] = buf[dx] * beta;
                            buf[dx] = 0;
                        }
                    }
                    dy++;
                } else {
                    for (dx = 0; dx < nw * ch; dx++) {
                        sum[dx] += buf[dx];
                        buf[dx] = 0;
                    }
                }
            }
            jsfeat.cache.put_buffer(sum_node);
            jsfeat.cache.put_buffer(buf_node);
            jsfeat.cache.put_buffer(xofs_node);
        };

        var _convol_u8 = function _convol_u8(buf, src_d, dst_d, w, h, filter, kernel_size, half_kernel) {
            var i = 0,
                j = 0,
                k = 0,
                sp = 0,
                dp = 0,
                sum = 0,
                sum1 = 0,
                sum2 = 0,
                sum3 = 0,
                f0 = filter[0],
                fk = 0;
            var w2 = w << 1,
                w3 = w * 3,
                w4 = w << 2;
            // hor pass
            for (; i < h; ++i) {
                sum = src_d[sp];
                for (j = 0; j < half_kernel; ++j) {
                    buf[j] = sum;
                }
                for (j = 0; j <= w - 2; j += 2) {
                    buf[j + half_kernel] = src_d[sp + j];
                    buf[j + half_kernel + 1] = src_d[sp + j + 1];
                }
                for (; j < w; ++j) {
                    buf[j + half_kernel] = src_d[sp + j];
                }
                sum = src_d[sp + w - 1];
                for (j = w; j < half_kernel + w; ++j) {
                    buf[j + half_kernel] = sum;
                }
                for (j = 0; j <= w - 4; j += 4) {
                    sum = buf[j] * f0, sum1 = buf[j + 1] * f0, sum2 = buf[j + 2] * f0, sum3 = buf[j + 3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j + 1] * fk;
                        sum2 += buf[k + j + 2] * fk;
                        sum3 += buf[k + j + 3] * fk;
                    }
                    dst_d[dp + j] = Math.min(sum >> 8, 255);
                    dst_d[dp + j + 1] = Math.min(sum1 >> 8, 255);
                    dst_d[dp + j + 2] = Math.min(sum2 >> 8, 255);
                    dst_d[dp + j + 3] = Math.min(sum3 >> 8, 255);
                }
                for (; j < w; ++j) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp + j] = Math.min(sum >> 8, 255);
                }
                sp += w;
                dp += w;
            }

            // vert pass
            for (i = 0; i < w; ++i) {
                sum = dst_d[i];
                for (j = 0; j < half_kernel; ++j) {
                    buf[j] = sum;
                }
                k = i;
                for (j = 0; j <= h - 2; j += 2, k += w2) {
                    buf[j + half_kernel] = dst_d[k];
                    buf[j + half_kernel + 1] = dst_d[k + w];
                }
                for (; j < h; ++j, k += w) {
                    buf[j + half_kernel] = dst_d[k];
                }
                sum = dst_d[(h - 1) * w + i];
                for (j = h; j < half_kernel + h; ++j) {
                    buf[j + half_kernel] = sum;
                }
                dp = i;
                for (j = 0; j <= h - 4; j += 4, dp += w4) {
                    sum = buf[j] * f0, sum1 = buf[j + 1] * f0, sum2 = buf[j + 2] * f0, sum3 = buf[j + 3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j + 1] * fk;
                        sum2 += buf[k + j + 2] * fk;
                        sum3 += buf[k + j + 3] * fk;
                    }
                    dst_d[dp] = Math.min(sum >> 8, 255);
                    dst_d[dp + w] = Math.min(sum1 >> 8, 255);
                    dst_d[dp + w2] = Math.min(sum2 >> 8, 255);
                    dst_d[dp + w3] = Math.min(sum3 >> 8, 255);
                }
                for (; j < h; ++j, dp += w) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp] = Math.min(sum >> 8, 255);
                }
            }
        };

        var _convol = function _convol(buf, src_d, dst_d, w, h, filter, kernel_size, half_kernel) {
            var i = 0,
                j = 0,
                k = 0,
                sp = 0,
                dp = 0,
                sum = 0.0,
                sum1 = 0.0,
                sum2 = 0.0,
                sum3 = 0.0,
                f0 = filter[0],
                fk = 0.0;
            var w2 = w << 1,
                w3 = w * 3,
                w4 = w << 2;
            // hor pass
            for (; i < h; ++i) {
                sum = src_d[sp];
                for (j = 0; j < half_kernel; ++j) {
                    buf[j] = sum;
                }
                for (j = 0; j <= w - 2; j += 2) {
                    buf[j + half_kernel] = src_d[sp + j];
                    buf[j + half_kernel + 1] = src_d[sp + j + 1];
                }
                for (; j < w; ++j) {
                    buf[j + half_kernel] = src_d[sp + j];
                }
                sum = src_d[sp + w - 1];
                for (j = w; j < half_kernel + w; ++j) {
                    buf[j + half_kernel] = sum;
                }
                for (j = 0; j <= w - 4; j += 4) {
                    sum = buf[j] * f0, sum1 = buf[j + 1] * f0, sum2 = buf[j + 2] * f0, sum3 = buf[j + 3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j + 1] * fk;
                        sum2 += buf[k + j + 2] * fk;
                        sum3 += buf[k + j + 3] * fk;
                    }
                    dst_d[dp + j] = sum;
                    dst_d[dp + j + 1] = sum1;
                    dst_d[dp + j + 2] = sum2;
                    dst_d[dp + j + 3] = sum3;
                }
                for (; j < w; ++j) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp + j] = sum;
                }
                sp += w;
                dp += w;
            }

            // vert pass
            for (i = 0; i < w; ++i) {
                sum = dst_d[i];
                for (j = 0; j < half_kernel; ++j) {
                    buf[j] = sum;
                }
                k = i;
                for (j = 0; j <= h - 2; j += 2, k += w2) {
                    buf[j + half_kernel] = dst_d[k];
                    buf[j + half_kernel + 1] = dst_d[k + w];
                }
                for (; j < h; ++j, k += w) {
                    buf[j + half_kernel] = dst_d[k];
                }
                sum = dst_d[(h - 1) * w + i];
                for (j = h; j < half_kernel + h; ++j) {
                    buf[j + half_kernel] = sum;
                }
                dp = i;
                for (j = 0; j <= h - 4; j += 4, dp += w4) {
                    sum = buf[j] * f0, sum1 = buf[j + 1] * f0, sum2 = buf[j + 2] * f0, sum3 = buf[j + 3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j + 1] * fk;
                        sum2 += buf[k + j + 2] * fk;
                        sum3 += buf[k + j + 3] * fk;
                    }
                    dst_d[dp] = sum;
                    dst_d[dp + w] = sum1;
                    dst_d[dp + w2] = sum2;
                    dst_d[dp + w3] = sum3;
                }
                for (; j < h; ++j, dp += w) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp] = sum;
                }
            }
        };

        return {
            // TODO: add support for RGB/BGR order
            // for raw arrays
            grayscale: function grayscale(src, w, h, dst, code) {
                // this is default image data representation in browser
                if (typeof code === "undefined") {
                    code = jsfeat.COLOR_RGBA2GRAY;
                }
                var x = 0,
                    y = 0,
                    i = 0,
                    j = 0,
                    ir = 0,
                    jr = 0;
                var coeff_r = 4899,
                    coeff_g = 9617,
                    coeff_b = 1868,
                    cn = 4;

                if (code == jsfeat.COLOR_BGRA2GRAY || code == jsfeat.COLOR_BGR2GRAY) {
                    coeff_r = 1868;
                    coeff_b = 4899;
                }
                if (code == jsfeat.COLOR_RGB2GRAY || code == jsfeat.COLOR_BGR2GRAY) {
                    cn = 3;
                }
                var cn2 = cn << 1,
                    cn3 = cn * 3 | 0;

                dst.resize(w, h, 1);
                var dst_u8 = dst.data;

                for (y = 0; y < h; ++y, j += w, i += w * cn) {
                    for (x = 0, ir = i, jr = j; x <= w - 4; x += 4, ir += cn << 2, jr += 4) {
                        dst_u8[jr] = src[ir] * coeff_r + src[ir + 1] * coeff_g + src[ir + 2] * coeff_b + 8192 >> 14;
                        dst_u8[jr + 1] = src[ir + cn] * coeff_r + src[ir + cn + 1] * coeff_g + src[ir + cn + 2] * coeff_b + 8192 >> 14;
                        dst_u8[jr + 2] = src[ir + cn2] * coeff_r + src[ir + cn2 + 1] * coeff_g + src[ir + cn2 + 2] * coeff_b + 8192 >> 14;
                        dst_u8[jr + 3] = src[ir + cn3] * coeff_r + src[ir + cn3 + 1] * coeff_g + src[ir + cn3 + 2] * coeff_b + 8192 >> 14;
                    }
                    for (; x < w; ++x, ++jr, ir += cn) {
                        dst_u8[jr] = src[ir] * coeff_r + src[ir + 1] * coeff_g + src[ir + 2] * coeff_b + 8192 >> 14;
                    }
                }
            },
            // derived from CCV library
            resample: function resample(src, dst, nw, nh) {
                var h = src.rows,
                    w = src.cols;
                if (h > nh && w > nw) {
                    dst.resize(nw, nh, src.channel);
                    // using the fast alternative (fix point scale, 0x100 to avoid overflow)
                    if (src.type & jsfeat.U8_t && dst.type & jsfeat.U8_t && h * w / (nh * nw) < 0x100) {
                        _resample_u8(src, dst, nw, nh);
                    } else {
                        _resample(src, dst, nw, nh);
                    }
                }
            },

            box_blur_gray: function box_blur_gray(src, dst, radius, options) {
                if (typeof options === "undefined") {
                    options = 0;
                }
                var w = src.cols,
                    h = src.rows,
                    h2 = h << 1,
                    w2 = w << 1;
                var i = 0,
                    x = 0,
                    y = 0,
                    end = 0;
                var windowSize = (radius << 1) + 1 | 0;
                var radiusPlusOne = radius + 1 | 0,
                    radiusPlus2 = radiusPlusOne + 1 | 0;
                var scale = options & jsfeat.BOX_BLUR_NOSCALE ? 1 : 1.0 / (windowSize * windowSize);

                var tmp_buff = jsfeat.cache.get_buffer(w * h << 2);

                var sum = 0,
                    dstIndex = 0,
                    srcIndex = 0,
                    nextPixelIndex = 0,
                    previousPixelIndex = 0;
                var data_i32 = tmp_buff.i32; // to prevent overflow
                var data_u8 = src.data;
                var hold = 0;

                dst.resize(w, h, src.channel);

                // first pass
                // no need to scale 
                //data_u8 = src.data;
                //data_i32 = tmp;
                for (y = 0; y < h; ++y) {
                    dstIndex = y;
                    sum = radiusPlusOne * data_u8[srcIndex];

                    for (i = srcIndex + 1 | 0, end = srcIndex + radius | 0; i <= end; ++i) {
                        sum += data_u8[i];
                    }

                    nextPixelIndex = srcIndex + radiusPlusOne | 0;
                    previousPixelIndex = srcIndex;
                    hold = data_u8[previousPixelIndex];
                    for (x = 0; x < radius; ++x, dstIndex += h) {
                        data_i32[dstIndex] = sum;
                        sum += data_u8[nextPixelIndex] - hold;
                        nextPixelIndex++;
                    }
                    for (; x < w - radiusPlus2; x += 2, dstIndex += h2) {
                        data_i32[dstIndex] = sum;
                        sum += data_u8[nextPixelIndex] - data_u8[previousPixelIndex];

                        data_i32[dstIndex + h] = sum;
                        sum += data_u8[nextPixelIndex + 1] - data_u8[previousPixelIndex + 1];

                        nextPixelIndex += 2;
                        previousPixelIndex += 2;
                    }
                    for (; x < w - radiusPlusOne; ++x, dstIndex += h) {
                        data_i32[dstIndex] = sum;
                        sum += data_u8[nextPixelIndex] - data_u8[previousPixelIndex];

                        nextPixelIndex++;
                        previousPixelIndex++;
                    }

                    hold = data_u8[nextPixelIndex - 1];
                    for (; x < w; ++x, dstIndex += h) {
                        data_i32[dstIndex] = sum;

                        sum += hold - data_u8[previousPixelIndex];
                        previousPixelIndex++;
                    }

                    srcIndex += w;
                }
                //
                // second pass
                srcIndex = 0;
                //data_i32 = tmp; // this is a transpose
                data_u8 = dst.data;

                // dont scale result
                if (scale == 1) {
                    for (y = 0; y < w; ++y) {
                        dstIndex = y;
                        sum = radiusPlusOne * data_i32[srcIndex];

                        for (i = srcIndex + 1 | 0, end = srcIndex + radius | 0; i <= end; ++i) {
                            sum += data_i32[i];
                        }

                        nextPixelIndex = srcIndex + radiusPlusOne;
                        previousPixelIndex = srcIndex;
                        hold = data_i32[previousPixelIndex];

                        for (x = 0; x < radius; ++x, dstIndex += w) {
                            data_u8[dstIndex] = sum;
                            sum += data_i32[nextPixelIndex] - hold;
                            nextPixelIndex++;
                        }
                        for (; x < h - radiusPlus2; x += 2, dstIndex += w2) {
                            data_u8[dstIndex] = sum;
                            sum += data_i32[nextPixelIndex] - data_i32[previousPixelIndex];

                            data_u8[dstIndex + w] = sum;
                            sum += data_i32[nextPixelIndex + 1] - data_i32[previousPixelIndex + 1];

                            nextPixelIndex += 2;
                            previousPixelIndex += 2;
                        }
                        for (; x < h - radiusPlusOne; ++x, dstIndex += w) {
                            data_u8[dstIndex] = sum;

                            sum += data_i32[nextPixelIndex] - data_i32[previousPixelIndex];
                            nextPixelIndex++;
                            previousPixelIndex++;
                        }
                        hold = data_i32[nextPixelIndex - 1];
                        for (; x < h; ++x, dstIndex += w) {
                            data_u8[dstIndex] = sum;

                            sum += hold - data_i32[previousPixelIndex];
                            previousPixelIndex++;
                        }

                        srcIndex += h;
                    }
                } else {
                    for (y = 0; y < w; ++y) {
                        dstIndex = y;
                        sum = radiusPlusOne * data_i32[srcIndex];

                        for (i = srcIndex + 1 | 0, end = srcIndex + radius | 0; i <= end; ++i) {
                            sum += data_i32[i];
                        }

                        nextPixelIndex = srcIndex + radiusPlusOne;
                        previousPixelIndex = srcIndex;
                        hold = data_i32[previousPixelIndex];

                        for (x = 0; x < radius; ++x, dstIndex += w) {
                            data_u8[dstIndex] = sum * scale;
                            sum += data_i32[nextPixelIndex] - hold;
                            nextPixelIndex++;
                        }
                        for (; x < h - radiusPlus2; x += 2, dstIndex += w2) {
                            data_u8[dstIndex] = sum * scale;
                            sum += data_i32[nextPixelIndex] - data_i32[previousPixelIndex];

                            data_u8[dstIndex + w] = sum * scale;
                            sum += data_i32[nextPixelIndex + 1] - data_i32[previousPixelIndex + 1];

                            nextPixelIndex += 2;
                            previousPixelIndex += 2;
                        }
                        for (; x < h - radiusPlusOne; ++x, dstIndex += w) {
                            data_u8[dstIndex] = sum * scale;

                            sum += data_i32[nextPixelIndex] - data_i32[previousPixelIndex];
                            nextPixelIndex++;
                            previousPixelIndex++;
                        }
                        hold = data_i32[nextPixelIndex - 1];
                        for (; x < h; ++x, dstIndex += w) {
                            data_u8[dstIndex] = sum * scale;

                            sum += hold - data_i32[previousPixelIndex];
                            previousPixelIndex++;
                        }

                        srcIndex += h;
                    }
                }

                jsfeat.cache.put_buffer(tmp_buff);
            },

            gaussian_blur: function gaussian_blur(src, dst, kernel_size, sigma) {
                if (typeof sigma === "undefined") {
                    sigma = 0.0;
                }
                if (typeof kernel_size === "undefined") {
                    kernel_size = 0;
                }
                kernel_size = kernel_size == 0 ? Math.max(1, 4.0 * sigma + 1.0 - 1e-8) * 2 + 1 | 0 : kernel_size;
                var half_kernel = kernel_size >> 1;
                var w = src.cols,
                    h = src.rows;
                var data_type = src.type,
                    is_u8 = data_type & jsfeat.U8_t;

                dst.resize(w, h, src.channel);

                var src_d = src.data,
                    dst_d = dst.data;
                var buf,
                    filter,
                    buf_sz = kernel_size + Math.max(h, w) | 0;

                var buf_node = jsfeat.cache.get_buffer(buf_sz << 2);
                var filt_node = jsfeat.cache.get_buffer(kernel_size << 2);

                if (is_u8) {
                    buf = buf_node.i32;
                    filter = filt_node.i32;
                } else if (data_type & jsfeat.S32_t) {
                    buf = buf_node.i32;
                    filter = filt_node.f32;
                } else {
                    buf = buf_node.f32;
                    filter = filt_node.f32;
                }

                jsfeat.math.get_gaussian_kernel(kernel_size, sigma, filter, data_type);

                if (is_u8) {
                    _convol_u8(buf, src_d, dst_d, w, h, filter, kernel_size, half_kernel);
                } else {
                    _convol(buf, src_d, dst_d, w, h, filter, kernel_size, half_kernel);
                }

                jsfeat.cache.put_buffer(buf_node);
                jsfeat.cache.put_buffer(filt_node);
            },
            // assume we always need it for u8 image
            pyrdown: function pyrdown(src, dst, sx, sy) {
                // this is needed for bbf
                if (typeof sx === "undefined") {
                    sx = 0;
                }
                if (typeof sy === "undefined") {
                    sy = 0;
                }

                var w = src.cols,
                    h = src.rows;
                var w2 = w >> 1,
                    h2 = h >> 1;
                var _w2 = w2 - (sx << 1),
                    _h2 = h2 - (sy << 1);
                var x = 0,
                    y = 0,
                    sptr = sx + sy * w,
                    sline = 0,
                    dptr = 0,
                    dline = 0;

                dst.resize(w2, h2, src.channel);

                var src_d = src.data,
                    dst_d = dst.data;

                for (y = 0; y < _h2; ++y) {
                    sline = sptr;
                    dline = dptr;
                    for (x = 0; x <= _w2 - 2; x += 2, dline += 2, sline += 4) {
                        dst_d[dline] = src_d[sline] + src_d[sline + 1] + src_d[sline + w] + src_d[sline + w + 1] + 2 >> 2;
                        dst_d[dline + 1] = src_d[sline + 2] + src_d[sline + 3] + src_d[sline + w + 2] + src_d[sline + w + 3] + 2 >> 2;
                    }
                    for (; x < _w2; ++x, ++dline, sline += 2) {
                        dst_d[dline] = src_d[sline] + src_d[sline + 1] + src_d[sline + w] + src_d[sline + w + 1] + 2 >> 2;
                    }
                    sptr += w << 1;
                    dptr += w2;
                }
            },

            // dst: [gx,gy,...]
            scharr_derivatives: function scharr_derivatives(src, dst) {
                var w = src.cols,
                    h = src.rows;
                var dstep = w << 1,
                    x = 0,
                    y = 0,
                    x1 = 0,
                    a,
                    b,
                    c,
                    d,
                    e,
                    f;
                var srow0 = 0,
                    srow1 = 0,
                    srow2 = 0,
                    drow = 0;
                var trow0, trow1;

                dst.resize(w, h, 2); // 2 channel output gx, gy

                var img = src.data,
                    gxgy = dst.data;

                var buf0_node = jsfeat.cache.get_buffer(w + 2 << 2);
                var buf1_node = jsfeat.cache.get_buffer(w + 2 << 2);

                if (src.type & jsfeat.U8_t || src.type & jsfeat.S32_t) {
                    trow0 = buf0_node.i32;
                    trow1 = buf1_node.i32;
                } else {
                    trow0 = buf0_node.f32;
                    trow1 = buf1_node.f32;
                }

                for (; y < h; ++y, srow1 += w) {
                    srow0 = (y > 0 ? y - 1 : 1) * w | 0;
                    srow2 = (y < h - 1 ? y + 1 : h - 2) * w | 0;
                    drow = y * dstep | 0;
                    // do vertical convolution
                    for (x = 0, x1 = 1; x <= w - 2; x += 2, x1 += 2) {
                        a = img[srow0 + x], b = img[srow2 + x];
                        trow0[x1] = (a + b) * 3 + img[srow1 + x] * 10;
                        trow1[x1] = b - a;
                        //
                        a = img[srow0 + x + 1], b = img[srow2 + x + 1];
                        trow0[x1 + 1] = (a + b) * 3 + img[srow1 + x + 1] * 10;
                        trow1[x1 + 1] = b - a;
                    }
                    for (; x < w; ++x, ++x1) {
                        a = img[srow0 + x], b = img[srow2 + x];
                        trow0[x1] = (a + b) * 3 + img[srow1 + x] * 10;
                        trow1[x1] = b - a;
                    }
                    // make border
                    x = w + 1 | 0;
                    trow0[0] = trow0[1];trow0[x] = trow0[w];
                    trow1[0] = trow1[1];trow1[x] = trow1[w];
                    // do horizontal convolution, interleave the results and store them
                    for (x = 0; x <= w - 4; x += 4) {
                        a = trow1[x + 2], b = trow1[x + 1], c = trow1[x + 3], d = trow1[x + 4], e = trow0[x + 2], f = trow0[x + 3];
                        gxgy[drow++] = e - trow0[x];
                        gxgy[drow++] = (a + trow1[x]) * 3 + b * 10;
                        gxgy[drow++] = f - trow0[x + 1];
                        gxgy[drow++] = (c + b) * 3 + a * 10;

                        gxgy[drow++] = trow0[x + 4] - e;
                        gxgy[drow++] = (d + a) * 3 + c * 10;
                        gxgy[drow++] = trow0[x + 5] - f;
                        gxgy[drow++] = (trow1[x + 5] + c) * 3 + d * 10;
                    }
                    for (; x < w; ++x) {
                        gxgy[drow++] = trow0[x + 2] - trow0[x];
                        gxgy[drow++] = (trow1[x + 2] + trow1[x]) * 3 + trow1[x + 1] * 10;
                    }
                }
                jsfeat.cache.put_buffer(buf0_node);
                jsfeat.cache.put_buffer(buf1_node);
            },

            // compute gradient using Sobel kernel [1 2 1] * [-1 0 1]^T
            // dst: [gx,gy,...]
            sobel_derivatives: function sobel_derivatives(src, dst) {
                var w = src.cols,
                    h = src.rows;
                var dstep = w << 1,
                    x = 0,
                    y = 0,
                    x1 = 0,
                    a,
                    b,
                    c,
                    d,
                    e,
                    f;
                var srow0 = 0,
                    srow1 = 0,
                    srow2 = 0,
                    drow = 0;
                var trow0, trow1;

                dst.resize(w, h, 2); // 2 channel output gx, gy

                var img = src.data,
                    gxgy = dst.data;

                var buf0_node = jsfeat.cache.get_buffer(w + 2 << 2);
                var buf1_node = jsfeat.cache.get_buffer(w + 2 << 2);

                if (src.type & jsfeat.U8_t || src.type & jsfeat.S32_t) {
                    trow0 = buf0_node.i32;
                    trow1 = buf1_node.i32;
                } else {
                    trow0 = buf0_node.f32;
                    trow1 = buf1_node.f32;
                }

                for (; y < h; ++y, srow1 += w) {
                    srow0 = (y > 0 ? y - 1 : 1) * w | 0;
                    srow2 = (y < h - 1 ? y + 1 : h - 2) * w | 0;
                    drow = y * dstep | 0;
                    // do vertical convolution
                    for (x = 0, x1 = 1; x <= w - 2; x += 2, x1 += 2) {
                        a = img[srow0 + x], b = img[srow2 + x];
                        trow0[x1] = a + b + img[srow1 + x] * 2;
                        trow1[x1] = b - a;
                        //
                        a = img[srow0 + x + 1], b = img[srow2 + x + 1];
                        trow0[x1 + 1] = a + b + img[srow1 + x + 1] * 2;
                        trow1[x1 + 1] = b - a;
                    }
                    for (; x < w; ++x, ++x1) {
                        a = img[srow0 + x], b = img[srow2 + x];
                        trow0[x1] = a + b + img[srow1 + x] * 2;
                        trow1[x1] = b - a;
                    }
                    // make border
                    x = w + 1 | 0;
                    trow0[0] = trow0[1];trow0[x] = trow0[w];
                    trow1[0] = trow1[1];trow1[x] = trow1[w];
                    // do horizontal convolution, interleave the results and store them
                    for (x = 0; x <= w - 4; x += 4) {
                        a = trow1[x + 2], b = trow1[x + 1], c = trow1[x + 3], d = trow1[x + 4], e = trow0[x + 2], f = trow0[x + 3];
                        gxgy[drow++] = e - trow0[x];
                        gxgy[drow++] = a + trow1[x] + b * 2;
                        gxgy[drow++] = f - trow0[x + 1];
                        gxgy[drow++] = c + b + a * 2;

                        gxgy[drow++] = trow0[x + 4] - e;
                        gxgy[drow++] = d + a + c * 2;
                        gxgy[drow++] = trow0[x + 5] - f;
                        gxgy[drow++] = trow1[x + 5] + c + d * 2;
                    }
                    for (; x < w; ++x) {
                        gxgy[drow++] = trow0[x + 2] - trow0[x];
                        gxgy[drow++] = trow1[x + 2] + trow1[x] + trow1[x + 1] * 2;
                    }
                }
                jsfeat.cache.put_buffer(buf0_node);
                jsfeat.cache.put_buffer(buf1_node);
            },

            // please note: 
            // dst_(type) size should be cols = src.cols+1, rows = src.rows+1
            compute_integral_image: function compute_integral_image(src, dst_sum, dst_sqsum, dst_tilted) {
                var w0 = src.cols | 0,
                    h0 = src.rows | 0,
                    src_d = src.data;
                var w1 = w0 + 1 | 0;
                var s = 0,
                    s2 = 0,
                    p = 0,
                    pup = 0,
                    i = 0,
                    j = 0,
                    v = 0,
                    k = 0;

                if (dst_sum && dst_sqsum) {
                    // fill first row with zeros
                    for (; i < w1; ++i) {
                        dst_sum[i] = 0, dst_sqsum[i] = 0;
                    }
                    p = w1 + 1 | 0, pup = 1;
                    for (i = 0, k = 0; i < h0; ++i, ++p, ++pup) {
                        s = s2 = 0;
                        for (j = 0; j <= w0 - 2; j += 2, k += 2, p += 2, pup += 2) {
                            v = src_d[k];
                            s += v, s2 += v * v;
                            dst_sum[p] = dst_sum[pup] + s;
                            dst_sqsum[p] = dst_sqsum[pup] + s2;

                            v = src_d[k + 1];
                            s += v, s2 += v * v;
                            dst_sum[p + 1] = dst_sum[pup + 1] + s;
                            dst_sqsum[p + 1] = dst_sqsum[pup + 1] + s2;
                        }
                        for (; j < w0; ++j, ++k, ++p, ++pup) {
                            v = src_d[k];
                            s += v, s2 += v * v;
                            dst_sum[p] = dst_sum[pup] + s;
                            dst_sqsum[p] = dst_sqsum[pup] + s2;
                        }
                    }
                } else if (dst_sum) {
                    // fill first row with zeros
                    for (; i < w1; ++i) {
                        dst_sum[i] = 0;
                    }
                    p = w1 + 1 | 0, pup = 1;
                    for (i = 0, k = 0; i < h0; ++i, ++p, ++pup) {
                        s = 0;
                        for (j = 0; j <= w0 - 2; j += 2, k += 2, p += 2, pup += 2) {
                            s += src_d[k];
                            dst_sum[p] = dst_sum[pup] + s;
                            s += src_d[k + 1];
                            dst_sum[p + 1] = dst_sum[pup + 1] + s;
                        }
                        for (; j < w0; ++j, ++k, ++p, ++pup) {
                            s += src_d[k];
                            dst_sum[p] = dst_sum[pup] + s;
                        }
                    }
                } else if (dst_sqsum) {
                    // fill first row with zeros
                    for (; i < w1; ++i) {
                        dst_sqsum[i] = 0;
                    }
                    p = w1 + 1 | 0, pup = 1;
                    for (i = 0, k = 0; i < h0; ++i, ++p, ++pup) {
                        s2 = 0;
                        for (j = 0; j <= w0 - 2; j += 2, k += 2, p += 2, pup += 2) {
                            v = src_d[k];
                            s2 += v * v;
                            dst_sqsum[p] = dst_sqsum[pup] + s2;
                            v = src_d[k + 1];
                            s2 += v * v;
                            dst_sqsum[p + 1] = dst_sqsum[pup + 1] + s2;
                        }
                        for (; j < w0; ++j, ++k, ++p, ++pup) {
                            v = src_d[k];
                            s2 += v * v;
                            dst_sqsum[p] = dst_sqsum[pup] + s2;
                        }
                    }
                }

                if (dst_tilted) {
                    // fill first row with zeros
                    for (i = 0; i < w1; ++i) {
                        dst_tilted[i] = 0;
                    }
                    // diagonal
                    p = w1 + 1 | 0, pup = 0;
                    for (i = 0, k = 0; i < h0; ++i, ++p, ++pup) {
                        for (j = 0; j <= w0 - 2; j += 2, k += 2, p += 2, pup += 2) {
                            dst_tilted[p] = src_d[k] + dst_tilted[pup];
                            dst_tilted[p + 1] = src_d[k + 1] + dst_tilted[pup + 1];
                        }
                        for (; j < w0; ++j, ++k, ++p, ++pup) {
                            dst_tilted[p] = src_d[k] + dst_tilted[pup];
                        }
                    }
                    // diagonal
                    p = w1 + w0 | 0, pup = w0;
                    for (i = 0; i < h0; ++i, p += w1, pup += w1) {
                        dst_tilted[p] += dst_tilted[pup];
                    }

                    for (j = w0 - 1; j > 0; --j) {
                        p = j + h0 * w1, pup = p - w1;
                        for (i = h0; i > 0; --i, p -= w1, pup -= w1) {
                            dst_tilted[p] += dst_tilted[pup] + dst_tilted[pup + 1];
                        }
                    }
                }
            },
            equalize_histogram: function equalize_histogram(src, dst) {
                var w = src.cols,
                    h = src.rows,
                    src_d = src.data;

                dst.resize(w, h, src.channel);

                var dst_d = dst.data,
                    size = w * h;
                var i = 0,
                    prev = 0,
                    hist0,
                    norm;

                var hist0_node = jsfeat.cache.get_buffer(256 << 2);
                hist0 = hist0_node.i32;
                for (; i < 256; ++i) {
                    hist0[i] = 0;
                }for (i = 0; i < size; ++i) {
                    ++hist0[src_d[i]];
                }

                prev = hist0[0];
                for (i = 1; i < 256; ++i) {
                    prev = hist0[i] += prev;
                }

                norm = 255 / size;
                for (i = 0; i < size; ++i) {
                    dst_d[i] = hist0[src_d[i]] * norm + 0.5 | 0;
                }
                jsfeat.cache.put_buffer(hist0_node);
            },

            canny: function canny(src, dst, low_thresh, high_thresh) {
                var w = src.cols,
                    h = src.rows,
                    src_d = src.data;

                dst.resize(w, h, src.channel);

                var dst_d = dst.data;
                var i = 0,
                    j = 0,
                    grad = 0,
                    w2 = w << 1,
                    _grad = 0,
                    suppress = 0,
                    f = 0,
                    x = 0,
                    y = 0,
                    s = 0;
                var tg22x = 0,
                    tg67x = 0;

                // cache buffers
                var dxdy_node = jsfeat.cache.get_buffer(h * w2 << 2);
                var buf_node = jsfeat.cache.get_buffer(3 * (w + 2) << 2);
                var map_node = jsfeat.cache.get_buffer((h + 2) * (w + 2) << 2);
                var stack_node = jsfeat.cache.get_buffer(h * w << 2);

                var buf = buf_node.i32;
                var map = map_node.i32;
                var stack = stack_node.i32;
                var dxdy = dxdy_node.i32;
                var dxdy_m = new jsfeat.matrix_t(w, h, jsfeat.S32C2_t, dxdy_node.data);
                var row0 = 1,
                    row1 = w + 2 + 1 | 0,
                    row2 = 2 * (w + 2) + 1 | 0,
                    map_w = w + 2 | 0,
                    map_i = map_w + 1 | 0,
                    stack_i = 0;

                this.sobel_derivatives(src, dxdy_m);

                if (low_thresh > high_thresh) {
                    i = low_thresh;
                    low_thresh = high_thresh;
                    high_thresh = i;
                }

                i = 3 * (w + 2) | 0;
                while (--i >= 0) {
                    buf[i] = 0;
                }

                i = (h + 2) * (w + 2) | 0;
                while (--i >= 0) {
                    map[i] = 0;
                }

                for (; j < w; ++j, grad += 2) {
                    //buf[row1+j] = Math.abs(dxdy[grad]) + Math.abs(dxdy[grad+1]);
                    x = dxdy[grad], y = dxdy[grad + 1];
                    //buf[row1+j] = x*x + y*y;
                    buf[row1 + j] = (x ^ x >> 31) - (x >> 31) + ((y ^ y >> 31) - (y >> 31));
                }

                for (i = 1; i <= h; ++i, grad += w2) {
                    if (i == h) {
                        j = row2 + w;
                        while (--j >= row2) {
                            buf[j] = 0;
                        }
                    } else {
                        for (j = 0; j < w; j++) {
                            //buf[row2+j] =  Math.abs(dxdy[grad+(j<<1)]) + Math.abs(dxdy[grad+(j<<1)+1]);
                            x = dxdy[grad + (j << 1)], y = dxdy[grad + (j << 1) + 1];
                            //buf[row2+j] = x*x + y*y;
                            buf[row2 + j] = (x ^ x >> 31) - (x >> 31) + ((y ^ y >> 31) - (y >> 31));
                        }
                    }
                    _grad = grad - w2 | 0;
                    map[map_i - 1] = 0;
                    suppress = 0;
                    for (j = 0; j < w; ++j, _grad += 2) {
                        f = buf[row1 + j];
                        if (f > low_thresh) {
                            x = dxdy[_grad];
                            y = dxdy[_grad + 1];
                            s = x ^ y;
                            // seems ot be faster than Math.abs
                            x = (x ^ x >> 31) - (x >> 31) | 0;
                            y = (y ^ y >> 31) - (y >> 31) | 0;
                            //x * tan(22.5) x * tan(67.5) == 2 * x + x * tan(22.5)
                            tg22x = x * 13573;
                            tg67x = tg22x + (x + x << 15);
                            y <<= 15;
                            if (y < tg22x) {
                                if (f > buf[row1 + j - 1] && f >= buf[row1 + j + 1]) {
                                    if (f > high_thresh && !suppress && map[map_i + j - map_w] != 2) {
                                        map[map_i + j] = 2;
                                        suppress = 1;
                                        stack[stack_i++] = map_i + j;
                                    } else {
                                        map[map_i + j] = 1;
                                    }
                                    continue;
                                }
                            } else if (y > tg67x) {
                                if (f > buf[row0 + j] && f >= buf[row2 + j]) {
                                    if (f > high_thresh && !suppress && map[map_i + j - map_w] != 2) {
                                        map[map_i + j] = 2;
                                        suppress = 1;
                                        stack[stack_i++] = map_i + j;
                                    } else {
                                        map[map_i + j] = 1;
                                    }
                                    continue;
                                }
                            } else {
                                s = s < 0 ? -1 : 1;
                                if (f > buf[row0 + j - s] && f > buf[row2 + j + s]) {
                                    if (f > high_thresh && !suppress && map[map_i + j - map_w] != 2) {
                                        map[map_i + j] = 2;
                                        suppress = 1;
                                        stack[stack_i++] = map_i + j;
                                    } else {
                                        map[map_i + j] = 1;
                                    }
                                    continue;
                                }
                            }
                        }
                        map[map_i + j] = 0;
                        suppress = 0;
                    }
                    map[map_i + w] = 0;
                    map_i += map_w;
                    j = row0;
                    row0 = row1;
                    row1 = row2;
                    row2 = j;
                }

                j = map_i - map_w - 1;
                for (i = 0; i < map_w; ++i, ++j) {
                    map[j] = 0;
                }
                // path following
                while (stack_i > 0) {
                    map_i = stack[--stack_i];
                    map_i -= map_w + 1;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i += 1;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i += 1;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i += map_w;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i -= 2;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i += map_w;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i += 1;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                    map_i += 1;
                    if (map[map_i] == 1) map[map_i] = 2, stack[stack_i++] = map_i;
                }

                map_i = map_w + 1;
                row0 = 0;
                for (i = 0; i < h; ++i, map_i += map_w) {
                    for (j = 0; j < w; ++j) {
                        dst_d[row0++] = (map[map_i + j] == 2) * 0xff;
                    }
                }

                // free buffers
                jsfeat.cache.put_buffer(dxdy_node);
                jsfeat.cache.put_buffer(buf_node);
                jsfeat.cache.put_buffer(map_node);
                jsfeat.cache.put_buffer(stack_node);
            },
            // transform is 3x3 matrix_t
            warp_perspective: function warp_perspective(src, dst, transform, fill_value) {
                if (typeof fill_value === "undefined") {
                    fill_value = 0;
                }
                var src_width = src.cols | 0,
                    src_height = src.rows | 0,
                    dst_width = dst.cols | 0,
                    dst_height = dst.rows | 0;
                var src_d = src.data,
                    dst_d = dst.data;
                var x = 0,
                    y = 0,
                    off = 0,
                    ixs = 0,
                    iys = 0,
                    xs = 0.0,
                    ys = 0.0,
                    xs0 = 0.0,
                    ys0 = 0.0,
                    ws = 0.0,
                    sc = 0.0,
                    a = 0.0,
                    b = 0.0,
                    p0 = 0.0,
                    p1 = 0.0;
                var td = transform.data;
                var m00 = td[0],
                    m01 = td[1],
                    m02 = td[2],
                    m10 = td[3],
                    m11 = td[4],
                    m12 = td[5],
                    m20 = td[6],
                    m21 = td[7],
                    m22 = td[8];

                for (var dptr = 0; y < dst_height; ++y) {
                    xs0 = m01 * y + m02, ys0 = m11 * y + m12, ws = m21 * y + m22;
                    for (x = 0; x < dst_width; ++x, ++dptr, xs0 += m00, ys0 += m10, ws += m20) {
                        sc = 1.0 / ws;
                        xs = xs0 * sc, ys = ys0 * sc;
                        ixs = xs | 0, iys = ys | 0;

                        if (xs > 0 && ys > 0 && ixs < src_width - 1 && iys < src_height - 1) {
                            a = Math.max(xs - ixs, 0.0);
                            b = Math.max(ys - iys, 0.0);
                            off = src_width * iys + ixs | 0;

                            p0 = src_d[off] + a * (src_d[off + 1] - src_d[off]);
                            p1 = src_d[off + src_width] + a * (src_d[off + src_width + 1] - src_d[off + src_width]);

                            dst_d[dptr] = p0 + b * (p1 - p0);
                        } else dst_d[dptr] = fill_value;
                    }
                }
            },
            // transform is 3x3 or 2x3 matrix_t only first 6 values referenced
            warp_affine: function warp_affine(src, dst, transform, fill_value) {
                if (typeof fill_value === "undefined") {
                    fill_value = 0;
                }
                var src_width = src.cols,
                    src_height = src.rows,
                    dst_width = dst.cols,
                    dst_height = dst.rows;
                var src_d = src.data,
                    dst_d = dst.data;
                var x = 0,
                    y = 0,
                    off = 0,
                    ixs = 0,
                    iys = 0,
                    xs = 0.0,
                    ys = 0.0,
                    a = 0.0,
                    b = 0.0,
                    p0 = 0.0,
                    p1 = 0.0;
                var td = transform.data;
                var m00 = td[0],
                    m01 = td[1],
                    m02 = td[2],
                    m10 = td[3],
                    m11 = td[4],
                    m12 = td[5];

                for (var dptr = 0; y < dst_height; ++y) {
                    xs = m01 * y + m02;
                    ys = m11 * y + m12;
                    for (x = 0; x < dst_width; ++x, ++dptr, xs += m00, ys += m10) {
                        ixs = xs | 0;iys = ys | 0;

                        if (ixs >= 0 && iys >= 0 && ixs < src_width - 1 && iys < src_height - 1) {
                            a = xs - ixs;
                            b = ys - iys;
                            off = src_width * iys + ixs;

                            p0 = src_d[off] + a * (src_d[off + 1] - src_d[off]);
                            p1 = src_d[off + src_width] + a * (src_d[off + src_width + 1] - src_d[off + src_width]);

                            dst_d[dptr] = p0 + b * (p1 - p0);
                        } else dst_d[dptr] = fill_value;
                    }
                }
            },

            // Basic RGB Skin detection filter
            // from http://popscan.blogspot.fr/2012/08/skin-detection-in-digital-images.html
            skindetector: function skindetector(src, dst) {
                var r, g, b, j;
                var i = src.width * src.height;
                while (i--) {
                    j = i * 4;
                    r = src.data[j];
                    g = src.data[j + 1];
                    b = src.data[j + 2];
                    if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 15 && Math.abs(r - g) > 15) {
                        dst[i] = 255;
                    } else {
                        dst[i] = 0;
                    }
                }
            }
        };
    }();

    global.imgproc = imgproc;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * This is FAST corner detector, contributed to OpenCV by the author, Edward Rosten.
 */

/*
The references are:
 * Machine learning for high-speed corner detection,
   E. Rosten and T. Drummond, ECCV 2006
 * Faster and better: A machine learning approach to corner detection
   E. Rosten, R. Porter and T. Drummond, PAMI, 2009  
*/

(function (global) {
    "use strict";
    //

    var fast_corners = function () {

        var offsets16 = new Int32Array([0, 3, 1, 3, 2, 2, 3, 1, 3, 0, 3, -1, 2, -2, 1, -3, 0, -3, -1, -3, -2, -2, -3, -1, -3, 0, -3, 1, -2, 2, -1, 3]);

        var threshold_tab = new Uint8Array(512);
        var pixel_off = new Int32Array(25);
        var score_diff = new Int32Array(25);

        // private functions
        var _cmp_offsets = function _cmp_offsets(pixel, step, pattern_size) {
            var k = 0;
            var offsets = offsets16;
            for (; k < pattern_size; ++k) {
                pixel[k] = offsets[k << 1] + offsets[(k << 1) + 1] * step;
            }
            for (; k < 25; ++k) {
                pixel[k] = pixel[k - pattern_size];
            }
        },
            _cmp_score_16 = function _cmp_score_16(src, off, pixel, d, threshold) {
            var N = 25,
                k = 0,
                v = src[off];
            var a0 = threshold,
                a = 0,
                b0 = 0,
                b = 0;

            for (; k < N; ++k) {
                d[k] = v - src[off + pixel[k]];
            }

            for (k = 0; k < 16; k += 2) {
                a = Math.min(d[k + 1], d[k + 2]);
                a = Math.min(a, d[k + 3]);

                if (a <= a0) continue;

                a = Math.min(a, d[k + 4]);
                a = Math.min(a, d[k + 5]);
                a = Math.min(a, d[k + 6]);
                a = Math.min(a, d[k + 7]);
                a = Math.min(a, d[k + 8]);
                a0 = Math.max(a0, Math.min(a, d[k]));
                a0 = Math.max(a0, Math.min(a, d[k + 9]));
            }

            b0 = -a0;
            for (k = 0; k < 16; k += 2) {
                b = Math.max(d[k + 1], d[k + 2]);
                b = Math.max(b, d[k + 3]);
                b = Math.max(b, d[k + 4]);
                b = Math.max(b, d[k + 5]);

                if (b >= b0) continue;
                b = Math.max(b, d[k + 6]);
                b = Math.max(b, d[k + 7]);
                b = Math.max(b, d[k + 8]);
                b0 = Math.min(b0, Math.max(b, d[k]));
                b0 = Math.min(b0, Math.max(b, d[k + 9]));
            }

            return -b0 - 1;
        };

        var _threshold = 20;

        return {
            set_threshold: function set_threshold(threshold) {
                _threshold = Math.min(Math.max(threshold, 0), 255);
                for (var i = -255; i <= 255; ++i) {
                    threshold_tab[i + 255] = i < -_threshold ? 1 : i > _threshold ? 2 : 0;
                }
                return _threshold;
            },

            detect: function detect(src, corners, border) {
                if (typeof border === "undefined") {
                    border = 3;
                }

                var K = 8,
                    N = 25;
                var img = src.data,
                    w = src.cols,
                    h = src.rows;
                var i = 0,
                    j = 0,
                    k = 0,
                    vt = 0,
                    x = 0,
                    m3 = 0;
                var buf_node = jsfeat.cache.get_buffer(3 * w);
                var cpbuf_node = jsfeat.cache.get_buffer((w + 1) * 3 << 2);
                var buf = buf_node.u8;
                var cpbuf = cpbuf_node.i32;
                var pixel = pixel_off;
                var sd = score_diff;
                var sy = Math.max(3, border);
                var ey = Math.min(h - 2, h - border);
                var sx = Math.max(3, border);
                var ex = Math.min(w - 3, w - border);
                var _count = 0,
                    corners_cnt = 0,
                    pt;
                var score_func = _cmp_score_16;
                var thresh_tab = threshold_tab;
                var threshold = _threshold;

                var v = 0,
                    tab = 0,
                    d = 0,
                    ncorners = 0,
                    cornerpos = 0,
                    curr = 0,
                    ptr = 0,
                    prev = 0,
                    pprev = 0;
                var jp1 = 0,
                    jm1 = 0,
                    score = 0;

                _cmp_offsets(pixel, w, 16);

                // local vars are faster?
                var pixel0 = pixel[0];
                var pixel1 = pixel[1];
                var pixel2 = pixel[2];
                var pixel3 = pixel[3];
                var pixel4 = pixel[4];
                var pixel5 = pixel[5];
                var pixel6 = pixel[6];
                var pixel7 = pixel[7];
                var pixel8 = pixel[8];
                var pixel9 = pixel[9];
                var pixel10 = pixel[10];
                var pixel11 = pixel[11];
                var pixel12 = pixel[12];
                var pixel13 = pixel[13];
                var pixel14 = pixel[14];
                var pixel15 = pixel[15];

                for (i = 0; i < w * 3; ++i) {
                    buf[i] = 0;
                }

                for (i = sy; i < ey; ++i) {
                    ptr = i * w + sx | 0;
                    m3 = (i - 3) % 3;
                    curr = m3 * w | 0;
                    cornerpos = m3 * (w + 1) | 0;
                    for (j = 0; j < w; ++j) {
                        buf[curr + j] = 0;
                    }ncorners = 0;

                    if (i < ey - 1) {
                        j = sx;

                        for (; j < ex; ++j, ++ptr) {
                            v = img[ptr];
                            tab = -v + 255;
                            d = thresh_tab[tab + img[ptr + pixel0]] | thresh_tab[tab + img[ptr + pixel8]];

                            if (d == 0) {
                                continue;
                            }

                            d &= thresh_tab[tab + img[ptr + pixel2]] | thresh_tab[tab + img[ptr + pixel10]];
                            d &= thresh_tab[tab + img[ptr + pixel4]] | thresh_tab[tab + img[ptr + pixel12]];
                            d &= thresh_tab[tab + img[ptr + pixel6]] | thresh_tab[tab + img[ptr + pixel14]];

                            if (d == 0) {
                                continue;
                            }

                            d &= thresh_tab[tab + img[ptr + pixel1]] | thresh_tab[tab + img[ptr + pixel9]];
                            d &= thresh_tab[tab + img[ptr + pixel3]] | thresh_tab[tab + img[ptr + pixel11]];
                            d &= thresh_tab[tab + img[ptr + pixel5]] | thresh_tab[tab + img[ptr + pixel13]];
                            d &= thresh_tab[tab + img[ptr + pixel7]] | thresh_tab[tab + img[ptr + pixel15]];

                            if (d & 1) {
                                vt = v - threshold;
                                _count = 0;

                                for (k = 0; k < N; ++k) {
                                    x = img[ptr + pixel[k]];
                                    if (x < vt) {
                                        ++_count;
                                        if (_count > K) {
                                            ++ncorners;
                                            cpbuf[cornerpos + ncorners] = j;
                                            buf[curr + j] = score_func(img, ptr, pixel, sd, threshold);
                                            break;
                                        }
                                    } else {
                                        _count = 0;
                                    }
                                }
                            }

                            if (d & 2) {
                                vt = v + threshold;
                                _count = 0;

                                for (k = 0; k < N; ++k) {
                                    x = img[ptr + pixel[k]];
                                    if (x > vt) {
                                        ++_count;
                                        if (_count > K) {
                                            ++ncorners;
                                            cpbuf[cornerpos + ncorners] = j;
                                            buf[curr + j] = score_func(img, ptr, pixel, sd, threshold);
                                            break;
                                        }
                                    } else {
                                        _count = 0;
                                    }
                                }
                            }
                        }
                    }

                    cpbuf[cornerpos + w] = ncorners;

                    if (i == sy) {
                        continue;
                    }

                    m3 = (i - 4 + 3) % 3;
                    prev = m3 * w | 0;
                    cornerpos = m3 * (w + 1) | 0;
                    m3 = (i - 5 + 3) % 3;
                    pprev = m3 * w | 0;

                    ncorners = cpbuf[cornerpos + w];

                    for (k = 0; k < ncorners; ++k) {
                        j = cpbuf[cornerpos + k];
                        jp1 = j + 1 | 0;
                        jm1 = j - 1 | 0;
                        score = buf[prev + j];
                        if (score > buf[prev + jp1] && score > buf[prev + jm1] && score > buf[pprev + jm1] && score > buf[pprev + j] && score > buf[pprev + jp1] && score > buf[curr + jm1] && score > buf[curr + j] && score > buf[curr + jp1]) {
                            // save corner
                            pt = corners[corners_cnt];
                            pt.x = j, pt.y = i - 1, pt.score = score;
                            corners_cnt++;
                        }
                    }
                } // y loop
                jsfeat.cache.put_buffer(buf_node);
                jsfeat.cache.put_buffer(cpbuf_node);
                return corners_cnt;
            }
        };
    }();

    global.fast_corners = fast_corners;
    fast_corners.set_threshold(20); // set default
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * Copyright 2007 Computer Vision Lab,
 * Ecole Polytechnique Federale de Lausanne (EPFL), Switzerland.
 * @author Vincent Lepetit (http://cvlab.epfl.ch/~lepetit)
 */

(function (global) {
    "use strict";
    //

    var yape06 = function () {

        var compute_laplacian = function compute_laplacian(src, dst, w, h, Dxx, Dyy, sx, sy, ex, ey) {
            var y = 0,
                x = 0,
                yrow = sy * w + sx | 0,
                row = yrow;

            for (y = sy; y < ey; ++y, yrow += w, row = yrow) {
                for (x = sx; x < ex; ++x, ++row) {
                    dst[row] = -4 * src[row] + src[row + Dxx] + src[row - Dxx] + src[row + Dyy] + src[row - Dyy];
                }
            }
        };

        var hessian_min_eigen_value = function hessian_min_eigen_value(src, off, tr, Dxx, Dyy, Dxy, Dyx) {
            var Ixx = -2 * src[off] + src[off + Dxx] + src[off - Dxx];
            var Iyy = -2 * src[off] + src[off + Dyy] + src[off - Dyy];
            var Ixy = src[off + Dxy] + src[off - Dxy] - src[off + Dyx] - src[off - Dyx];
            var sqrt_delta = Math.sqrt((Ixx - Iyy) * (Ixx - Iyy) + 4 * Ixy * Ixy) | 0;

            return Math.min(Math.abs(tr - sqrt_delta), Math.abs(-(tr + sqrt_delta)));
        };

        return {

            laplacian_threshold: 30,
            min_eigen_value_threshold: 25,

            detect: function detect(src, points, border) {
                if (typeof border === "undefined") {
                    border = 5;
                }
                var x = 0,
                    y = 0;
                var w = src.cols,
                    h = src.rows,
                    srd_d = src.data;
                var Dxx = 5,
                    Dyy = 5 * w | 0;
                var Dxy = 3 + 3 * w | 0,
                    Dyx = 3 - 3 * w | 0;
                var lap_buf = jsfeat.cache.get_buffer(w * h << 2);
                var laplacian = lap_buf.i32;
                var lv = 0,
                    row = 0,
                    rowx = 0,
                    min_eigen_value = 0,
                    pt;
                var number_of_points = 0;
                var lap_thresh = this.laplacian_threshold;
                var eigen_thresh = this.min_eigen_value_threshold;

                var sx = Math.max(5, border) | 0;
                var sy = Math.max(3, border) | 0;
                var ex = Math.min(w - 5, w - border) | 0;
                var ey = Math.min(h - 3, h - border) | 0;

                x = w * h;
                while (--x >= 0) {
                    laplacian[x] = 0;
                }
                compute_laplacian(srd_d, laplacian, w, h, Dxx, Dyy, sx, sy, ex, ey);

                row = sy * w + sx | 0;
                for (y = sy; y < ey; ++y, row += w) {
                    for (x = sx, rowx = row; x < ex; ++x, ++rowx) {

                        lv = laplacian[rowx];
                        if (lv < -lap_thresh && lv < laplacian[rowx - 1] && lv < laplacian[rowx + 1] && lv < laplacian[rowx - w] && lv < laplacian[rowx + w] && lv < laplacian[rowx - w - 1] && lv < laplacian[rowx + w - 1] && lv < laplacian[rowx - w + 1] && lv < laplacian[rowx + w + 1] || lv > lap_thresh && lv > laplacian[rowx - 1] && lv > laplacian[rowx + 1] && lv > laplacian[rowx - w] && lv > laplacian[rowx + w] && lv > laplacian[rowx - w - 1] && lv > laplacian[rowx + w - 1] && lv > laplacian[rowx - w + 1] && lv > laplacian[rowx + w + 1]) {

                            min_eigen_value = hessian_min_eigen_value(srd_d, rowx, lv, Dxx, Dyy, Dxy, Dyx);
                            if (min_eigen_value > eigen_thresh) {
                                pt = points[number_of_points];
                                pt.x = x, pt.y = y, pt.score = min_eigen_value;
                                ++number_of_points;
                                ++x, ++rowx; // skip next pixel since this is maxima in 3x3
                            }
                        }
                    }
                }

                jsfeat.cache.put_buffer(lap_buf);

                return number_of_points;
            }

        };
    }();

    global.yape06 = yape06;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * Copyright 2007 Computer Vision Lab,
 * Ecole Polytechnique Federale de Lausanne (EPFL), Switzerland.
 */

(function (global) {
    "use strict";
    //

    var yape = function () {

        var precompute_directions = function precompute_directions(step, dirs, R) {
            var i = 0;
            var x, y;

            x = R;
            for (y = 0; y < x; y++, i++) {
                x = Math.sqrt(R * R - y * y) + 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (x--; x < y && x >= 0; x--, i++) {
                y = Math.sqrt(R * R - x * x) + 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (; -x < y; x--, i++) {
                y = Math.sqrt(R * R - x * x) + 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (y--; y >= 0; y--, i++) {
                x = -Math.sqrt(R * R - y * y) - 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (; y > x; y--, i++) {
                x = -Math.sqrt(R * R - y * y) - 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (x++; x <= 0; x++, i++) {
                y = -Math.sqrt(R * R - x * x) - 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (; x < -y; x++, i++) {
                y = -Math.sqrt(R * R - x * x) - 0.5 | 0;
                dirs[i] = x + step * y;
            }
            for (y++; y < 0; y++, i++) {
                x = Math.sqrt(R * R - y * y) + 0.5 | 0;
                dirs[i] = x + step * y;
            }

            dirs[i] = dirs[0];
            dirs[i + 1] = dirs[1];
            return i;
        };

        var third_check = function third_check(Sb, off, step) {
            var n = 0;
            if (Sb[off + 1] != 0) n++;
            if (Sb[off - 1] != 0) n++;
            if (Sb[off + step] != 0) n++;
            if (Sb[off + step + 1] != 0) n++;
            if (Sb[off + step - 1] != 0) n++;
            if (Sb[off - step] != 0) n++;
            if (Sb[off - step + 1] != 0) n++;
            if (Sb[off - step - 1] != 0) n++;

            return n;
        };

        var is_local_maxima = function is_local_maxima(p, off, v, step, neighborhood) {
            var x, y;

            if (v > 0) {
                off -= step * neighborhood;
                for (y = -neighborhood; y <= neighborhood; ++y) {
                    for (x = -neighborhood; x <= neighborhood; ++x) {
                        if (p[off + x] > v) return false;
                    }
                    off += step;
                }
            } else {
                off -= step * neighborhood;
                for (y = -neighborhood; y <= neighborhood; ++y) {
                    for (x = -neighborhood; x <= neighborhood; ++x) {
                        if (p[off + x] < v) return false;
                    }
                    off += step;
                }
            }
            return true;
        };

        var perform_one_point = function perform_one_point(I, x, Scores, Im, Ip, dirs, opposite, dirs_nb) {
            var score = 0;
            var a = 0,
                b = opposite - 1 | 0;
            var A = 0,
                B0 = 0,
                B1 = 0,
                B2 = 0;
            var state = 0;

            // WE KNOW THAT NOT(A ~ I0 & B1 ~ I0):
            A = I[x + dirs[a]];
            if (A <= Ip) {
                if (A >= Im) {
                    // A ~ I0
                    B0 = I[x + dirs[b]];
                    if (B0 <= Ip) {
                        if (B0 >= Im) {
                            Scores[x] = 0;return;
                        } else {
                            b++;B1 = I[x + dirs[b]];
                            if (B1 > Ip) {
                                b++;B2 = I[x + dirs[b]];
                                if (B2 > Ip) state = 3;else if (B2 < Im) state = 6;else {
                                    Scores[x] = 0;return;
                                } // A ~ I0, B2 ~ I0
                            } else /* if ((B1 < Im))*/{
                                    b++;B2 = I[x + dirs[b]];
                                    if (B2 > Ip) state = 7;else if (B2 < Im) state = 2;else {
                                        Scores[x] = 0;return;
                                    } // A ~ I0, B2 ~ I0
                                }
                            //else { Scores[x] = 0; return; } // A ~ I0, B1 ~ I0
                        }
                    } else {
                        // B0 < I0
                        b++;B1 = I[x + dirs[b]];
                        if (B1 > Ip) {
                            b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) state = 3;else if (B2 < Im) state = 6;else {
                                Scores[x] = 0;return;
                            } // A ~ I0, B2 ~ I0
                        } else if (B1 < Im) {
                            b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) state = 7;else if (B2 < Im) state = 2;else {
                                Scores[x] = 0;return;
                            } // A ~ I0, B2 ~ I0
                        } else {
                            Scores[x] = 0;return;
                        } // A ~ I0, B1 ~ I0
                    }
                } else {
                    // A > I0
                    B0 = I[x + dirs[b]];
                    if (B0 > Ip) {
                        Scores[x] = 0;return;
                    }
                    b++;B1 = I[x + dirs[b]];
                    if (B1 > Ip) {
                        Scores[x] = 0;return;
                    }
                    b++;B2 = I[x + dirs[b]];
                    if (B2 > Ip) {
                        Scores[x] = 0;return;
                    }
                    state = 1;
                }
            } else // A < I0
                {
                    B0 = I[x + dirs[b]];
                    if (B0 < Im) {
                        Scores[x] = 0;return;
                    }
                    b++;B1 = I[x + dirs[b]];
                    if (B1 < Im) {
                        Scores[x] = 0;return;
                    }
                    b++;B2 = I[x + dirs[b]];
                    if (B2 < Im) {
                        Scores[x] = 0;return;
                    }
                    state = 0;
                }

            for (a = 1; a <= opposite; a++) {
                A = I[x + dirs[a]];

                switch (state) {
                    case 0:
                        if (A > Ip) {
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 0;break;
                            };
                        }
                        if (A < Im) {
                            if (B1 > Ip) {
                                Scores[x] = 0;return;
                            }
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 8;break;
                            };
                        }
                        // A ~ I0
                        if (B1 <= Ip) {
                            Scores[x] = 0;return;
                        }
                        if (B2 <= Ip) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        if (B2 > Ip) {
                            score -= A + B1;state = 3;break;
                        };
                        if (B2 < Im) {
                            score -= A + B1;state = 6;break;
                        };
                        {
                            Scores[x] = 0;return;
                        }

                    case 1:
                        if (A < Im) {
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 1;break;
                            };
                        }
                        if (A > Ip) {
                            if (B1 < Im) {
                                Scores[x] = 0;return;
                            }
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 9;break;
                            };
                        }
                        // A ~ I0
                        if (B1 >= Im) {
                            Scores[x] = 0;return;
                        }
                        if (B2 >= Im) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        if (B2 < Im) {
                            score -= A + B1;state = 2;break;
                        };
                        if (B2 > Ip) {
                            score -= A + B1;state = 7;break;
                        };
                        {
                            Scores[x] = 0;return;
                        }

                    case 2:
                        if (A > Ip) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        if (A < Im) {
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 4;break;
                            };
                        }
                        // A ~ I0
                        if (B2 > Ip) {
                            score -= A + B1;state = 7;break;
                        };
                        if (B2 < Im) {
                            score -= A + B1;state = 2;break;
                        };
                        {
                            Scores[x] = 0;return;
                        } // A ~ I0, B2 ~ I0

                    case 3:
                        if (A < Im) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        if (A > Ip) {
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 5;break;
                            };
                        }
                        // A ~ I0
                        if (B2 > Ip) {
                            score -= A + B1;state = 3;break;
                        };
                        if (B2 < Im) {
                            score -= A + B1;state = 6;break;
                        };
                        {
                            Scores[x] = 0;return;
                        }

                    case 4:
                        if (A > Ip) {
                            Scores[x] = 0;return;
                        }
                        if (A < Im) {
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 1;break;
                            };
                        }
                        if (B2 >= Im) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        if (B2 < Im) {
                            score -= A + B1;state = 2;break;
                        };
                        if (B2 > Ip) {
                            score -= A + B1;state = 7;break;
                        };
                        {
                            Scores[x] = 0;return;
                        }

                    case 5:
                        if (A < Im) {
                            Scores[x] = 0;return;
                        }
                        if (A > Ip) {
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 0;break;
                            };
                        }
                        // A ~ I0
                        if (B2 <= Ip) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        if (B2 > Ip) {
                            score -= A + B1;state = 3;break;
                        };
                        if (B2 < Im) {
                            score -= A + B1;state = 6;break;
                        };
                        {
                            Scores[x] = 0;return;
                        }

                    case 7:
                        if (A > Ip) {
                            Scores[x] = 0;return;
                        }
                        if (A < Im) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        // A ~ I0
                        if (B2 > Ip) {
                            score -= A + B1;state = 3;break;
                        };
                        if (B2 < Im) {
                            score -= A + B1;state = 6;break;
                        };
                        {
                            Scores[x] = 0;return;
                        } // A ~ I0, B2 ~ I0

                    case 6:
                        if (A > Ip) {
                            Scores[x] = 0;return;
                        }
                        if (A < Im) {
                            Scores[x] = 0;return;
                        }
                        B1 = B2;b++;B2 = I[x + dirs[b]];
                        // A ~ I0
                        if (B2 < Im) {
                            score -= A + B1;state = 2;break;
                        };
                        if (B2 > Ip) {
                            score -= A + B1;state = 7;break;
                        };
                        {
                            Scores[x] = 0;return;
                        } // A ~ I0, B2 ~ I0

                    case 8:
                        if (A > Ip) {
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 9;break;
                            };
                        }
                        if (A < Im) {
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 1;break;
                            };
                        }
                        {
                            Scores[x] = 0;return;
                        }

                    case 9:
                        if (A < Im) {
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 > Ip) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 8;break;
                            };
                        }
                        if (A > Ip) {
                            B1 = B2;b++;B2 = I[x + dirs[b]];
                            if (B2 < Im) {
                                Scores[x] = 0;return;
                            }
                            {
                                score -= A + B1;state = 0;break;
                            };
                        }
                        {
                            Scores[x] = 0;return;
                        }

                    default:
                        //"PB default";
                        break;
                } // switch(state)
            } // for(a...)

            Scores[x] = score + dirs_nb * I[x];
        };

        var lev_table_t = function () {
            function lev_table_t(w, h, r) {
                this.dirs = new Int32Array(1024);
                this.dirs_count = precompute_directions(w, this.dirs, r) | 0;
                this.scores = new Int32Array(w * h);
                this.radius = r | 0;
            }
            return lev_table_t;
        }();

        return {

            level_tables: [],
            tau: 7,

            init: function init(width, height, radius, pyramid_levels) {
                if (typeof pyramid_levels === "undefined") {
                    pyramid_levels = 1;
                }
                var i;
                radius = Math.min(radius, 7);
                radius = Math.max(radius, 3);
                for (i = 0; i < pyramid_levels; ++i) {
                    this.level_tables[i] = new lev_table_t(width >> i, height >> i, radius);
                }
            },

            detect: function detect(src, points, border) {
                if (typeof border === "undefined") {
                    border = 4;
                }
                var t = this.level_tables[0];
                var R = t.radius | 0,
                    Rm1 = R - 1 | 0;
                var dirs = t.dirs;
                var dirs_count = t.dirs_count | 0;
                var opposite = dirs_count >> 1;
                var img = src.data,
                    w = src.cols | 0,
                    h = src.rows | 0,
                    hw = w >> 1;
                var scores = t.scores;
                var x = 0,
                    y = 0,
                    row = 0,
                    rowx = 0,
                    ip = 0,
                    im = 0,
                    abs_score = 0,
                    score = 0;
                var tau = this.tau | 0;
                var number_of_points = 0,
                    pt;

                var sx = Math.max(R + 1, border) | 0;
                var sy = Math.max(R + 1, border) | 0;
                var ex = Math.min(w - R - 2, w - border) | 0;
                var ey = Math.min(h - R - 2, h - border) | 0;

                row = sy * w + sx | 0;
                for (y = sy; y < ey; ++y, row += w) {
                    for (x = sx, rowx = row; x < ex; ++x, ++rowx) {
                        ip = img[rowx] + tau, im = img[rowx] - tau;

                        if (im < img[rowx + R] && img[rowx + R] < ip && im < img[rowx - R] && img[rowx - R] < ip) {
                            scores[rowx] = 0;
                        } else {
                            perform_one_point(img, rowx, scores, im, ip, dirs, opposite, dirs_count);
                        }
                    }
                }

                // local maxima
                row = sy * w + sx | 0;
                for (y = sy; y < ey; ++y, row += w) {
                    for (x = sx, rowx = row; x < ex; ++x, ++rowx) {
                        score = scores[rowx];
                        abs_score = Math.abs(score);
                        if (abs_score < 5) {
                            // if this pixel is 0, the next one will not be good enough. Skip it.
                            ++x, ++rowx;
                        } else {
                            if (third_check(scores, rowx, w) >= 3 && is_local_maxima(scores, rowx, score, hw, R)) {
                                pt = points[number_of_points];
                                pt.x = x, pt.y = y, pt.score = abs_score;
                                ++number_of_points;

                                x += Rm1, rowx += Rm1;
                            }
                        }
                    }
                }

                return number_of_points;
            }
        };
    }();

    global.yape = yape;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * Original implementation derived from OpenCV,
 * @authors Ethan Rublee, Vincent Rabaud, Gary Bradski
 */

(function (global) {
    "use strict";
    //

    var orb = function () {

        var bit_pattern_31_ = new Int32Array([8, -3, 9, 5 /*mean (0), correlation (0)*/
        , 4, 2, 7, -12 /*mean (1.12461e-05), correlation (0.0437584)*/
        , -11, 9, -8, 2 /*mean (3.37382e-05), correlation (0.0617409)*/
        , 7, -12, 12, -13 /*mean (5.62303e-05), correlation (0.0636977)*/
        , 2, -13, 2, 12 /*mean (0.000134953), correlation (0.085099)*/
        , 1, -7, 1, 6 /*mean (0.000528565), correlation (0.0857175)*/
        , -2, -10, -2, -4 /*mean (0.0188821), correlation (0.0985774)*/
        , -13, -13, -11, -8 /*mean (0.0363135), correlation (0.0899616)*/
        , -13, -3, -12, -9 /*mean (0.121806), correlation (0.099849)*/
        , 10, 4, 11, 9 /*mean (0.122065), correlation (0.093285)*/
        , -13, -8, -8, -9 /*mean (0.162787), correlation (0.0942748)*/
        , -11, 7, -9, 12 /*mean (0.21561), correlation (0.0974438)*/
        , 7, 7, 12, 6 /*mean (0.160583), correlation (0.130064)*/
        , -4, -5, -3, 0 /*mean (0.228171), correlation (0.132998)*/
        , -13, 2, -12, -3 /*mean (0.00997526), correlation (0.145926)*/
        , -9, 0, -7, 5 /*mean (0.198234), correlation (0.143636)*/
        , 12, -6, 12, -1 /*mean (0.0676226), correlation (0.16689)*/
        , -3, 6, -2, 12 /*mean (0.166847), correlation (0.171682)*/
        , -6, -13, -4, -8 /*mean (0.101215), correlation (0.179716)*/
        , 11, -13, 12, -8 /*mean (0.200641), correlation (0.192279)*/
        , 4, 7, 5, 1 /*mean (0.205106), correlation (0.186848)*/
        , 5, -3, 10, -3 /*mean (0.234908), correlation (0.192319)*/
        , 3, -7, 6, 12 /*mean (0.0709964), correlation (0.210872)*/
        , -8, -7, -6, -2 /*mean (0.0939834), correlation (0.212589)*/
        , -2, 11, -1, -10 /*mean (0.127778), correlation (0.20866)*/
        , -13, 12, -8, 10 /*mean (0.14783), correlation (0.206356)*/
        , -7, 3, -5, -3 /*mean (0.182141), correlation (0.198942)*/
        , -4, 2, -3, 7 /*mean (0.188237), correlation (0.21384)*/
        , -10, -12, -6, 11 /*mean (0.14865), correlation (0.23571)*/
        , 5, -12, 6, -7 /*mean (0.222312), correlation (0.23324)*/
        , 5, -6, 7, -1 /*mean (0.229082), correlation (0.23389)*/
        , 1, 0, 4, -5 /*mean (0.241577), correlation (0.215286)*/
        , 9, 11, 11, -13 /*mean (0.00338507), correlation (0.251373)*/
        , 4, 7, 4, 12 /*mean (0.131005), correlation (0.257622)*/
        , 2, -1, 4, 4 /*mean (0.152755), correlation (0.255205)*/
        , -4, -12, -2, 7 /*mean (0.182771), correlation (0.244867)*/
        , -8, -5, -7, -10 /*mean (0.186898), correlation (0.23901)*/
        , 4, 11, 9, 12 /*mean (0.226226), correlation (0.258255)*/
        , 0, -8, 1, -13 /*mean (0.0897886), correlation (0.274827)*/
        , -13, -2, -8, 2 /*mean (0.148774), correlation (0.28065)*/
        , -3, -2, -2, 3 /*mean (0.153048), correlation (0.283063)*/
        , -6, 9, -4, -9 /*mean (0.169523), correlation (0.278248)*/
        , 8, 12, 10, 7 /*mean (0.225337), correlation (0.282851)*/
        , 0, 9, 1, 3 /*mean (0.226687), correlation (0.278734)*/
        , 7, -5, 11, -10 /*mean (0.00693882), correlation (0.305161)*/
        , -13, -6, -11, 0 /*mean (0.0227283), correlation (0.300181)*/
        , 10, 7, 12, 1 /*mean (0.125517), correlation (0.31089)*/
        , -6, -3, -6, 12 /*mean (0.131748), correlation (0.312779)*/
        , 10, -9, 12, -4 /*mean (0.144827), correlation (0.292797)*/
        , -13, 8, -8, -12 /*mean (0.149202), correlation (0.308918)*/
        , -13, 0, -8, -4 /*mean (0.160909), correlation (0.310013)*/
        , 3, 3, 7, 8 /*mean (0.177755), correlation (0.309394)*/
        , 5, 7, 10, -7 /*mean (0.212337), correlation (0.310315)*/
        , -1, 7, 1, -12 /*mean (0.214429), correlation (0.311933)*/
        , 3, -10, 5, 6 /*mean (0.235807), correlation (0.313104)*/
        , 2, -4, 3, -10 /*mean (0.00494827), correlation (0.344948)*/
        , -13, 0, -13, 5 /*mean (0.0549145), correlation (0.344675)*/
        , -13, -7, -12, 12 /*mean (0.103385), correlation (0.342715)*/
        , -13, 3, -11, 8 /*mean (0.134222), correlation (0.322922)*/
        , -7, 12, -4, 7 /*mean (0.153284), correlation (0.337061)*/
        , 6, -10, 12, 8 /*mean (0.154881), correlation (0.329257)*/
        , -9, -1, -7, -6 /*mean (0.200967), correlation (0.33312)*/
        , -2, -5, 0, 12 /*mean (0.201518), correlation (0.340635)*/
        , -12, 5, -7, 5 /*mean (0.207805), correlation (0.335631)*/
        , 3, -10, 8, -13 /*mean (0.224438), correlation (0.34504)*/
        , -7, -7, -4, 5 /*mean (0.239361), correlation (0.338053)*/
        , -3, -2, -1, -7 /*mean (0.240744), correlation (0.344322)*/
        , 2, 9, 5, -11 /*mean (0.242949), correlation (0.34145)*/
        , -11, -13, -5, -13 /*mean (0.244028), correlation (0.336861)*/
        , -1, 6, 0, -1 /*mean (0.247571), correlation (0.343684)*/
        , 5, -3, 5, 2 /*mean (0.000697256), correlation (0.357265)*/
        , -4, -13, -4, 12 /*mean (0.00213675), correlation (0.373827)*/
        , -9, -6, -9, 6 /*mean (0.0126856), correlation (0.373938)*/
        , -12, -10, -8, -4 /*mean (0.0152497), correlation (0.364237)*/
        , 10, 2, 12, -3 /*mean (0.0299933), correlation (0.345292)*/
        , 7, 12, 12, 12 /*mean (0.0307242), correlation (0.366299)*/
        , -7, -13, -6, 5 /*mean (0.0534975), correlation (0.368357)*/
        , -4, 9, -3, 4 /*mean (0.099865), correlation (0.372276)*/
        , 7, -1, 12, 2 /*mean (0.117083), correlation (0.364529)*/
        , -7, 6, -5, 1 /*mean (0.126125), correlation (0.369606)*/
        , -13, 11, -12, 5 /*mean (0.130364), correlation (0.358502)*/
        , -3, 7, -2, -6 /*mean (0.131691), correlation (0.375531)*/
        , 7, -8, 12, -7 /*mean (0.160166), correlation (0.379508)*/
        , -13, -7, -11, -12 /*mean (0.167848), correlation (0.353343)*/
        , 1, -3, 12, 12 /*mean (0.183378), correlation (0.371916)*/
        , 2, -6, 3, 0 /*mean (0.228711), correlation (0.371761)*/
        , -4, 3, -2, -13 /*mean (0.247211), correlation (0.364063)*/
        , -1, -13, 1, 9 /*mean (0.249325), correlation (0.378139)*/
        , 7, 1, 8, -6 /*mean (0.000652272), correlation (0.411682)*/
        , 1, -1, 3, 12 /*mean (0.00248538), correlation (0.392988)*/
        , 9, 1, 12, 6 /*mean (0.0206815), correlation (0.386106)*/
        , -1, -9, -1, 3 /*mean (0.0364485), correlation (0.410752)*/
        , -13, -13, -10, 5 /*mean (0.0376068), correlation (0.398374)*/
        , 7, 7, 10, 12 /*mean (0.0424202), correlation (0.405663)*/
        , 12, -5, 12, 9 /*mean (0.0942645), correlation (0.410422)*/
        , 6, 3, 7, 11 /*mean (0.1074), correlation (0.413224)*/
        , 5, -13, 6, 10 /*mean (0.109256), correlation (0.408646)*/
        , 2, -12, 2, 3 /*mean (0.131691), correlation (0.416076)*/
        , 3, 8, 4, -6 /*mean (0.165081), correlation (0.417569)*/
        , 2, 6, 12, -13 /*mean (0.171874), correlation (0.408471)*/
        , 9, -12, 10, 3 /*mean (0.175146), correlation (0.41296)*/
        , -8, 4, -7, 9 /*mean (0.183682), correlation (0.402956)*/
        , -11, 12, -4, -6 /*mean (0.184672), correlation (0.416125)*/
        , 1, 12, 2, -8 /*mean (0.191487), correlation (0.386696)*/
        , 6, -9, 7, -4 /*mean (0.192668), correlation (0.394771)*/
        , 2, 3, 3, -2 /*mean (0.200157), correlation (0.408303)*/
        , 6, 3, 11, 0 /*mean (0.204588), correlation (0.411762)*/
        , 3, -3, 8, -8 /*mean (0.205904), correlation (0.416294)*/
        , 7, 8, 9, 3 /*mean (0.213237), correlation (0.409306)*/
        , -11, -5, -6, -4 /*mean (0.243444), correlation (0.395069)*/
        , -10, 11, -5, 10 /*mean (0.247672), correlation (0.413392)*/
        , -5, -8, -3, 12 /*mean (0.24774), correlation (0.411416)*/
        , -10, 5, -9, 0 /*mean (0.00213675), correlation (0.454003)*/
        , 8, -1, 12, -6 /*mean (0.0293635), correlation (0.455368)*/
        , 4, -6, 6, -11 /*mean (0.0404971), correlation (0.457393)*/
        , -10, 12, -8, 7 /*mean (0.0481107), correlation (0.448364)*/
        , 4, -2, 6, 7 /*mean (0.050641), correlation (0.455019)*/
        , -2, 0, -2, 12 /*mean (0.0525978), correlation (0.44338)*/
        , -5, -8, -5, 2 /*mean (0.0629667), correlation (0.457096)*/
        , 7, -6, 10, 12 /*mean (0.0653846), correlation (0.445623)*/
        , -9, -13, -8, -8 /*mean (0.0858749), correlation (0.449789)*/
        , -5, -13, -5, -2 /*mean (0.122402), correlation (0.450201)*/
        , 8, -8, 9, -13 /*mean (0.125416), correlation (0.453224)*/
        , -9, -11, -9, 0 /*mean (0.130128), correlation (0.458724)*/
        , 1, -8, 1, -2 /*mean (0.132467), correlation (0.440133)*/
        , 7, -4, 9, 1 /*mean (0.132692), correlation (0.454)*/
        , -2, 1, -1, -4 /*mean (0.135695), correlation (0.455739)*/
        , 11, -6, 12, -11 /*mean (0.142904), correlation (0.446114)*/
        , -12, -9, -6, 4 /*mean (0.146165), correlation (0.451473)*/
        , 3, 7, 7, 12 /*mean (0.147627), correlation (0.456643)*/
        , 5, 5, 10, 8 /*mean (0.152901), correlation (0.455036)*/
        , 0, -4, 2, 8 /*mean (0.167083), correlation (0.459315)*/
        , -9, 12, -5, -13 /*mean (0.173234), correlation (0.454706)*/
        , 0, 7, 2, 12 /*mean (0.18312), correlation (0.433855)*/
        , -1, 2, 1, 7 /*mean (0.185504), correlation (0.443838)*/
        , 5, 11, 7, -9 /*mean (0.185706), correlation (0.451123)*/
        , 3, 5, 6, -8 /*mean (0.188968), correlation (0.455808)*/
        , -13, -4, -8, 9 /*mean (0.191667), correlation (0.459128)*/
        , -5, 9, -3, -3 /*mean (0.193196), correlation (0.458364)*/
        , -4, -7, -3, -12 /*mean (0.196536), correlation (0.455782)*/
        , 6, 5, 8, 0 /*mean (0.1972), correlation (0.450481)*/
        , -7, 6, -6, 12 /*mean (0.199438), correlation (0.458156)*/
        , -13, 6, -5, -2 /*mean (0.211224), correlation (0.449548)*/
        , 1, -10, 3, 10 /*mean (0.211718), correlation (0.440606)*/
        , 4, 1, 8, -4 /*mean (0.213034), correlation (0.443177)*/
        , -2, -2, 2, -13 /*mean (0.234334), correlation (0.455304)*/
        , 2, -12, 12, 12 /*mean (0.235684), correlation (0.443436)*/
        , -2, -13, 0, -6 /*mean (0.237674), correlation (0.452525)*/
        , 4, 1, 9, 3 /*mean (0.23962), correlation (0.444824)*/
        , -6, -10, -3, -5 /*mean (0.248459), correlation (0.439621)*/
        , -3, -13, -1, 1 /*mean (0.249505), correlation (0.456666)*/
        , 7, 5, 12, -11 /*mean (0.00119208), correlation (0.495466)*/
        , 4, -2, 5, -7 /*mean (0.00372245), correlation (0.484214)*/
        , -13, 9, -9, -5 /*mean (0.00741116), correlation (0.499854)*/
        , 7, 1, 8, 6 /*mean (0.0208952), correlation (0.499773)*/
        , 7, -8, 7, 6 /*mean (0.0220085), correlation (0.501609)*/
        , -7, -4, -7, 1 /*mean (0.0233806), correlation (0.496568)*/
        , -8, 11, -7, -8 /*mean (0.0236505), correlation (0.489719)*/
        , -13, 6, -12, -8 /*mean (0.0268781), correlation (0.503487)*/
        , 2, 4, 3, 9 /*mean (0.0323324), correlation (0.501938)*/
        , 10, -5, 12, 3 /*mean (0.0399235), correlation (0.494029)*/
        , -6, -5, -6, 7 /*mean (0.0420153), correlation (0.486579)*/
        , 8, -3, 9, -8 /*mean (0.0548021), correlation (0.484237)*/
        , 2, -12, 2, 8 /*mean (0.0616622), correlation (0.496642)*/
        , -11, -2, -10, 3 /*mean (0.0627755), correlation (0.498563)*/
        , -12, -13, -7, -9 /*mean (0.0829622), correlation (0.495491)*/
        , -11, 0, -10, -5 /*mean (0.0843342), correlation (0.487146)*/
        , 5, -3, 11, 8 /*mean (0.0929937), correlation (0.502315)*/
        , -2, -13, -1, 12 /*mean (0.113327), correlation (0.48941)*/
        , -1, -8, 0, 9 /*mean (0.132119), correlation (0.467268)*/
        , -13, -11, -12, -5 /*mean (0.136269), correlation (0.498771)*/
        , -10, -2, -10, 11 /*mean (0.142173), correlation (0.498714)*/
        , -3, 9, -2, -13 /*mean (0.144141), correlation (0.491973)*/
        , 2, -3, 3, 2 /*mean (0.14892), correlation (0.500782)*/
        , -9, -13, -4, 0 /*mean (0.150371), correlation (0.498211)*/
        , -4, 6, -3, -10 /*mean (0.152159), correlation (0.495547)*/
        , -4, 12, -2, -7 /*mean (0.156152), correlation (0.496925)*/
        , -6, -11, -4, 9 /*mean (0.15749), correlation (0.499222)*/
        , 6, -3, 6, 11 /*mean (0.159211), correlation (0.503821)*/
        , -13, 11, -5, 5 /*mean (0.162427), correlation (0.501907)*/
        , 11, 11, 12, 6 /*mean (0.16652), correlation (0.497632)*/
        , 7, -5, 12, -2 /*mean (0.169141), correlation (0.484474)*/
        , -1, 12, 0, 7 /*mean (0.169456), correlation (0.495339)*/
        , -4, -8, -3, -2 /*mean (0.171457), correlation (0.487251)*/
        , -7, 1, -6, 7 /*mean (0.175), correlation (0.500024)*/
        , -13, -12, -8, -13 /*mean (0.175866), correlation (0.497523)*/
        , -7, -2, -6, -8 /*mean (0.178273), correlation (0.501854)*/
        , -8, 5, -6, -9 /*mean (0.181107), correlation (0.494888)*/
        , -5, -1, -4, 5 /*mean (0.190227), correlation (0.482557)*/
        , -13, 7, -8, 10 /*mean (0.196739), correlation (0.496503)*/
        , 1, 5, 5, -13 /*mean (0.19973), correlation (0.499759)*/
        , 1, 0, 10, -13 /*mean (0.204465), correlation (0.49873)*/
        , 9, 12, 10, -1 /*mean (0.209334), correlation (0.49063)*/
        , 5, -8, 10, -9 /*mean (0.211134), correlation (0.503011)*/
        , -1, 11, 1, -13 /*mean (0.212), correlation (0.499414)*/
        , -9, -3, -6, 2 /*mean (0.212168), correlation (0.480739)*/
        , -1, -10, 1, 12 /*mean (0.212731), correlation (0.502523)*/
        , -13, 1, -8, -10 /*mean (0.21327), correlation (0.489786)*/
        , 8, -11, 10, -6 /*mean (0.214159), correlation (0.488246)*/
        , 2, -13, 3, -6 /*mean (0.216993), correlation (0.50287)*/
        , 7, -13, 12, -9 /*mean (0.223639), correlation (0.470502)*/
        , -10, -10, -5, -7 /*mean (0.224089), correlation (0.500852)*/
        , -10, -8, -8, -13 /*mean (0.228666), correlation (0.502629)*/
        , 4, -6, 8, 5 /*mean (0.22906), correlation (0.498305)*/
        , 3, 12, 8, -13 /*mean (0.233378), correlation (0.503825)*/
        , -4, 2, -3, -3 /*mean (0.234323), correlation (0.476692)*/
        , 5, -13, 10, -12 /*mean (0.236392), correlation (0.475462)*/
        , 4, -13, 5, -1 /*mean (0.236842), correlation (0.504132)*/
        , -9, 9, -4, 3 /*mean (0.236977), correlation (0.497739)*/
        , 0, 3, 3, -9 /*mean (0.24314), correlation (0.499398)*/
        , -12, 1, -6, 1 /*mean (0.243297), correlation (0.489447)*/
        , 3, 2, 4, -8 /*mean (0.00155196), correlation (0.553496)*/
        , -10, -10, -10, 9 /*mean (0.00239541), correlation (0.54297)*/
        , 8, -13, 12, 12 /*mean (0.0034413), correlation (0.544361)*/
        , -8, -12, -6, -5 /*mean (0.003565), correlation (0.551225)*/
        , 2, 2, 3, 7 /*mean (0.00835583), correlation (0.55285)*/
        , 10, 6, 11, -8 /*mean (0.00885065), correlation (0.540913)*/
        , 6, 8, 8, -12 /*mean (0.0101552), correlation (0.551085)*/
        , -7, 10, -6, 5 /*mean (0.0102227), correlation (0.533635)*/
        , -3, -9, -3, 9 /*mean (0.0110211), correlation (0.543121)*/
        , -1, -13, -1, 5 /*mean (0.0113473), correlation (0.550173)*/
        , -3, -7, -3, 4 /*mean (0.0140913), correlation (0.554774)*/
        , -8, -2, -8, 3 /*mean (0.017049), correlation (0.55461)*/
        , 4, 2, 12, 12 /*mean (0.01778), correlation (0.546921)*/
        , 2, -5, 3, 11 /*mean (0.0224022), correlation (0.549667)*/
        , 6, -9, 11, -13 /*mean (0.029161), correlation (0.546295)*/
        , 3, -1, 7, 12 /*mean (0.0303081), correlation (0.548599)*/
        , 11, -1, 12, 4 /*mean (0.0355151), correlation (0.523943)*/
        , -3, 0, -3, 6 /*mean (0.0417904), correlation (0.543395)*/
        , 4, -11, 4, 12 /*mean (0.0487292), correlation (0.542818)*/
        , 2, -4, 2, 1 /*mean (0.0575124), correlation (0.554888)*/
        , -10, -6, -8, 1 /*mean (0.0594242), correlation (0.544026)*/
        , -13, 7, -11, 1 /*mean (0.0597391), correlation (0.550524)*/
        , -13, 12, -11, -13 /*mean (0.0608974), correlation (0.55383)*/
        , 6, 0, 11, -13 /*mean (0.065126), correlation (0.552006)*/
        , 0, -1, 1, 4 /*mean (0.074224), correlation (0.546372)*/
        , -13, 3, -9, -2 /*mean (0.0808592), correlation (0.554875)*/
        , -9, 8, -6, -3 /*mean (0.0883378), correlation (0.551178)*/
        , -13, -6, -8, -2 /*mean (0.0901035), correlation (0.548446)*/
        , 5, -9, 8, 10 /*mean (0.0949843), correlation (0.554694)*/
        , 2, 7, 3, -9 /*mean (0.0994152), correlation (0.550979)*/
        , -1, -6, -1, -1 /*mean (0.10045), correlation (0.552714)*/
        , 9, 5, 11, -2 /*mean (0.100686), correlation (0.552594)*/
        , 11, -3, 12, -8 /*mean (0.101091), correlation (0.532394)*/
        , 3, 0, 3, 5 /*mean (0.101147), correlation (0.525576)*/
        , -1, 4, 0, 10 /*mean (0.105263), correlation (0.531498)*/
        , 3, -6, 4, 5 /*mean (0.110785), correlation (0.540491)*/
        , -13, 0, -10, 5 /*mean (0.112798), correlation (0.536582)*/
        , 5, 8, 12, 11 /*mean (0.114181), correlation (0.555793)*/
        , 8, 9, 9, -6 /*mean (0.117431), correlation (0.553763)*/
        , 7, -4, 8, -12 /*mean (0.118522), correlation (0.553452)*/
        , -10, 4, -10, 9 /*mean (0.12094), correlation (0.554785)*/
        , 7, 3, 12, 4 /*mean (0.122582), correlation (0.555825)*/
        , 9, -7, 10, -2 /*mean (0.124978), correlation (0.549846)*/
        , 7, 0, 12, -2 /*mean (0.127002), correlation (0.537452)*/
        , -1, -6, 0, -11 /*mean (0.127148), correlation (0.547401)*/
        ]);

        var H = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
        var patch_img = new jsfeat.matrix_t(32, 32, jsfeat.U8_t | jsfeat.C1_t);

        var rectify_patch = function rectify_patch(src, dst, angle, px, py, psize) {
            var cosine = Math.cos(angle);
            var sine = Math.sin(angle);

            H.data[0] = cosine, H.data[1] = -sine, H.data[2] = (-cosine + sine) * psize * 0.5 + px, H.data[3] = sine, H.data[4] = cosine, H.data[5] = (-sine - cosine) * psize * 0.5 + py;

            jsfeat.imgproc.warp_affine(src, dst, H, 128);
        };

        return {

            describe: function describe(src, corners, count, descriptors) {
                var DESCR_SIZE = 32; // bytes;
                var i = 0,
                    b = 0,
                    px = 0.0,
                    py = 0.0,
                    angle = 0.0;
                var t0 = 0,
                    t1 = 0,
                    val = 0;
                var img = src.data,
                    w = src.cols,
                    h = src.rows;
                var patch_d = patch_img.data;
                var patch_off = 16 * 32 + 16; // center of patch
                var patt = 0;

                if (!(descriptors.type & jsfeat.U8_t)) {
                    // relocate to U8 type
                    descriptors.type = jsfeat.U8_t;
                    descriptors.cols = DESCR_SIZE;
                    descriptors.rows = count;
                    descriptors.channel = 1;
                    descriptors.allocate();
                } else {
                    descriptors.resize(DESCR_SIZE, count, 1);
                }

                var descr_d = descriptors.data;
                var descr_off = 0;

                for (i = 0; i < count; ++i) {
                    px = corners[i].x;
                    py = corners[i].y;
                    angle = corners[i].angle;

                    rectify_patch(src, patch_img, angle, px, py, 32);

                    // describe the patch
                    patt = 0;
                    for (b = 0; b < DESCR_SIZE; ++b) {

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val = t0 < t1 | 0;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 1;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 2;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 3;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 4;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 5;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 6;

                        t0 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        t1 = patch_d[patch_off + bit_pattern_31_[patt + 1] * 32 + bit_pattern_31_[patt]];patt += 2;
                        val |= (t0 < t1) << 7;

                        descr_d[descr_off + b] = val;
                    }
                    descr_off += DESCR_SIZE;
                }
            }
        };
    }();

    global.orb = orb;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * this code is a rewrite from OpenCV's Lucas-Kanade optical flow implementation
 */

(function (global) {
    "use strict";
    //

    var optical_flow_lk = function () {

        // short link to shar deriv
        var scharr_deriv = jsfeat.imgproc.scharr_derivatives;

        return {
            track: function track(prev_pyr, curr_pyr, prev_xy, curr_xy, count, win_size, max_iter, status, eps, min_eigen_threshold) {
                if (typeof max_iter === "undefined") {
                    max_iter = 30;
                }
                if (typeof status === "undefined") {
                    status = new Uint8Array(count);
                }
                if (typeof eps === "undefined") {
                    eps = 0.01;
                }
                if (typeof min_eigen_threshold === "undefined") {
                    min_eigen_threshold = 0.0001;
                }

                var half_win = (win_size - 1) * 0.5;
                var win_area = win_size * win_size | 0;
                var win_area2 = win_area << 1;
                var prev_imgs = prev_pyr.data,
                    next_imgs = curr_pyr.data;
                var img_prev = prev_imgs[0].data,
                    img_next = next_imgs[0].data;
                var w0 = prev_imgs[0].cols,
                    h0 = prev_imgs[0].rows,
                    lw = 0,
                    lh = 0;

                var iwin_node = jsfeat.cache.get_buffer(win_area << 2);
                var deriv_iwin_node = jsfeat.cache.get_buffer(win_area2 << 2);
                var deriv_lev_node = jsfeat.cache.get_buffer(h0 * (w0 << 1) << 2);

                var deriv_m = new jsfeat.matrix_t(w0, h0, jsfeat.S32C2_t, deriv_lev_node.data);

                var iwin_buf = iwin_node.i32;
                var deriv_iwin = deriv_iwin_node.i32;
                var deriv_lev = deriv_lev_node.i32;

                var dstep = 0,
                    src = 0,
                    dsrc = 0,
                    iptr = 0,
                    diptr = 0,
                    jptr = 0;
                var lev_sc = 0.0,
                    prev_x = 0.0,
                    prev_y = 0.0,
                    next_x = 0.0,
                    next_y = 0.0;
                var prev_delta_x = 0.0,
                    prev_delta_y = 0.0,
                    delta_x = 0.0,
                    delta_y = 0.0;
                var iprev_x = 0,
                    iprev_y = 0,
                    inext_x = 0,
                    inext_y = 0;
                var i = 0,
                    j = 0,
                    x = 0,
                    y = 0,
                    level = 0,
                    ptid = 0,
                    iter = 0;
                var brd_tl = 0,
                    brd_r = 0,
                    brd_b = 0;
                var a = 0.0,
                    b = 0.0,
                    b1 = 0.0,
                    b2 = 0.0;

                // fixed point math
                var W_BITS14 = 14;
                var W_BITS4 = 14;
                var W_BITS1m5 = W_BITS4 - 5;
                var W_BITS1m51 = 1 << W_BITS1m5 - 1;
                var W_BITS14_ = 1 << W_BITS14;
                var W_BITS41 = 1 << W_BITS4 - 1;
                var FLT_SCALE = 1.0 / (1 << 20);
                var iw00 = 0,
                    iw01 = 0,
                    iw10 = 0,
                    iw11 = 0,
                    ival = 0,
                    ixval = 0,
                    iyval = 0;
                var A11 = 0.0,
                    A12 = 0.0,
                    A22 = 0.0,
                    D = 0.0,
                    min_eig = 0.0;

                var FLT_EPSILON = 0.00000011920929;
                eps *= eps;

                // reset status
                for (; i < count; ++i) {
                    status[i] = 1;
                }

                var max_level = prev_pyr.levels - 1 | 0;
                level = max_level;

                for (; level >= 0; --level) {
                    lev_sc = 1.0 / (1 << level);
                    lw = w0 >> level;
                    lh = h0 >> level;
                    dstep = lw << 1;
                    img_prev = prev_imgs[level].data;
                    img_next = next_imgs[level].data;

                    brd_r = lw - win_size | 0;
                    brd_b = lh - win_size | 0;

                    // calculate level derivatives
                    scharr_deriv(prev_imgs[level], deriv_m);

                    // iterate through points
                    for (ptid = 0; ptid < count; ++ptid) {
                        i = ptid << 1;
                        j = i + 1;
                        prev_x = prev_xy[i] * lev_sc;
                        prev_y = prev_xy[j] * lev_sc;

                        if (level == max_level) {
                            next_x = prev_x;
                            next_y = prev_y;
                        } else {
                            next_x = curr_xy[i] * 2.0;
                            next_y = curr_xy[j] * 2.0;
                        }
                        curr_xy[i] = next_x;
                        curr_xy[j] = next_y;

                        prev_x -= half_win;
                        prev_y -= half_win;
                        iprev_x = prev_x | 0;
                        iprev_y = prev_y | 0;

                        // border check
                        x = iprev_x <= brd_tl | iprev_x >= brd_r | iprev_y <= brd_tl | iprev_y >= brd_b;
                        if (x != 0) {
                            if (level == 0) {
                                status[ptid] = 0;
                            }
                            continue;
                        }

                        a = prev_x - iprev_x;
                        b = prev_y - iprev_y;
                        iw00 = (1.0 - a) * (1.0 - b) * W_BITS14_ + 0.5 | 0;
                        iw01 = a * (1.0 - b) * W_BITS14_ + 0.5 | 0;
                        iw10 = (1.0 - a) * b * W_BITS14_ + 0.5 | 0;
                        iw11 = W_BITS14_ - iw00 - iw01 - iw10;

                        A11 = 0.0, A12 = 0.0, A22 = 0.0;

                        // extract the patch from the first image, compute covariation matrix of derivatives
                        for (y = 0; y < win_size; ++y) {
                            src = (y + iprev_y) * lw + iprev_x | 0;
                            dsrc = src << 1;

                            iptr = y * win_size | 0;
                            diptr = iptr << 1;
                            for (x = 0; x < win_size; ++x, ++src, ++iptr, dsrc += 2) {
                                ival = img_prev[src] * iw00 + img_prev[src + 1] * iw01 + img_prev[src + lw] * iw10 + img_prev[src + lw + 1] * iw11;
                                ival = ival + W_BITS1m51 >> W_BITS1m5;

                                ixval = deriv_lev[dsrc] * iw00 + deriv_lev[dsrc + 2] * iw01 + deriv_lev[dsrc + dstep] * iw10 + deriv_lev[dsrc + dstep + 2] * iw11;
                                ixval = ixval + W_BITS41 >> W_BITS4;

                                iyval = deriv_lev[dsrc + 1] * iw00 + deriv_lev[dsrc + 3] * iw01 + deriv_lev[dsrc + dstep + 1] * iw10 + deriv_lev[dsrc + dstep + 3] * iw11;
                                iyval = iyval + W_BITS41 >> W_BITS4;

                                iwin_buf[iptr] = ival;
                                deriv_iwin[diptr++] = ixval;
                                deriv_iwin[diptr++] = iyval;

                                A11 += ixval * ixval;
                                A12 += ixval * iyval;
                                A22 += iyval * iyval;
                            }
                        }

                        A11 *= FLT_SCALE;A12 *= FLT_SCALE;A22 *= FLT_SCALE;

                        D = A11 * A22 - A12 * A12;
                        min_eig = (A22 + A11 - Math.sqrt((A11 - A22) * (A11 - A22) + 4.0 * A12 * A12)) / win_area2;

                        if (min_eig < min_eigen_threshold || D < FLT_EPSILON) {
                            if (level == 0) {
                                status[ptid] = 0;
                            }
                            continue;
                        }

                        D = 1.0 / D;

                        next_x -= half_win;
                        next_y -= half_win;
                        prev_delta_x = 0.0;
                        prev_delta_y = 0.0;

                        for (iter = 0; iter < max_iter; ++iter) {
                            inext_x = next_x | 0;
                            inext_y = next_y | 0;

                            x = inext_x <= brd_tl | inext_x >= brd_r | inext_y <= brd_tl | inext_y >= brd_b;
                            if (x != 0) {
                                if (level == 0) {
                                    status[ptid] = 0;
                                }
                                break;
                            }

                            a = next_x - inext_x;
                            b = next_y - inext_y;
                            iw00 = (1.0 - a) * (1.0 - b) * W_BITS14_ + 0.5 | 0;
                            iw01 = a * (1.0 - b) * W_BITS14_ + 0.5 | 0;
                            iw10 = (1.0 - a) * b * W_BITS14_ + 0.5 | 0;
                            iw11 = W_BITS14_ - iw00 - iw01 - iw10;
                            b1 = 0.0, b2 = 0.0;

                            for (y = 0; y < win_size; ++y) {
                                jptr = (y + inext_y) * lw + inext_x | 0;

                                iptr = y * win_size | 0;
                                diptr = iptr << 1;
                                for (x = 0; x < win_size; ++x, ++jptr, ++iptr) {
                                    ival = img_next[jptr] * iw00 + img_next[jptr + 1] * iw01 + img_next[jptr + lw] * iw10 + img_next[jptr + lw + 1] * iw11;
                                    ival = ival + W_BITS1m51 >> W_BITS1m5;
                                    ival = ival - iwin_buf[iptr];

                                    b1 += ival * deriv_iwin[diptr++];
                                    b2 += ival * deriv_iwin[diptr++];
                                }
                            }

                            b1 *= FLT_SCALE;
                            b2 *= FLT_SCALE;

                            delta_x = (A12 * b2 - A22 * b1) * D;
                            delta_y = (A12 * b1 - A11 * b2) * D;

                            next_x += delta_x;
                            next_y += delta_y;
                            curr_xy[i] = next_x + half_win;
                            curr_xy[j] = next_y + half_win;

                            if (delta_x * delta_x + delta_y * delta_y <= eps) {
                                break;
                            }

                            if (iter > 0 && Math.abs(delta_x + prev_delta_x) < 0.01 && Math.abs(delta_y + prev_delta_y) < 0.01) {
                                curr_xy[i] -= delta_x * 0.5;
                                curr_xy[j] -= delta_y * 0.5;
                                break;
                            }

                            prev_delta_x = delta_x;
                            prev_delta_y = delta_y;
                        }
                    } // points loop
                } // levels loop

                jsfeat.cache.put_buffer(iwin_node);
                jsfeat.cache.put_buffer(deriv_iwin_node);
                jsfeat.cache.put_buffer(deriv_lev_node);
            }
        };
    }();

    global.optical_flow_lk = optical_flow_lk;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * this code is a rewrite from https://github.com/mtschirs/js-objectdetect implementation
 * @author Martin Tschirsich / http://www.tu-darmstadt.de/~m_t
 */

(function (global) {
    "use strict";
    //

    var haar = function () {

        var _group_func = function _group_func(r1, r2) {
            var distance = r1.width * 0.25 + 0.5 | 0;

            return r2.x <= r1.x + distance && r2.x >= r1.x - distance && r2.y <= r1.y + distance && r2.y >= r1.y - distance && r2.width <= r1.width * 1.5 + 0.5 | 0 && r2.width * 1.5 + 0.5 | 0 >= r1.width;
        };

        return {

            edges_density: 0.07,

            detect_single_scale: function detect_single_scale(int_sum, int_sqsum, int_tilted, int_canny_sum, width, height, scale, classifier) {
                var win_w = classifier.size[0] * scale | 0,
                    win_h = classifier.size[1] * scale | 0,
                    step_x = 0.5 * scale + 1.5 | 0,
                    step_y = step_x;
                var i,
                    j,
                    k,
                    x,
                    y,
                    ex = width - win_w | 0,
                    ey = height - win_h | 0;
                var w1 = width + 1 | 0,
                    edge_dens,
                    mean,
                    variance,
                    std;
                var inv_area = 1.0 / (win_w * win_h);
                var stages,
                    stage,
                    trees,
                    tree,
                    sn,
                    tn,
                    fn,
                    found = true,
                    stage_thresh,
                    stage_sum,
                    tree_sum,
                    feature,
                    features;
                var fi_a, fi_b, fi_c, fi_d, fw, fh;

                var ii_a = 0,
                    ii_b = win_w,
                    ii_c = win_h * w1,
                    ii_d = ii_c + win_w;
                var edges_thresh = win_w * win_h * 0xff * this.edges_density | 0;
                // if too much gradient we also can skip
                //var edges_thresh_high = ((win_w*win_h) * 0xff * 0.3)|0;

                var rects = [];
                for (y = 0; y < ey; y += step_y) {
                    ii_a = y * w1;
                    for (x = 0; x < ex; x += step_x, ii_a += step_x) {

                        mean = int_sum[ii_a] - int_sum[ii_a + ii_b] - int_sum[ii_a + ii_c] + int_sum[ii_a + ii_d];

                        // canny prune
                        if (int_canny_sum) {
                            edge_dens = int_canny_sum[ii_a] - int_canny_sum[ii_a + ii_b] - int_canny_sum[ii_a + ii_c] + int_canny_sum[ii_a + ii_d];
                            if (edge_dens < edges_thresh || mean < 20) {
                                x += step_x, ii_a += step_x;
                                continue;
                            }
                        }

                        mean *= inv_area;
                        variance = (int_sqsum[ii_a] - int_sqsum[ii_a + ii_b] - int_sqsum[ii_a + ii_c] + int_sqsum[ii_a + ii_d]) * inv_area - mean * mean;

                        std = variance > 0. ? Math.sqrt(variance) : 1;

                        stages = classifier.complexClassifiers;
                        sn = stages.length;
                        found = true;
                        for (i = 0; i < sn; ++i) {
                            stage = stages[i];
                            stage_thresh = stage.threshold;
                            trees = stage.simpleClassifiers;
                            tn = trees.length;
                            stage_sum = 0;
                            for (j = 0; j < tn; ++j) {
                                tree = trees[j];
                                tree_sum = 0;
                                features = tree.features;
                                fn = features.length;
                                if (tree.tilted === 1) {
                                    for (k = 0; k < fn; ++k) {
                                        feature = features[k];
                                        fi_a = ~~(x + feature[0] * scale) + ~~(y + feature[1] * scale) * w1;
                                        fw = ~~(feature[2] * scale);
                                        fh = ~~(feature[3] * scale);
                                        fi_b = fw * w1;
                                        fi_c = fh * w1;

                                        tree_sum += (int_tilted[fi_a] - int_tilted[fi_a + fw + fi_b] - int_tilted[fi_a - fh + fi_c] + int_tilted[fi_a + fw - fh + fi_b + fi_c]) * feature[4];
                                    }
                                } else {
                                    for (k = 0; k < fn; ++k) {
                                        feature = features[k];
                                        fi_a = ~~(x + feature[0] * scale) + ~~(y + feature[1] * scale) * w1;
                                        fw = ~~(feature[2] * scale);
                                        fh = ~~(feature[3] * scale);
                                        fi_c = fh * w1;

                                        tree_sum += (int_sum[fi_a] - int_sum[fi_a + fw] - int_sum[fi_a + fi_c] + int_sum[fi_a + fi_c + fw]) * feature[4];
                                    }
                                }
                                stage_sum += tree_sum * inv_area < tree.threshold * std ? tree.left_val : tree.right_val;
                            }
                            if (stage_sum < stage_thresh) {
                                found = false;
                                break;
                            }
                        }

                        if (found) {
                            rects.push({ "x": x,
                                "y": y,
                                "width": win_w,
                                "height": win_h,
                                "neighbor": 1,
                                "confidence": stage_sum });
                            x += step_x, ii_a += step_x;
                        }
                    }
                }
                return rects;
            },

            detect_multi_scale: function detect_multi_scale(int_sum, int_sqsum, int_tilted, int_canny_sum, width, height, classifier, scale_factor, scale_min) {
                if (typeof scale_factor === "undefined") {
                    scale_factor = 1.2;
                }
                if (typeof scale_min === "undefined") {
                    scale_min = 1.0;
                }
                var win_w = classifier.size[0];
                var win_h = classifier.size[1];
                var rects = [];
                while (scale_min * win_w < width && scale_min * win_h < height) {
                    rects = rects.concat(this.detect_single_scale(int_sum, int_sqsum, int_tilted, int_canny_sum, width, height, scale_min, classifier));
                    scale_min *= scale_factor;
                }
                return rects;
            },

            // OpenCV method to group detected rectangles
            group_rectangles: function group_rectangles(rects, min_neighbors) {
                if (typeof min_neighbors === "undefined") {
                    min_neighbors = 1;
                }
                var i,
                    j,
                    n = rects.length;
                var node = [];
                for (i = 0; i < n; ++i) {
                    node[i] = { "parent": -1,
                        "element": rects[i],
                        "rank": 0 };
                }
                for (i = 0; i < n; ++i) {
                    if (!node[i].element) continue;
                    var root = i;
                    while (node[root].parent != -1) {
                        root = node[root].parent;
                    }for (j = 0; j < n; ++j) {
                        if (i != j && node[j].element && _group_func(node[i].element, node[j].element)) {
                            var root2 = j;

                            while (node[root2].parent != -1) {
                                root2 = node[root2].parent;
                            }if (root2 != root) {
                                if (node[root].rank > node[root2].rank) node[root2].parent = root;else {
                                    node[root].parent = root2;
                                    if (node[root].rank == node[root2].rank) node[root2].rank++;
                                    root = root2;
                                }

                                /* compress path from node2 to the root: */
                                var temp,
                                    node2 = j;
                                while (node[node2].parent != -1) {
                                    temp = node2;
                                    node2 = node[node2].parent;
                                    node[temp].parent = root;
                                }

                                /* compress path from node to the root: */
                                node2 = i;
                                while (node[node2].parent != -1) {
                                    temp = node2;
                                    node2 = node[node2].parent;
                                    node[temp].parent = root;
                                }
                            }
                        }
                    }
                }
                var idx_seq = [];
                var class_idx = 0;
                for (i = 0; i < n; i++) {
                    j = -1;
                    var node1 = i;
                    if (node[node1].element) {
                        while (node[node1].parent != -1) {
                            node1 = node[node1].parent;
                        }if (node[node1].rank >= 0) node[node1].rank = ~class_idx++;
                        j = ~node[node1].rank;
                    }
                    idx_seq[i] = j;
                }

                var comps = [];
                for (i = 0; i < class_idx + 1; ++i) {
                    comps[i] = { "neighbors": 0,
                        "x": 0,
                        "y": 0,
                        "width": 0,
                        "height": 0,
                        "confidence": 0 };
                }

                // count number of neighbors
                for (i = 0; i < n; ++i) {
                    var r1 = rects[i];
                    var idx = idx_seq[i];

                    if (comps[idx].neighbors == 0) comps[idx].confidence = r1.confidence;

                    ++comps[idx].neighbors;

                    comps[idx].x += r1.x;
                    comps[idx].y += r1.y;
                    comps[idx].width += r1.width;
                    comps[idx].height += r1.height;
                    comps[idx].confidence = Math.max(comps[idx].confidence, r1.confidence);
                }

                var seq2 = [];
                // calculate average bounding box
                for (i = 0; i < class_idx; ++i) {
                    n = comps[i].neighbors;
                    if (n >= min_neighbors) seq2.push({ "x": (comps[i].x * 2 + n) / (2 * n),
                        "y": (comps[i].y * 2 + n) / (2 * n),
                        "width": (comps[i].width * 2 + n) / (2 * n),
                        "height": (comps[i].height * 2 + n) / (2 * n),
                        "neighbors": comps[i].neighbors,
                        "confidence": comps[i].confidence });
                }

                var result_seq = [];
                n = seq2.length;
                // filter out small face rectangles inside large face rectangles
                for (i = 0; i < n; ++i) {
                    var r1 = seq2[i];
                    var flag = true;
                    for (j = 0; j < n; ++j) {
                        var r2 = seq2[j];
                        var distance = r2.width * 0.25 + 0.5 | 0;

                        if (i != j && r1.x >= r2.x - distance && r1.y >= r2.y - distance && r1.x + r1.width <= r2.x + r2.width + distance && r1.y + r1.height <= r2.y + r2.height + distance && (r2.neighbors > Math.max(3, r1.neighbors) || r1.neighbors < 3)) {
                            flag = false;
                            break;
                        }
                    }

                    if (flag) result_seq.push(r1);
                }
                return result_seq;
            }
        };
    }();

    global.haar = haar;
})(jsfeat);
/**
 * BBF: Brightness Binary Feature
 *
 * @author Eugene Zatepyakin / http://inspirit.ru/
 *
 * this code is a rewrite from https://github.com/liuliu/ccv implementation
 * @author Liu Liu / http://liuliu.me/
 *
 * The original paper refers to: YEF∗ Real-Time Object Detection, Yotam Abramson and Bruno Steux
 */

(function (global) {
    "use strict";
    //

    var bbf = function () {

        var _group_func = function _group_func(r1, r2) {
            var distance = r1.width * 0.25 + 0.5 | 0;

            return r2.x <= r1.x + distance && r2.x >= r1.x - distance && r2.y <= r1.y + distance && r2.y >= r1.y - distance && r2.width <= r1.width * 1.5 + 0.5 | 0 && r2.width * 1.5 + 0.5 | 0 >= r1.width;
        };

        var img_pyr = new jsfeat.pyramid_t(1);

        return {

            interval: 4,
            scale: 1.1486,
            next: 5,
            scale_to: 1,

            // make features local copy
            // to avoid array allocation with each scale
            // this is strange but array works faster than Int32 version???
            prepare_cascade: function prepare_cascade(cascade) {
                var sn = cascade.stage_classifier.length;
                for (var j = 0; j < sn; j++) {
                    var orig_feature = cascade.stage_classifier[j].feature;
                    var f_cnt = cascade.stage_classifier[j].count;
                    var feature = cascade.stage_classifier[j]._feature = new Array(f_cnt);
                    for (var k = 0; k < f_cnt; k++) {
                        feature[k] = { "size": orig_feature[k].size,
                            "px": new Array(orig_feature[k].size),
                            "pz": new Array(orig_feature[k].size),
                            "nx": new Array(orig_feature[k].size),
                            "nz": new Array(orig_feature[k].size) };
                    }
                }
            },

            build_pyramid: function build_pyramid(src, min_width, min_height, interval) {
                if (typeof interval === "undefined") {
                    interval = 4;
                }

                var sw = src.cols,
                    sh = src.rows;
                var i = 0,
                    nw = 0,
                    nh = 0;
                var new_pyr = false;
                var src0 = src,
                    src1 = src;
                var data_type = jsfeat.U8_t | jsfeat.C1_t;

                this.interval = interval;
                this.scale = Math.pow(2, 1 / (this.interval + 1));
                this.next = this.interval + 1 | 0;
                this.scale_to = Math.log(Math.min(sw / min_width, sh / min_height)) / Math.log(this.scale) | 0;

                var pyr_l = (this.scale_to + this.next * 2) * 4 | 0;
                if (img_pyr.levels != pyr_l) {
                    img_pyr.levels = pyr_l;
                    img_pyr.data = new Array(pyr_l);
                    new_pyr = true;
                    img_pyr.data[0] = src; // first is src
                }

                for (i = 1; i <= this.interval; ++i) {
                    nw = sw / Math.pow(this.scale, i) | 0;
                    nh = sh / Math.pow(this.scale, i) | 0;
                    src0 = img_pyr.data[i << 2];
                    if (new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[i << 2] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[i << 2];
                    }
                    jsfeat.imgproc.resample(src, src0, nw, nh);
                }
                for (i = this.next; i < this.scale_to + this.next * 2; ++i) {
                    src1 = img_pyr.data[(i << 2) - (this.next << 2)];
                    src0 = img_pyr.data[i << 2];
                    nw = src1.cols >> 1;
                    nh = src1.rows >> 1;
                    if (new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[i << 2] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[i << 2];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0);
                }
                for (i = this.next * 2; i < this.scale_to + this.next * 2; ++i) {
                    src1 = img_pyr.data[(i << 2) - (this.next << 2)];
                    nw = src1.cols >> 1;
                    nh = src1.rows >> 1;
                    src0 = img_pyr.data[(i << 2) + 1];
                    if (new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[(i << 2) + 1] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[(i << 2) + 1];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0, 1, 0);
                    //
                    src0 = img_pyr.data[(i << 2) + 2];
                    if (new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[(i << 2) + 2] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[(i << 2) + 2];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0, 0, 1);
                    //
                    src0 = img_pyr.data[(i << 2) + 3];
                    if (new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[(i << 2) + 3] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[(i << 2) + 3];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0, 1, 1);
                }
                return img_pyr;
            },

            detect: function detect(pyramid, cascade) {
                var interval = this.interval;
                var scale = this.scale;
                var next = this.next;
                var scale_upto = this.scale_to;
                var i = 0,
                    j = 0,
                    k = 0,
                    n = 0,
                    x = 0,
                    y = 0,
                    q = 0,
                    sn = 0,
                    f_cnt = 0,
                    q_cnt = 0,
                    p = 0,
                    pmin = 0,
                    nmax = 0,
                    f = 0,
                    i4 = 0,
                    qw = 0,
                    qh = 0;
                var sum = 0.0,
                    alpha,
                    feature,
                    orig_feature,
                    feature_k,
                    feature_o,
                    flag = true,
                    shortcut = true;
                var scale_x = 1.0,
                    scale_y = 1.0;
                var dx = [0, 1, 0, 1];
                var dy = [0, 0, 1, 1];
                var seq = [];
                var pyr = pyramid.data,
                    bpp = 1,
                    bpp2 = 2,
                    bpp4 = 4;

                var u8 = [],
                    u8o = [0, 0, 0];
                var step = [0, 0, 0];
                var paddings = [0, 0, 0];

                for (i = 0; i < scale_upto; i++) {
                    i4 = i << 2;
                    qw = pyr[i4 + (next << 3)].cols - (cascade.width >> 2);
                    qh = pyr[i4 + (next << 3)].rows - (cascade.height >> 2);
                    step[0] = pyr[i4].cols * bpp;
                    step[1] = pyr[i4 + (next << 2)].cols * bpp;
                    step[2] = pyr[i4 + (next << 3)].cols * bpp;
                    paddings[0] = pyr[i4].cols * bpp4 - qw * bpp4;
                    paddings[1] = pyr[i4 + (next << 2)].cols * bpp2 - qw * bpp2;
                    paddings[2] = pyr[i4 + (next << 3)].cols * bpp - qw * bpp;
                    sn = cascade.stage_classifier.length;
                    for (j = 0; j < sn; j++) {
                        orig_feature = cascade.stage_classifier[j].feature;
                        feature = cascade.stage_classifier[j]._feature;
                        f_cnt = cascade.stage_classifier[j].count;
                        for (k = 0; k < f_cnt; k++) {
                            feature_k = feature[k];
                            feature_o = orig_feature[k];
                            q_cnt = feature_o.size | 0;
                            for (q = 0; q < q_cnt; q++) {
                                feature_k.px[q] = feature_o.px[q] * bpp + feature_o.py[q] * step[feature_o.pz[q]];
                                feature_k.pz[q] = feature_o.pz[q];
                                feature_k.nx[q] = feature_o.nx[q] * bpp + feature_o.ny[q] * step[feature_o.nz[q]];
                                feature_k.nz[q] = feature_o.nz[q];
                            }
                        }
                    }
                    u8[0] = pyr[i4].data;u8[1] = pyr[i4 + (next << 2)].data;
                    for (q = 0; q < 4; q++) {
                        u8[2] = pyr[i4 + (next << 3) + q].data;
                        u8o[0] = dx[q] * bpp2 + dy[q] * (pyr[i4].cols * bpp2);
                        u8o[1] = dx[q] * bpp + dy[q] * (pyr[i4 + (next << 2)].cols * bpp);
                        u8o[2] = 0;
                        for (y = 0; y < qh; y++) {
                            for (x = 0; x < qw; x++) {
                                sum = 0;
                                flag = true;
                                sn = cascade.stage_classifier.length;
                                for (j = 0; j < sn; j++) {
                                    sum = 0;
                                    alpha = cascade.stage_classifier[j].alpha;
                                    feature = cascade.stage_classifier[j]._feature;
                                    f_cnt = cascade.stage_classifier[j].count;
                                    for (k = 0; k < f_cnt; k++) {
                                        feature_k = feature[k];
                                        pmin = u8[feature_k.pz[0]][u8o[feature_k.pz[0]] + feature_k.px[0]];
                                        nmax = u8[feature_k.nz[0]][u8o[feature_k.nz[0]] + feature_k.nx[0]];
                                        if (pmin <= nmax) {
                                            sum += alpha[k << 1];
                                        } else {
                                            shortcut = true;
                                            q_cnt = feature_k.size;
                                            for (f = 1; f < q_cnt; f++) {
                                                if (feature_k.pz[f] >= 0) {
                                                    p = u8[feature_k.pz[f]][u8o[feature_k.pz[f]] + feature_k.px[f]];
                                                    if (p < pmin) {
                                                        if (p <= nmax) {
                                                            shortcut = false;
                                                            break;
                                                        }
                                                        pmin = p;
                                                    }
                                                }
                                                if (feature_k.nz[f] >= 0) {
                                                    n = u8[feature_k.nz[f]][u8o[feature_k.nz[f]] + feature_k.nx[f]];
                                                    if (n > nmax) {
                                                        if (pmin <= n) {
                                                            shortcut = false;
                                                            break;
                                                        }
                                                        nmax = n;
                                                    }
                                                }
                                            }
                                            sum += shortcut ? alpha[(k << 1) + 1] : alpha[k << 1];
                                        }
                                    }
                                    if (sum < cascade.stage_classifier[j].threshold) {
                                        flag = false;
                                        break;
                                    }
                                }
                                if (flag) {
                                    seq.push({ "x": (x * 4 + dx[q] * 2) * scale_x,
                                        "y": (y * 4 + dy[q] * 2) * scale_y,
                                        "width": cascade.width * scale_x,
                                        "height": cascade.height * scale_y,
                                        "neighbor": 1,
                                        "confidence": sum });
                                    ++x;
                                    u8o[0] += bpp4;
                                    u8o[1] += bpp2;
                                    u8o[2] += bpp;
                                }
                                u8o[0] += bpp4;
                                u8o[1] += bpp2;
                                u8o[2] += bpp;
                            }
                            u8o[0] += paddings[0];
                            u8o[1] += paddings[1];
                            u8o[2] += paddings[2];
                        }
                    }
                    scale_x *= scale;
                    scale_y *= scale;
                }

                return seq;
            },

            // OpenCV method to group detected rectangles
            group_rectangles: function group_rectangles(rects, min_neighbors) {
                if (typeof min_neighbors === "undefined") {
                    min_neighbors = 1;
                }
                var i,
                    j,
                    n = rects.length;
                var node = [];
                for (i = 0; i < n; ++i) {
                    node[i] = { "parent": -1,
                        "element": rects[i],
                        "rank": 0 };
                }
                for (i = 0; i < n; ++i) {
                    if (!node[i].element) continue;
                    var root = i;
                    while (node[root].parent != -1) {
                        root = node[root].parent;
                    }for (j = 0; j < n; ++j) {
                        if (i != j && node[j].element && _group_func(node[i].element, node[j].element)) {
                            var root2 = j;

                            while (node[root2].parent != -1) {
                                root2 = node[root2].parent;
                            }if (root2 != root) {
                                if (node[root].rank > node[root2].rank) node[root2].parent = root;else {
                                    node[root].parent = root2;
                                    if (node[root].rank == node[root2].rank) node[root2].rank++;
                                    root = root2;
                                }

                                /* compress path from node2 to the root: */
                                var temp,
                                    node2 = j;
                                while (node[node2].parent != -1) {
                                    temp = node2;
                                    node2 = node[node2].parent;
                                    node[temp].parent = root;
                                }

                                /* compress path from node to the root: */
                                node2 = i;
                                while (node[node2].parent != -1) {
                                    temp = node2;
                                    node2 = node[node2].parent;
                                    node[temp].parent = root;
                                }
                            }
                        }
                    }
                }
                var idx_seq = [];
                var class_idx = 0;
                for (i = 0; i < n; i++) {
                    j = -1;
                    var node1 = i;
                    if (node[node1].element) {
                        while (node[node1].parent != -1) {
                            node1 = node[node1].parent;
                        }if (node[node1].rank >= 0) node[node1].rank = ~class_idx++;
                        j = ~node[node1].rank;
                    }
                    idx_seq[i] = j;
                }

                var comps = [];
                for (i = 0; i < class_idx + 1; ++i) {
                    comps[i] = { "neighbors": 0,
                        "x": 0,
                        "y": 0,
                        "width": 0,
                        "height": 0,
                        "confidence": 0 };
                }

                // count number of neighbors
                for (i = 0; i < n; ++i) {
                    var r1 = rects[i];
                    var idx = idx_seq[i];

                    if (comps[idx].neighbors == 0) comps[idx].confidence = r1.confidence;

                    ++comps[idx].neighbors;

                    comps[idx].x += r1.x;
                    comps[idx].y += r1.y;
                    comps[idx].width += r1.width;
                    comps[idx].height += r1.height;
                    comps[idx].confidence = Math.max(comps[idx].confidence, r1.confidence);
                }

                var seq2 = [];
                // calculate average bounding box
                for (i = 0; i < class_idx; ++i) {
                    n = comps[i].neighbors;
                    if (n >= min_neighbors) seq2.push({ "x": (comps[i].x * 2 + n) / (2 * n),
                        "y": (comps[i].y * 2 + n) / (2 * n),
                        "width": (comps[i].width * 2 + n) / (2 * n),
                        "height": (comps[i].height * 2 + n) / (2 * n),
                        "neighbors": comps[i].neighbors,
                        "confidence": comps[i].confidence });
                }

                var result_seq = [];
                n = seq2.length;
                // filter out small face rectangles inside large face rectangles
                for (i = 0; i < n; ++i) {
                    var r1 = seq2[i];
                    var flag = true;
                    for (j = 0; j < n; ++j) {
                        var r2 = seq2[j];
                        var distance = r2.width * 0.25 + 0.5 | 0;

                        if (i != j && r1.x >= r2.x - distance && r1.y >= r2.y - distance && r1.x + r1.width <= r2.x + r2.width + distance && r1.y + r1.height <= r2.y + r2.height + distance && (r2.neighbors > Math.max(3, r1.neighbors) || r1.neighbors < 3)) {
                            flag = false;
                            break;
                        }
                    }

                    if (flag) result_seq.push(r1);
                }
                return result_seq;
            }

        };
    }();

    global.bbf = bbf;
})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function (lib) {
    "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        // in a browser, define its namespaces in global
        window.jsfeat = lib;
    } else {
        // in commonjs, or when AMD wrapping has been applied, define its namespaces as exports
        module.exports = lib;
    }
})(jsfeat);

module.exports = jsfeat;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* eslint-disable */
module.exports = { "count": 16, "width": 24, "height": 24, "stage_classifier": [{ "count": 4, "threshold": -4.577530e+00, "feature": [{ "size": 4, "px": [3, 5, 8, 11], "py": [2, 2, 6, 3], "pz": [2, 1, 1, 0], "nx": [8, 4, 0, 0], "ny": [4, 4, 0, 0], "nz": [1, 1, -1, -1] }, { "size": 3, "px": [3, 6, 7], "py": [7, 13, 0], "pz": [1, 0, -1], "nx": [2, 3, 4], "ny": [5, 4, 4], "nz": [2, 1, 1] }, { "size": 5, "px": [5, 3, 10, 13, 11], "py": [1, 0, 3, 2, 2], "pz": [1, 2, 0, 0, 0], "nx": [0, 11, 0, 11, 11], "ny": [0, 2, 3, 1, 1], "nz": [1, 1, 0, 1, -1] }, { "size": 5, "px": [6, 12, 12, 9, 12], "py": [4, 13, 12, 7, 11], "pz": [1, 0, 0, 1, 0], "nx": [8, 0, 8, 2, 11], "ny": [4, 0, 8, 5, 1], "nz": [1, -1, -1, -1, -1] }], "alpha": [-2.879683e+00, 2.879683e+00, -1.569341e+00, 1.569341e+00, -1.286131e+00, 1.286131e+00, -1.157626e+00, 1.157626e+00] }, { "count": 4, "threshold": -4.339908e+00, "feature": [{ "size": 5, "px": [13, 12, 3, 11, 17], "py": [3, 3, 1, 4, 13], "pz": [0, 0, 2, 0, 0], "nx": [4, 3, 8, 15, 15], "ny": [4, 5, 4, 8, 8], "nz": [1, 2, 1, 0, -1] }, { "size": 5, "px": [6, 7, 6, 3, 3], "py": [13, 13, 4, 2, 7], "pz": [0, 0, 1, 2, 1], "nx": [4, 8, 3, 0, 15], "ny": [4, 4, 4, 3, 8], "nz": [1, 1, -1, -1, -1] }, { "size": 3, "px": [2, 2, 11], "py": [3, 2, 5], "pz": [2, 2, 0], "nx": [3, 8, 3], "ny": [4, 4, 4], "nz": [1, -1, -1] }, { "size": 5, "px": [15, 13, 9, 11, 7], "py": [2, 1, 2, 1, 0], "pz": [0, 0, 0, 0, 1], "nx": [23, 11, 23, 22, 23], "ny": [1, 0, 2, 0, 0], "nz": [0, 1, 0, 0, 0] }], "alpha": [-2.466029e+00, 2.466029e+00, -1.839510e+00, 1.839510e+00, -1.060559e+00, 1.060559e+00, -1.094927e+00, 1.094927e+00] }, { "count": 7, "threshold": -5.052474e+00, "feature": [{ "size": 5, "px": [17, 13, 3, 11, 10], "py": [13, 2, 1, 4, 3], "pz": [0, 0, 2, 0, 0], "nx": [4, 8, 8, 3, 7], "ny": [2, 8, 4, 5, 4], "nz": [2, 0, 1, 2, 1] }, { "size": 5, "px": [6, 7, 3, 6, 6], "py": [4, 12, 2, 13, 14], "pz": [1, 0, 2, 0, 0], "nx": [8, 3, 4, 4, 3], "ny": [4, 4, 2, 0, 2], "nz": [1, 1, -1, -1, -1] }, { "size": 5, "px": [7, 4, 5, 3, 3], "py": [2, 1, 3, 1, 1], "pz": [0, 1, 0, 1, -1], "nx": [1, 0, 1, 1, 0], "ny": [1, 3, 2, 0, 4], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [11, 11, 11, 3, 2], "py": [11, 13, 10, 7, 2], "pz": [0, 0, 0, 1, 2], "nx": [4, 1, 8, 2, 0], "ny": [4, 1, 12, 0, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 3, "px": [9, 13, 1], "py": [7, 19, 4], "pz": [1, -1, -1], "nx": [4, 7, 4], "ny": [5, 8, 2], "nz": [2, 1, 2] }, { "size": 5, "px": [12, 8, 16, 4, 4], "py": [12, 1, 2, 0, 0], "pz": [0, 1, 0, 2, -1], "nx": [11, 22, 11, 23, 23], "ny": [2, 0, 1, 1, 5], "nz": [1, 0, 1, 0, 0] }, { "size": 3, "px": [11, 17, 17], "py": [6, 11, 12], "pz": [0, 0, 0], "nx": [15, 1, 11], "ny": [9, 1, 1], "nz": [0, -1, -1] }], "alpha": [-2.156890e+00, 2.156890e+00, -1.718246e+00, 1.718246e+00, -9.651329e-01, 9.651329e-01, -9.948090e-01, 9.948090e-01, -8.802466e-01, 8.802466e-01, -8.486741e-01, 8.486741e-01, -8.141777e-01, 8.141777e-01] }, { "count": 13, "threshold": -5.774400e+00, "feature": [{ "size": 5, "px": [6, 10, 3, 12, 14], "py": [5, 3, 1, 2, 2], "pz": [1, 0, 2, 0, 0], "nx": [3, 4, 14, 8, 4], "ny": [5, 4, 8, 4, 2], "nz": [2, 1, 0, 1, 2] }, { "size": 5, "px": [10, 6, 11, 5, 12], "py": [4, 13, 4, 2, 4], "pz": [0, 0, 0, 1, 0], "nx": [1, 4, 8, 1, 1], "ny": [2, 4, 4, 4, 3], "nz": [0, 1, 1, 0, 0] }, { "size": 3, "px": [18, 6, 12], "py": [12, 4, 8], "pz": [0, 1, 0], "nx": [7, 4, 8], "ny": [4, 2, 4], "nz": [1, -1, -1] }, { "size": 5, "px": [7, 5, 6, 3, 17], "py": [13, 12, 3, 8, 13], "pz": [0, 0, 1, 1, 0], "nx": [3, 3, 0, 1, 8], "ny": [4, 5, 5, 10, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [16, 7, 16, 7, 7], "py": [1, 1, 2, 0, 0], "pz": [0, 1, 0, 1, -1], "nx": [23, 23, 23, 11, 5], "ny": [2, 14, 1, 2, 1], "nz": [0, 0, 0, 1, 2] }, { "size": 3, "px": [9, 18, 16], "py": [7, 14, 2], "pz": [1, 0, -1], "nx": [8, 4, 9], "ny": [10, 2, 4], "nz": [1, 2, 1] }, { "size": 4, "px": [3, 16, 1, 22], "py": [7, 4, 5, 11], "pz": [1, -1, -1, -1], "nx": [3, 9, 4, 2], "ny": [4, 9, 7, 5], "nz": [1, 0, 1, 2] }, { "size": 5, "px": [4, 7, 8, 8, 9], "py": [0, 2, 2, 1, 1], "pz": [1, 0, 0, 0, 0], "nx": [0, 0, 1, 0, 0], "ny": [15, 16, 19, 0, 14], "nz": [0, 0, 0, 1, 0] }, { "size": 5, "px": [4, 4, 7, 8, 12], "py": [2, 5, 6, 7, 10], "pz": [2, 2, 1, 1, 0], "nx": [8, 5, 10, 0, 0], "ny": [4, 2, 5, 3, 14], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [11, 0], "py": [13, 4], "pz": [0, -1], "nx": [3, 14], "ny": [4, 16], "nz": [1, 0] }, { "size": 5, "px": [17, 8, 18, 4, 4], "py": [3, 1, 3, 0, 0], "pz": [0, 1, 0, 2, -1], "nx": [21, 22, 5, 11, 22], "ny": [0, 1, 0, 1, 2], "nz": [0, 0, 2, 1, 0] }, { "size": 4, "px": [7, 8, 2, 11], "py": [13, 12, 2, 7], "pz": [0, 0, 2, 0], "nx": [4, 0, 23, 3], "ny": [4, 1, 1, 11], "nz": [1, -1, -1, -1] }, { "size": 5, "px": [4, 18, 8, 9, 15], "py": [4, 16, 7, 7, 23], "pz": [2, 0, 1, 1, 0], "nx": [0, 1, 1, 1, 1], "ny": [10, 21, 23, 22, 22], "nz": [1, 0, 0, 0, -1] }], "alpha": [-1.956565e+00, 1.956565e+00, -1.262438e+00, 1.262438e+00, -1.056941e+00, 1.056941e+00, -9.712509e-01, 9.712509e-01, -8.261028e-01, 8.261028e-01, -8.456506e-01, 8.456506e-01, -6.652113e-01, 6.652113e-01, -6.026287e-01, 6.026287e-01, -6.915425e-01, 6.915425e-01, -5.539286e-01, 5.539286e-01, -5.515072e-01, 5.515072e-01, -6.685884e-01, 6.685884e-01, -4.656070e-01, 4.656070e-01] }, { "count": 20, "threshold": -5.606853e+00, "feature": [{ "size": 5, "px": [17, 11, 6, 14, 9], "py": [13, 4, 4, 3, 3], "pz": [0, 0, 1, 0, 0], "nx": [14, 4, 8, 7, 8], "ny": [8, 4, 4, 4, 8], "nz": [0, 1, 1, 1, 0] }, { "size": 5, "px": [3, 9, 10, 11, 11], "py": [7, 2, 2, 3, 3], "pz": [1, 0, 0, 0, -1], "nx": [3, 8, 4, 2, 5], "ny": [4, 4, 10, 2, 8], "nz": [1, 1, 1, 2, 1] }, { "size": 5, "px": [12, 12, 12, 5, 12], "py": [12, 9, 10, 12, 11], "pz": [0, 0, 0, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [2, 1, 3, 0, 0], "nz": [0, 0, 0, 0, -1] }, { "size": 5, "px": [9, 18, 9, 9, 12], "py": [7, 14, 19, 5, 11], "pz": [1, -1, -1, -1, -1], "nx": [23, 4, 23, 23, 8], "ny": [13, 5, 14, 16, 4], "nz": [0, 2, 0, 0, 1] }, { "size": 5, "px": [12, 12, 12, 6, 1], "py": [13, 11, 12, 6, 5], "pz": [0, 0, 0, -1, -1], "nx": [4, 6, 8, 4, 9], "ny": [2, 8, 4, 4, 4], "nz": [2, 1, 1, 1, 1] }, { "size": 4, "px": [12, 11, 11, 6], "py": [5, 5, 6, 13], "pz": [0, 0, 0, 0], "nx": [8, 3, 2, 8], "ny": [4, 4, 17, 2], "nz": [1, 1, -1, -1] }, { "size": 5, "px": [3, 14, 12, 15, 13], "py": [0, 2, 2, 2, 2], "pz": [2, 0, 0, 0, 0], "nx": [22, 23, 22, 23, 7], "ny": [0, 3, 1, 2, 4], "nz": [0, 0, 0, 0, 1] }, { "size": 5, "px": [16, 15, 18, 19, 9], "py": [12, 11, 12, 12, 9], "pz": [0, 0, 0, 0, 1], "nx": [8, 2, 22, 23, 21], "ny": [4, 1, 1, 2, 20], "nz": [1, -1, -1, -1, -1] }, { "size": 3, "px": [4, 7, 7], "py": [0, 2, 2], "pz": [1, 0, -1], "nx": [1, 2, 2], "ny": [2, 0, 2], "nz": [1, 0, 0] }, { "size": 3, "px": [4, 11, 11], "py": [6, 9, 8], "pz": [1, 0, 0], "nx": [9, 2, 8], "ny": [9, 4, 5], "nz": [0, -1, -1] }, { "size": 4, "px": [2, 7, 6, 6], "py": [4, 23, 21, 22], "pz": [2, 0, 0, 0], "nx": [9, 3, 8, 17], "ny": [21, 2, 5, 1], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [2, 8], "py": [4, 12], "pz": [2, 0], "nx": [3, 0], "ny": [4, 4], "nz": [1, -1] }, { "size": 5, "px": [4, 5, 1, 8, 4], "py": [15, 12, 3, 23, 12], "pz": [0, 0, 2, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [23, 10, 22, 21, 11], "nz": [0, 1, 0, 0, -1] }, { "size": 2, "px": [21, 5], "py": [13, 4], "pz": [0, 2], "nx": [23, 4], "ny": [23, 5], "nz": [0, -1] }, { "size": 2, "px": [15, 17], "py": [2, 3], "pz": [0, 0], "nx": [19, 20], "ny": [2, 1], "nz": [0, 0] }, { "size": 5, "px": [12, 1, 8, 17, 4], "py": [14, 2, 13, 6, 12], "pz": [0, -1, -1, -1, -1], "nx": [8, 13, 15, 15, 7], "ny": [10, 9, 15, 14, 8], "nz": [1, 0, 0, 0, 1] }, { "size": 2, "px": [8, 5], "py": [7, 4], "pz": [1, -1], "nx": [4, 13], "ny": [2, 21], "nz": [2, 0] }, { "size": 2, "px": [3, 4], "py": [7, 0], "pz": [1, -1], "nx": [4, 2], "ny": [7, 5], "nz": [1, 2] }, { "size": 4, "px": [4, 14, 3, 11], "py": [3, 23, 2, 5], "pz": [2, 0, 2, 0], "nx": [7, 8, 2, 16], "ny": [8, 0, 1, 15], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [9, 8], "py": [0, 0], "pz": [0, 0], "nx": [2, 2], "ny": [3, 5], "nz": [2, 2] }], "alpha": [-1.957970e+00, 1.957970e+00, -1.225984e+00, 1.225984e+00, -8.310246e-01, 8.310246e-01, -8.315741e-01, 8.315741e-01, -7.973616e-01, 7.973616e-01, -7.661959e-01, 7.661959e-01, -6.042118e-01, 6.042118e-01, -6.506833e-01, 6.506833e-01, -4.808219e-01, 4.808219e-01, -6.079504e-01, 6.079504e-01, -5.163994e-01, 5.163994e-01, -5.268142e-01, 5.268142e-01, -4.935685e-01, 4.935685e-01, -4.427544e-01, 4.427544e-01, -4.053949e-01, 4.053949e-01, -4.701274e-01, 4.701274e-01, -4.387648e-01, 4.387648e-01, -4.305499e-01, 4.305499e-01, -4.042607e-01, 4.042607e-01, -4.372088e-01, 4.372088e-01] }, { "count": 22, "threshold": -5.679317e+00, "feature": [{ "size": 5, "px": [11, 3, 17, 14, 13], "py": [4, 0, 13, 2, 3], "pz": [0, 2, 0, 0, 0], "nx": [7, 4, 14, 23, 11], "ny": [8, 4, 8, 4, 0], "nz": [1, 1, 0, 0, 1] }, { "size": 5, "px": [7, 12, 6, 12, 12], "py": [12, 8, 3, 10, 9], "pz": [0, 0, 1, 0, 0], "nx": [4, 9, 8, 15, 15], "ny": [4, 8, 4, 8, 8], "nz": [1, 0, 1, 0, -1] }, { "size": 3, "px": [4, 2, 10], "py": [1, 4, 1], "pz": [1, 2, 0], "nx": [2, 3, 8], "ny": [5, 4, 4], "nz": [2, 1, -1] }, { "size": 5, "px": [3, 17, 6, 6, 16], "py": [2, 12, 4, 14, 12], "pz": [2, 0, 1, 0, 0], "nx": [8, 3, 7, 5, 15], "ny": [4, 4, 4, 4, 8], "nz": [1, 1, -1, -1, -1] }, { "size": 5, "px": [5, 6, 7, 4, 8], "py": [3, 3, 3, 1, 3], "pz": [0, 0, 0, 1, 0], "nx": [0, 0, 0, 0, 1], "ny": [5, 4, 3, 2, 0], "nz": [0, 0, 0, 0, 0] }, { "size": 3, "px": [18, 9, 0], "py": [14, 7, 0], "pz": [0, 1, -1], "nx": [8, 14, 8], "ny": [10, 9, 4], "nz": [1, 0, 1] }, { "size": 2, "px": [9, 5], "py": [18, 13], "pz": [0, 0], "nx": [10, 3], "ny": [16, 4], "nz": [0, -1] }, { "size": 5, "px": [11, 11, 11, 11, 6], "py": [10, 12, 11, 13, 6], "pz": [0, 0, 0, 0, -1], "nx": [5, 21, 22, 22, 22], "ny": [4, 22, 17, 19, 18], "nz": [2, 0, 0, 0, 0] }, { "size": 4, "px": [8, 9, 15, 4], "py": [7, 7, 23, 4], "pz": [1, 1, 0, 2], "nx": [8, 5, 0, 3], "ny": [4, 18, 4, 9], "nz": [1, -1, -1, -1] }, { "size": 5, "px": [11, 10, 12, 11, 11], "py": [4, 4, 4, 5, 5], "pz": [0, 0, 0, 0, -1], "nx": [4, 6, 8, 2, 8], "ny": [4, 9, 9, 2, 4], "nz": [1, 1, 0, 2, 1] }, { "size": 5, "px": [2, 2, 3, 3, 4], "py": [10, 9, 14, 13, 15], "pz": [1, 1, 0, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [5, 9, 10, 19, 18], "nz": [2, 1, 1, 0, -1] }, { "size": 2, "px": [11, 11], "py": [13, 12], "pz": [0, 0], "nx": [9, 2], "ny": [15, 2], "nz": [0, -1] }, { "size": 5, "px": [2, 4, 3, 3, 4], "py": [5, 11, 6, 9, 12], "pz": [1, 0, 1, 0, 0], "nx": [6, 2, 11, 11, 0], "ny": [9, 1, 5, 20, 18], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [18, 9, 17, 19, 16], "py": [2, 0, 2, 2, 1], "pz": [0, 1, 0, 0, 0], "nx": [22, 23, 11, 23, 23], "ny": [0, 2, 0, 1, 1], "nz": [0, 0, 1, 0, -1] }, { "size": 5, "px": [5, 5, 6, 7, 6], "py": [17, 16, 15, 23, 22], "pz": [0, 0, 0, 0, 0], "nx": [7, 6, 2, 5, 23], "ny": [8, 1, 2, 3, 1], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [12, 12, 11, 10, 6], "py": [14, 13, 18, 4, 22], "pz": [0, -1, -1, -1, -1], "nx": [3, 2, 4, 1, 2], "ny": [19, 4, 23, 13, 16], "nz": [0, 0, 0, 0, 0] }, { "size": 4, "px": [11, 16, 11, 17], "py": [7, 11, 8, 12], "pz": [0, 0, 0, 0], "nx": [7, 14, 10, 4], "ny": [4, 7, 10, 4], "nz": [1, 0, -1, -1] }, { "size": 2, "px": [3, 3], "py": [8, 7], "pz": [1, 1], "nx": [4, 2], "ny": [10, 2], "nz": [1, -1] }, { "size": 2, "px": [3, 9], "py": [0, 1], "pz": [1, 0], "nx": [4, 5], "ny": [1, 0], "nz": [0, 0] }, { "size": 2, "px": [14, 16], "py": [3, 3], "pz": [0, 0], "nx": [9, 14], "ny": [4, 21], "nz": [1, 0] }, { "size": 2, "px": [9, 1], "py": [7, 1], "pz": [1, -1], "nx": [8, 9], "ny": [7, 4], "nz": [1, 1] }, { "size": 2, "px": [1, 0], "py": [8, 3], "pz": [0, 2], "nx": [20, 0], "ny": [3, 3], "nz": [0, -1] }], "alpha": [-1.581077e+00, 1.581077e+00, -1.389689e+00, 1.389689e+00, -8.733094e-01, 8.733094e-01, -8.525177e-01, 8.525177e-01, -7.416304e-01, 7.416304e-01, -6.609002e-01, 6.609002e-01, -7.119043e-01, 7.119043e-01, -6.204438e-01, 6.204438e-01, -6.638519e-01, 6.638519e-01, -5.518876e-01, 5.518876e-01, -4.898991e-01, 4.898991e-01, -5.508243e-01, 5.508243e-01, -4.635525e-01, 4.635525e-01, -5.163159e-01, 5.163159e-01, -4.495338e-01, 4.495338e-01, -4.515036e-01, 4.515036e-01, -5.130473e-01, 5.130473e-01, -4.694233e-01, 4.694233e-01, -4.022514e-01, 4.022514e-01, -4.055690e-01, 4.055690e-01, -4.151817e-01, 4.151817e-01, -3.352302e-01, 3.352302e-01] }, { "count": 32, "threshold": -5.363782e+00, "feature": [{ "size": 5, "px": [12, 9, 6, 8, 14], "py": [4, 2, 13, 3, 3], "pz": [0, 0, 0, 0, 0], "nx": [0, 15, 0, 9, 5], "ny": [2, 7, 3, 8, 8], "nz": [0, 0, 0, 0, 1] }, { "size": 5, "px": [13, 16, 3, 6, 11], "py": [3, 13, 1, 4, 3], "pz": [0, 0, 2, 1, 0], "nx": [7, 4, 8, 14, 14], "ny": [4, 4, 4, 8, 8], "nz": [1, 1, 1, 0, -1] }, { "size": 5, "px": [10, 19, 18, 19, 19], "py": [6, 13, 13, 12, 12], "pz": [1, 0, 0, 0, -1], "nx": [23, 5, 23, 23, 11], "ny": [12, 2, 13, 14, 8], "nz": [0, 2, 0, 0, 1] }, { "size": 5, "px": [12, 12, 12, 12, 6], "py": [11, 13, 12, 10, 6], "pz": [0, 0, 0, 0, 1], "nx": [6, 8, 3, 9, 9], "ny": [8, 4, 4, 4, 4], "nz": [1, 1, 1, 1, -1] }, { "size": 5, "px": [5, 3, 5, 8, 11], "py": [12, 8, 3, 11, 8], "pz": [0, 1, 1, 0, 0], "nx": [4, 0, 1, 1, 9], "ny": [4, 3, 4, 3, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [13, 3, 12, 14, 12], "py": [1, 0, 1, 2, 3], "pz": [0, 2, 0, 0, 0], "nx": [7, 9, 8, 4, 4], "ny": [5, 4, 10, 2, 2], "nz": [1, 1, 1, 2, -1] }, { "size": 5, "px": [18, 16, 12, 15, 8], "py": [12, 23, 7, 11, 8], "pz": [0, 0, 0, 0, 1], "nx": [8, 6, 10, 12, 4], "ny": [4, 4, 10, 6, 3], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [4, 4, 5, 2, 2], "py": [13, 14, 14, 7, 7], "pz": [0, 0, 0, 1, -1], "nx": [0, 0, 0, 0, 1], "ny": [15, 4, 14, 13, 17], "nz": [0, 2, 0, 0, 0] }, { "size": 2, "px": [9, 9], "py": [7, 7], "pz": [1, -1], "nx": [4, 7], "ny": [5, 8], "nz": [2, 1] }, { "size": 5, "px": [3, 4, 6, 5, 4], "py": [2, 2, 14, 6, 9], "pz": [1, 1, 0, 1, 1], "nx": [23, 23, 23, 23, 11], "ny": [0, 3, 2, 1, 0], "nz": [0, 0, 0, 0, -1] }, { "size": 3, "px": [10, 2, 3], "py": [23, 4, 7], "pz": [0, 2, 1], "nx": [10, 21, 23], "ny": [21, 9, 2], "nz": [0, -1, -1] }, { "size": 5, "px": [20, 21, 21, 10, 12], "py": [13, 12, 8, 8, 12], "pz": [0, 0, 0, 1, 0], "nx": [8, 16, 3, 3, 11], "ny": [4, 8, 4, 3, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [2, 21], "py": [4, 12], "pz": [2, -1], "nx": [2, 3], "ny": [5, 4], "nz": [2, 1] }, { "size": 5, "px": [8, 5, 6, 8, 7], "py": [0, 2, 1, 1, 1], "pz": [0, 0, 0, 0, 0], "nx": [3, 2, 2, 2, 2], "ny": [0, 0, 1, 2, 2], "nz": [0, 0, 0, 0, -1] }, { "size": 5, "px": [11, 2, 2, 11, 10], "py": [10, 12, 8, 11, 12], "pz": [0, 0, 0, 0, 0], "nx": [3, 5, 2, 4, 2], "ny": [4, 1, 4, 2, 2], "nz": [1, -1, -1, -1, -1] }, { "size": 4, "px": [15, 16, 8, 17], "py": [2, 1, 0, 2], "pz": [0, 0, 1, 0], "nx": [19, 20, 0, 8], "ny": [1, 2, 11, 10], "nz": [0, 0, -1, -1] }, { "size": 2, "px": [17, 16], "py": [12, 12], "pz": [0, 0], "nx": [8, 9], "ny": [5, 1], "nz": [1, -1] }, { "size": 4, "px": [11, 11, 0, 0], "py": [12, 13, 0, 0], "pz": [0, 0, -1, -1], "nx": [10, 10, 9, 10], "ny": [10, 12, 13, 11], "nz": [0, 0, 0, 0] }, { "size": 3, "px": [11, 10, 8], "py": [5, 2, 6], "pz": [0, -1, -1], "nx": [8, 12, 4], "ny": [4, 17, 4], "nz": [1, 0, 1] }, { "size": 5, "px": [10, 21, 10, 20, 20], "py": [11, 13, 7, 13, 14], "pz": [1, 0, 1, 0, 0], "nx": [23, 23, 11, 23, 17], "ny": [23, 22, 11, 21, 21], "nz": [0, 0, 1, -1, -1] }, { "size": 2, "px": [4, 7], "py": [3, 9], "pz": [2, 1], "nx": [9, 23], "ny": [4, 22], "nz": [1, -1] }, { "size": 4, "px": [3, 2, 2, 5], "py": [11, 5, 4, 20], "pz": [1, 2, 2, 0], "nx": [4, 23, 11, 23], "ny": [10, 22, 11, 21], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [7, 5], "py": [13, 4], "pz": [0, -1], "nx": [4, 4], "ny": [8, 6], "nz": [1, 1] }, { "size": 2, "px": [2, 5], "py": [4, 9], "pz": [2, 1], "nx": [10, 10], "ny": [16, 16], "nz": [0, -1] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [3, 0], "ny": [4, 0], "nz": [1, -1] }, { "size": 5, "px": [7, 3, 12, 13, 6], "py": [11, 5, 23, 23, 7], "pz": [1, 2, 0, 0, 1], "nx": [1, 0, 0, 0, 0], "ny": [23, 20, 19, 21, 21], "nz": [0, 0, 0, 0, -1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [10, 9, 6, 13, 13], "pz": [0, 0, 1, 0, -1], "nx": [8, 8, 4, 4, 9], "ny": [4, 11, 5, 4, 5], "nz": [1, 1, 2, 2, 1] }, { "size": 2, "px": [9, 18], "py": [8, 15], "pz": [1, 0], "nx": [15, 4], "ny": [15, 2], "nz": [0, -1] }, { "size": 2, "px": [5, 13], "py": [6, 17], "pz": [1, -1], "nx": [1, 2], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [19, 10, 20, 18, 18], "py": [2, 0, 2, 2, 2], "pz": [0, 1, 0, 0, -1], "nx": [22, 23, 22, 11, 23], "ny": [1, 3, 0, 1, 2], "nz": [0, 0, 0, 1, 0] }, { "size": 5, "px": [4, 2, 2, 2, 6], "py": [7, 2, 5, 4, 14], "pz": [1, 2, 2, 2, 0], "nx": [16, 7, 9, 15, 23], "ny": [8, 0, 3, 11, 2], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [10, 10, 9, 9, 5], "py": [2, 0, 0, 1, 0], "pz": [0, 0, 0, 0, 1], "nx": [3, 2, 3, 2, 2], "ny": [11, 3, 9, 5, 5], "nz": [1, 2, 1, 2, -1] }], "alpha": [-1.490426e+00, 1.490426e+00, -1.214280e+00, 1.214280e+00, -8.124863e-01, 8.124863e-01, -7.307594e-01, 7.307594e-01, -7.377259e-01, 7.377259e-01, -5.982859e-01, 5.982859e-01, -6.451736e-01, 6.451736e-01, -6.117417e-01, 6.117417e-01, -5.438949e-01, 5.438949e-01, -4.563701e-01, 4.563701e-01, -4.975362e-01, 4.975362e-01, -4.707373e-01, 4.707373e-01, -5.013868e-01, 5.013868e-01, -5.139018e-01, 5.139018e-01, -4.728007e-01, 4.728007e-01, -4.839748e-01, 4.839748e-01, -4.852528e-01, 4.852528e-01, -5.768956e-01, 5.768956e-01, -3.635091e-01, 3.635091e-01, -4.190090e-01, 4.190090e-01, -3.854715e-01, 3.854715e-01, -3.409591e-01, 3.409591e-01, -3.440222e-01, 3.440222e-01, -3.375895e-01, 3.375895e-01, -3.367032e-01, 3.367032e-01, -3.708106e-01, 3.708106e-01, -3.260956e-01, 3.260956e-01, -3.657681e-01, 3.657681e-01, -3.518800e-01, 3.518800e-01, -3.845758e-01, 3.845758e-01, -2.832236e-01, 2.832236e-01, -2.865156e-01, 2.865156e-01] }, { "count": 45, "threshold": -5.479836e+00, "feature": [{ "size": 5, "px": [15, 6, 17, 6, 9], "py": [2, 13, 13, 4, 3], "pz": [0, 0, 0, 1, 0], "nx": [3, 9, 4, 8, 14], "ny": [5, 8, 4, 4, 8], "nz": [2, 0, 1, 1, 0] }, { "size": 5, "px": [9, 8, 11, 6, 7], "py": [1, 2, 3, 14, 2], "pz": [0, 0, 0, 0, 0], "nx": [0, 0, 4, 0, 0], "ny": [4, 2, 4, 1, 0], "nz": [0, 0, 1, 0, 0] }, { "size": 5, "px": [2, 2, 11, 11, 11], "py": [2, 4, 10, 8, 6], "pz": [2, 2, 0, 0, 0], "nx": [8, 4, 3, 23, 23], "ny": [4, 4, 4, 16, 18], "nz": [1, 1, -1, -1, -1] }, { "size": 5, "px": [18, 16, 17, 15, 9], "py": [2, 2, 2, 2, 1], "pz": [0, 0, 0, 0, 1], "nx": [22, 22, 21, 23, 23], "ny": [1, 2, 0, 5, 4], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [15, 3, 17, 18, 6], "py": [11, 2, 11, 11, 4], "pz": [0, 2, 0, 0, 1], "nx": [3, 8, 1, 4, 23], "ny": [4, 4, 3, 9, 4], "nz": [1, 1, -1, -1, -1] }, { "size": 2, "px": [4, 5], "py": [4, 0], "pz": [2, -1], "nx": [7, 4], "ny": [8, 5], "nz": [1, 2] }, { "size": 2, "px": [11, 5], "py": [12, 5], "pz": [0, -1], "nx": [4, 9], "ny": [10, 15], "nz": [1, 0] }, { "size": 4, "px": [2, 2, 7, 1], "py": [7, 7, 3, 4], "pz": [1, -1, -1, -1], "nx": [0, 2, 1, 2], "ny": [6, 20, 14, 16], "nz": [1, 0, 0, 0] }, { "size": 5, "px": [14, 12, 12, 13, 9], "py": [23, 5, 6, 5, 7], "pz": [0, 0, 0, 0, 1], "nx": [8, 18, 2, 8, 14], "ny": [4, 9, 0, 12, 7], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [3, 10, 13, 11, 9], "py": [0, 3, 2, 3, 2], "pz": [2, 0, 0, 0, 0], "nx": [3, 11, 22, 22, 22], "ny": [2, 6, 15, 2, 0], "nz": [2, 1, 0, 0, 0] }, { "size": 5, "px": [8, 7, 5, 8, 5], "py": [23, 12, 12, 12, 13], "pz": [0, 0, 0, 0, 0], "nx": [3, 18, 3, 1, 22], "ny": [4, 4, 4, 2, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [22, 22, 22, 21, 22], "py": [9, 11, 10, 14, 12], "pz": [0, 0, 0, 0, 0], "nx": [23, 23, 11, 1, 22], "ny": [23, 23, 11, 2, 0], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [9, 3], "py": [18, 7], "pz": [0, 1], "nx": [10, 8], "ny": [16, 19], "nz": [0, -1] }, { "size": 5, "px": [10, 12, 11, 6, 6], "py": [4, 4, 4, 2, 2], "pz": [0, 0, 0, 1, -1], "nx": [3, 8, 7, 8, 4], "ny": [5, 4, 4, 10, 4], "nz": [2, 1, 1, 0, 1] }, { "size": 4, "px": [12, 12, 4, 15], "py": [13, 12, 0, 11], "pz": [0, 0, -1, -1], "nx": [13, 14, 13, 14], "ny": [9, 12, 10, 13], "nz": [0, 0, 0, 0] }, { "size": 2, "px": [4, 4], "py": [3, 3], "pz": [2, -1], "nx": [9, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 3, "px": [9, 7, 0], "py": [7, 5, 5], "pz": [1, -1, -1], "nx": [4, 15, 9], "ny": [5, 14, 9], "nz": [2, 0, 1] }, { "size": 5, "px": [15, 20, 7, 10, 16], "py": [17, 12, 6, 4, 23], "pz": [0, 0, 1, 1, 0], "nx": [1, 2, 2, 1, 1], "ny": [3, 0, 1, 2, 2], "nz": [0, 0, 0, 0, -1] }, { "size": 5, "px": [2, 1, 1, 11, 2], "py": [16, 4, 5, 12, 14], "pz": [0, 1, 1, 0, 0], "nx": [4, 6, 3, 19, 1], "ny": [4, 2, 5, 19, 2], "nz": [1, -1, -1, -1, -1] }, { "size": 3, "px": [15, 14, 14], "py": [1, 1, 0], "pz": [0, 0, 0], "nx": [4, 8, 4], "ny": [3, 4, 2], "nz": [2, 1, 2] }, { "size": 5, "px": [2, 3, 1, 2, 7], "py": [8, 12, 4, 9, 13], "pz": [1, 0, 2, 1, 0], "nx": [1, 1, 0, 0, 0], "ny": [21, 20, 18, 17, 9], "nz": [0, 0, 0, 0, 1] }, { "size": 5, "px": [17, 15, 17, 16, 16], "py": [12, 12, 22, 23, 12], "pz": [0, 0, 0, 0, 0], "nx": [7, 3, 16, 1, 0], "ny": [8, 6, 8, 3, 9], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [9, 17, 18, 18, 18], "py": [6, 12, 12, 13, 13], "pz": [1, 0, 0, 0, -1], "nx": [23, 23, 20, 11, 11], "ny": [12, 13, 23, 7, 8], "nz": [0, 0, 0, 1, 1] }, { "size": 2, "px": [2, 4], "py": [4, 7], "pz": [2, 1], "nx": [4, 4], "ny": [10, 5], "nz": [1, -1] }, { "size": 4, "px": [4, 22, 19, 12], "py": [5, 8, 14, 9], "pz": [2, 0, 0, 0], "nx": [8, 4, 4, 2], "ny": [4, 4, 1, 2], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [3, 21], "py": [7, 14], "pz": [1, -1], "nx": [4, 2], "ny": [7, 2], "nz": [1, 2] }, { "size": 3, "px": [7, 4, 17], "py": [3, 1, 6], "pz": [0, 1, -1], "nx": [3, 4, 5], "ny": [0, 2, 1], "nz": [1, 0, 0] }, { "size": 4, "px": [15, 7, 14, 0], "py": [3, 1, 3, 7], "pz": [0, 1, 0, -1], "nx": [8, 18, 17, 18], "ny": [0, 1, 1, 2], "nz": [1, 0, 0, 0] }, { "size": 5, "px": [12, 12, 12, 12, 6], "py": [10, 11, 12, 13, 6], "pz": [0, 0, 0, 0, -1], "nx": [8, 15, 15, 4, 8], "ny": [10, 10, 9, 2, 4], "nz": [0, 0, 0, 2, 1] }, { "size": 2, "px": [17, 12], "py": [13, 11], "pz": [0, -1], "nx": [9, 8], "ny": [4, 10], "nz": [1, 1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [10, 9, 12, 11, 4], "pz": [0, 0, 0, 0, 1], "nx": [8, 9, 8, 9, 9], "ny": [10, 4, 4, 5, 5], "nz": [1, 1, 1, 1, -1] }, { "size": 3, "px": [7, 0, 1], "py": [1, 9, 8], "pz": [0, -1, -1], "nx": [4, 3, 3], "ny": [7, 15, 16], "nz": [0, 0, 0] }, { "size": 2, "px": [4, 7], "py": [15, 23], "pz": [0, 0], "nx": [9, 18], "ny": [21, 3], "nz": [0, -1] }, { "size": 5, "px": [17, 4, 19, 18, 8], "py": [12, 3, 12, 17, 6], "pz": [0, 2, 0, 0, 1], "nx": [23, 23, 11, 22, 16], "ny": [0, 1, 0, 21, -1], "nz": [0, 0, -1, -1, -1] }, { "size": 2, "px": [7, 4], "py": [13, 5], "pz": [0, -1], "nx": [4, 2], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [21, 20, 10, 10, 21], "py": [13, 14, 10, 7, 11], "pz": [0, 0, 1, 1, 0], "nx": [4, 4, 4, 5, 5], "ny": [18, 17, 19, 20, 20], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [2, 3], "py": [11, 13], "pz": [1, 0], "nx": [12, 4], "ny": [17, 17], "nz": [0, -1] }, { "size": 2, "px": [11, 5], "py": [13, 1], "pz": [0, -1], "nx": [1, 2], "ny": [1, 4], "nz": [2, 1] }, { "size": 2, "px": [15, 7], "py": [17, 7], "pz": [0, 1], "nx": [14, 4], "ny": [15, 3], "nz": [0, -1] }, { "size": 2, "px": [3, 11], "py": [3, 8], "pz": [2, 0], "nx": [13, 13], "ny": [9, 8], "nz": [0, 0] }, { "size": 2, "px": [8, 3], "py": [11, 2], "pz": [0, -1], "nx": [8, 4], "ny": [9, 5], "nz": [0, 1] }, { "size": 3, "px": [12, 6, 9], "py": [9, 10, 11], "pz": [0, -1, -1], "nx": [2, 1, 5], "ny": [2, 1, 6], "nz": [2, 2, 1] }, { "size": 4, "px": [4, 5, 5, 1], "py": [11, 11, 11, 3], "pz": [1, 0, 1, 2], "nx": [0, 0, 5, 4], "ny": [23, 22, 0, 0], "nz": [0, 0, -1, -1] }, { "size": 5, "px": [15, 7, 17, 15, 16], "py": [1, 0, 2, 2, 0], "pz": [0, 1, 0, 0, 0], "nx": [7, 4, 7, 4, 8], "ny": [5, 2, 4, 3, 4], "nz": [1, 2, 1, 2, -1] }, { "size": 2, "px": [6, 12], "py": [11, 23], "pz": [1, 0], "nx": [12, 4], "ny": [21, 2], "nz": [0, -1] }], "alpha": [-1.535800e+00, 1.535800e+00, -8.580514e-01, 8.580514e-01, -8.625210e-01, 8.625210e-01, -7.177500e-01, 7.177500e-01, -6.832222e-01, 6.832222e-01, -5.736298e-01, 5.736298e-01, -5.028217e-01, 5.028217e-01, -5.091788e-01, 5.091788e-01, -5.791940e-01, 5.791940e-01, -4.924942e-01, 4.924942e-01, -5.489055e-01, 5.489055e-01, -4.528190e-01, 4.528190e-01, -4.748324e-01, 4.748324e-01, -4.150403e-01, 4.150403e-01, -4.820464e-01, 4.820464e-01, -4.840212e-01, 4.840212e-01, -3.941872e-01, 3.941872e-01, -3.663507e-01, 3.663507e-01, -3.814835e-01, 3.814835e-01, -3.936426e-01, 3.936426e-01, -3.049970e-01, 3.049970e-01, -3.604256e-01, 3.604256e-01, -3.974041e-01, 3.974041e-01, -4.203486e-01, 4.203486e-01, -3.174435e-01, 3.174435e-01, -3.426336e-01, 3.426336e-01, -4.492150e-01, 4.492150e-01, -3.538784e-01, 3.538784e-01, -3.679703e-01, 3.679703e-01, -3.985452e-01, 3.985452e-01, -2.884028e-01, 2.884028e-01, -2.797264e-01, 2.797264e-01, -2.664214e-01, 2.664214e-01, -2.484857e-01, 2.484857e-01, -2.581492e-01, 2.581492e-01, -2.943778e-01, 2.943778e-01, -2.315507e-01, 2.315507e-01, -2.979337e-01, 2.979337e-01, -2.976173e-01, 2.976173e-01, -2.847965e-01, 2.847965e-01, -2.814763e-01, 2.814763e-01, -2.489068e-01, 2.489068e-01, -2.632427e-01, 2.632427e-01, -3.308292e-01, 3.308292e-01, -2.790170e-01, 2.790170e-01] }, { "count": 61, "threshold": -5.239104e+00, "feature": [{ "size": 5, "px": [8, 8, 11, 15, 6], "py": [3, 6, 5, 3, 4], "pz": [0, 1, 0, 0, 1], "nx": [3, 9, 14, 8, 4], "ny": [4, 8, 8, 7, 2], "nz": [1, 0, 0, 0, 2] }, { "size": 5, "px": [11, 12, 10, 6, 9], "py": [3, 3, 2, 13, 2], "pz": [0, 0, 0, 0, 0], "nx": [0, 0, 5, 2, 2], "ny": [13, 1, 8, 5, 2], "nz": [0, 1, 1, 2, 2] }, { "size": 5, "px": [11, 5, 11, 11, 4], "py": [9, 13, 10, 11, 6], "pz": [0, 0, 0, 0, 1], "nx": [4, 15, 9, 3, 3], "ny": [5, 8, 9, 4, 4], "nz": [1, 0, 0, 1, -1] }, { "size": 5, "px": [15, 16, 8, 17, 17], "py": [1, 2, 0, 2, 2], "pz": [0, 0, 1, 0, -1], "nx": [23, 23, 23, 23, 23], "ny": [4, 0, 2, 3, 1], "nz": [0, 0, 0, 0, 0] }, { "size": 4, "px": [9, 18, 17, 18], "py": [7, 13, 13, 14], "pz": [1, 0, 0, 0], "nx": [9, 7, 4, 8], "ny": [4, 10, 2, 4], "nz": [1, 1, 2, 1] }, { "size": 5, "px": [12, 11, 12, 12, 6], "py": [6, 5, 14, 5, 3], "pz": [0, 0, 0, 0, 1], "nx": [13, 8, 14, 7, 7], "ny": [16, 4, 7, 4, 4], "nz": [0, 1, 0, 1, -1] }, { "size": 5, "px": [12, 6, 3, 7, 12], "py": [7, 12, 7, 11, 8], "pz": [0, 0, 1, 0, 0], "nx": [16, 4, 4, 4, 7], "ny": [8, 4, 4, 4, 4], "nz": [0, 1, -1, -1, -1] }, { "size": 5, "px": [6, 4, 5, 3, 3], "py": [2, 3, 2, 0, 0], "pz": [0, 0, 0, 1, -1], "nx": [1, 0, 1, 0, 0], "ny": [0, 3, 1, 1, 2], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [15, 9], "py": [11, 6], "pz": [0, 1], "nx": [14, 5], "ny": [9, 11], "nz": [0, -1] }, { "size": 5, "px": [10, 19, 19, 10, 20], "py": [7, 20, 14, 6, 12], "pz": [1, 0, 0, 1, 0], "nx": [23, 22, 11, 23, 23], "ny": [21, 23, 9, 20, 20], "nz": [0, 0, 1, 0, -1] }, { "size": 5, "px": [1, 1, 5, 1, 1], "py": [8, 6, 6, 9, 4], "pz": [0, 1, 1, 0, 2], "nx": [3, 3, 3, 2, 5], "ny": [4, 4, 2, 5, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [13, 12, 3, 11, 11], "py": [2, 2, 0, 1, 2], "pz": [0, 0, 2, 0, 0], "nx": [3, 6, 8, 4, 3], "ny": [2, 9, 4, 4, 5], "nz": [2, 1, 1, 1, -1] }, { "size": 3, "px": [12, 12, 6], "py": [11, 12, 9], "pz": [0, 0, -1], "nx": [2, 1, 9], "ny": [6, 1, 14], "nz": [0, 2, 0] }, { "size": 5, "px": [6, 3, 17, 16, 16], "py": [4, 2, 14, 23, 13], "pz": [1, 2, 0, 0, 0], "nx": [8, 10, 21, 5, 1], "ny": [4, 10, 11, 0, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [5, 6, 1, 3, 3], "py": [15, 14, 4, 7, 7], "pz": [0, 0, 2, 1, -1], "nx": [1, 0, 0, 1, 1], "ny": [5, 8, 7, 18, 17], "nz": [2, 1, 1, 0, 0] }, { "size": 4, "px": [6, 12, 5, 3], "py": [6, 12, 2, 7], "pz": [1, -1, -1, -1], "nx": [14, 13, 13, 7], "ny": [12, 10, 9, 8], "nz": [0, 0, 0, 1] }, { "size": 2, "px": [3, 6], "py": [7, 15], "pz": [1, 0], "nx": [3, 3], "ny": [4, 2], "nz": [1, -1] }, { "size": 4, "px": [11, 10, 12, 2], "py": [18, 18, 18, 3], "pz": [0, 0, 0, 2], "nx": [11, 17, 4, 16], "ny": [16, 4, 4, 21], "nz": [0, -1, -1, -1] }, { "size": 5, "px": [9, 8, 8, 5, 2], "py": [4, 4, 4, 2, 3], "pz": [0, 0, -1, -1, -1], "nx": [2, 2, 4, 4, 2], "ny": [1, 2, 10, 5, 4], "nz": [2, 2, 1, 1, 2] }, { "size": 4, "px": [8, 18, 14, 18], "py": [7, 16, 23, 15], "pz": [1, 0, 0, 0], "nx": [14, 3, 1, 0], "ny": [21, 1, 9, 3], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [12, 3], "py": [9, 5], "pz": [0, 2], "nx": [8, 1], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [9, 9], "py": [1, 1], "pz": [1, -1], "nx": [19, 20], "ny": [1, 2], "nz": [0, 0] }, { "size": 3, "px": [10, 10, 10], "py": [6, 6, 8], "pz": [1, -1, -1], "nx": [22, 21, 22], "ny": [13, 18, 12], "nz": [0, 0, 0] }, { "size": 2, "px": [2, 2], "py": [4, 1], "pz": [2, -1], "nx": [2, 4], "ny": [5, 4], "nz": [2, 1] }, { "size": 5, "px": [21, 21, 21, 21, 21], "py": [19, 17, 18, 15, 16], "pz": [0, 0, 0, 0, 0], "nx": [11, 21, 6, 1, 21], "ny": [17, 1, 10, 0, 2], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [7, 3, 4, 4, 4], "py": [23, 13, 14, 16, 13], "pz": [0, 0, 0, 0, 0], "nx": [21, 22, 22, 22, 22], "ny": [23, 21, 20, 19, 19], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [11, 8], "py": [6, 6], "pz": [0, 1], "nx": [8, 4], "ny": [4, 2], "nz": [1, -1] }, { "size": 5, "px": [23, 23, 11, 23, 23], "py": [8, 12, 6, 11, 10], "pz": [0, 0, 1, 0, 0], "nx": [4, 4, 3, 8, 8], "ny": [3, 8, 4, 4, 4], "nz": [1, 1, 1, 1, -1] }, { "size": 5, "px": [8, 9, 4, 7, 10], "py": [2, 1, 0, 2, 1], "pz": [0, 0, 1, 0, 0], "nx": [5, 5, 6, 4, 4], "ny": [1, 0, 0, 2, 1], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [12, 2], "py": [13, 6], "pz": [0, -1], "nx": [15, 9], "ny": [15, 4], "nz": [0, 1] }, { "size": 2, "px": [2, 4], "py": [4, 9], "pz": [2, 1], "nx": [3, 13], "ny": [4, 1], "nz": [1, -1] }, { "size": 3, "px": [3, 6, 2], "py": [10, 22, 4], "pz": [1, 0, 2], "nx": [4, 2, 1], "ny": [10, 4, 3], "nz": [1, -1, -1] }, { "size": 2, "px": [1, 0], "py": [9, 7], "pz": [0, 1], "nx": [0, 0], "ny": [23, 22], "nz": [0, 0] }, { "size": 2, "px": [8, 7], "py": [0, 1], "pz": [0, 0], "nx": [4, 4], "ny": [8, 8], "nz": [1, -1] }, { "size": 5, "px": [7, 4, 4, 6, 3], "py": [8, 4, 5, 5, 3], "pz": [1, 2, 2, 1, 2], "nx": [1, 0, 2, 0, 0], "ny": [1, 0, 0, 2, 4], "nz": [0, 2, 0, 1, -1] }, { "size": 3, "px": [10, 4, 4], "py": [6, 1, 5], "pz": [1, -1, -1], "nx": [5, 23, 22], "ny": [4, 13, 7], "nz": [2, 0, 0] }, { "size": 2, "px": [2, 2], "py": [6, 5], "pz": [1, 1], "nx": [6, 0], "ny": [9, 2], "nz": [0, -1] }, { "size": 5, "px": [0, 1, 1, 0, 0], "py": [5, 18, 19, 16, 6], "pz": [2, 0, 0, 0, 1], "nx": [5, 9, 4, 8, 8], "ny": [8, 7, 3, 7, 7], "nz": [1, 0, 1, 0, -1] }, { "size": 2, "px": [13, 12], "py": [23, 23], "pz": [0, 0], "nx": [7, 6], "ny": [8, 10], "nz": [0, -1] }, { "size": 2, "px": [14, 19], "py": [12, 8], "pz": [0, 0], "nx": [18, 5], "ny": [8, 11], "nz": [0, -1] }, { "size": 5, "px": [2, 8, 6, 4, 4], "py": [3, 23, 14, 6, 9], "pz": [2, 0, 0, 1, 1], "nx": [0, 0, 0, 0, 1], "ny": [21, 20, 5, 19, 23], "nz": [0, 0, 2, 0, 0] }, { "size": 2, "px": [11, 22], "py": [4, 14], "pz": [0, -1], "nx": [3, 8], "ny": [1, 4], "nz": [2, 1] }, { "size": 5, "px": [1, 1, 0, 1, 1], "py": [6, 8, 3, 12, 7], "pz": [1, 1, 2, 0, 1], "nx": [21, 21, 19, 10, 10], "ny": [14, 16, 23, 9, 9], "nz": [0, 0, 0, 1, -1] }, { "size": 2, "px": [10, 3], "py": [23, 2], "pz": [0, 2], "nx": [10, 3], "ny": [21, 5], "nz": [0, -1] }, { "size": 2, "px": [9, 9], "py": [7, 0], "pz": [1, -1], "nx": [9, 9], "ny": [11, 10], "nz": [1, 1] }, { "size": 5, "px": [23, 11, 23, 23, 23], "py": [18, 10, 19, 20, 16], "pz": [0, 1, 0, 0, 0], "nx": [3, 3, 2, 3, 2], "ny": [15, 16, 10, 17, 9], "nz": [0, 0, 1, 0, -1] }, { "size": 2, "px": [9, 14], "py": [7, 18], "pz": [1, 0], "nx": [7, 10], "ny": [8, 8], "nz": [1, -1] }, { "size": 2, "px": [12, 5], "py": [6, 4], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [4, 5], "py": [13, 4], "pz": [0, -1], "nx": [4, 4], "ny": [17, 19], "nz": [0, 0] }, { "size": 3, "px": [2, 3, 3], "py": [11, 17, 19], "pz": [1, 0, 0], "nx": [7, 7, 4], "ny": [8, 8, 5], "nz": [1, -1, -1] }, { "size": 2, "px": [6, 6], "py": [6, 5], "pz": [1, -1], "nx": [2, 9], "ny": [4, 12], "nz": [1, 0] }, { "size": 5, "px": [8, 8, 9, 2, 2], "py": [18, 13, 12, 3, 3], "pz": [0, 0, 0, 2, -1], "nx": [23, 11, 23, 11, 11], "ny": [13, 6, 14, 7, 8], "nz": [0, 1, 0, 1, 1] }, { "size": 2, "px": [9, 11], "py": [6, 13], "pz": [1, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [8, 10], "py": [0, 6], "pz": [1, 1], "nx": [9, 4], "ny": [6, 7], "nz": [1, -1] }, { "size": 3, "px": [3, 10, 9], "py": [8, 6, 0], "pz": [1, -1, -1], "nx": [2, 2, 2], "ny": [15, 16, 9], "nz": [0, 0, 1] }, { "size": 3, "px": [14, 15, 0], "py": [2, 2, 5], "pz": [0, 0, -1], "nx": [17, 17, 18], "ny": [0, 1, 2], "nz": [0, 0, 0] }, { "size": 2, "px": [11, 5], "py": [14, 1], "pz": [0, -1], "nx": [10, 9], "ny": [12, 14], "nz": [0, 0] }, { "size": 2, "px": [8, 8], "py": [7, 8], "pz": [1, 1], "nx": [8, 4], "ny": [4, 4], "nz": [1, -1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [19, 18, 10, 5, 20], "pz": [0, 0, 1, 2, 0], "nx": [4, 8, 2, 4, 4], "ny": [4, 15, 5, 10, 10], "nz": [1, 0, 2, 1, -1] }, { "size": 2, "px": [7, 0], "py": [13, 18], "pz": [0, -1], "nx": [4, 3], "ny": [4, 4], "nz": [1, 1] }, { "size": 5, "px": [23, 22, 22, 11, 22], "py": [16, 13, 7, 6, 14], "pz": [0, 0, 0, 1, 0], "nx": [13, 7, 15, 14, 14], "ny": [6, 3, 7, 6, 6], "nz": [0, 1, 0, 0, -1] }], "alpha": [-1.428861e+00, 1.428861e+00, -8.591837e-01, 8.591837e-01, -7.734305e-01, 7.734305e-01, -6.534460e-01, 6.534460e-01, -6.262547e-01, 6.262547e-01, -5.231782e-01, 5.231782e-01, -4.984303e-01, 4.984303e-01, -4.913187e-01, 4.913187e-01, -4.852198e-01, 4.852198e-01, -4.906681e-01, 4.906681e-01, -4.126248e-01, 4.126248e-01, -4.590814e-01, 4.590814e-01, -4.653825e-01, 4.653825e-01, -4.179600e-01, 4.179600e-01, -4.357392e-01, 4.357392e-01, -4.087982e-01, 4.087982e-01, -4.594812e-01, 4.594812e-01, -4.858794e-01, 4.858794e-01, -3.713580e-01, 3.713580e-01, -3.894534e-01, 3.894534e-01, -3.127168e-01, 3.127168e-01, -4.012654e-01, 4.012654e-01, -3.370552e-01, 3.370552e-01, -3.534712e-01, 3.534712e-01, -3.843450e-01, 3.843450e-01, -2.688805e-01, 2.688805e-01, -3.500203e-01, 3.500203e-01, -2.827120e-01, 2.827120e-01, -3.742119e-01, 3.742119e-01, -3.219074e-01, 3.219074e-01, -2.544953e-01, 2.544953e-01, -3.355513e-01, 3.355513e-01, -2.672670e-01, 2.672670e-01, -2.932047e-01, 2.932047e-01, -2.404618e-01, 2.404618e-01, -2.354372e-01, 2.354372e-01, -2.657955e-01, 2.657955e-01, -2.293701e-01, 2.293701e-01, -2.708918e-01, 2.708918e-01, -2.340181e-01, 2.340181e-01, -2.464815e-01, 2.464815e-01, -2.944239e-01, 2.944239e-01, -2.407960e-01, 2.407960e-01, -3.029642e-01, 3.029642e-01, -2.684602e-01, 2.684602e-01, -2.495078e-01, 2.495078e-01, -2.539708e-01, 2.539708e-01, -2.989293e-01, 2.989293e-01, -2.391309e-01, 2.391309e-01, -2.531372e-01, 2.531372e-01, -2.500390e-01, 2.500390e-01, -2.295077e-01, 2.295077e-01, -2.526125e-01, 2.526125e-01, -2.337182e-01, 2.337182e-01, -1.984756e-01, 1.984756e-01, -3.089996e-01, 3.089996e-01, -2.589053e-01, 2.589053e-01, -2.962490e-01, 2.962490e-01, -2.458660e-01, 2.458660e-01, -2.515206e-01, 2.515206e-01, -2.637299e-01, 2.637299e-01] }, { "count": 80, "threshold": -5.185898e+00, "feature": [{ "size": 5, "px": [12, 17, 13, 10, 15], "py": [9, 13, 3, 3, 2], "pz": [0, 0, 0, 0, 0], "nx": [8, 14, 6, 9, 4], "ny": [10, 9, 8, 8, 2], "nz": [1, 0, 1, 0, 2] }, { "size": 5, "px": [3, 11, 8, 10, 9], "py": [7, 4, 3, 3, 3], "pz": [1, 0, 0, 0, 0], "nx": [2, 1, 5, 0, 0], "ny": [2, 15, 8, 4, 13], "nz": [2, 0, 1, 0, 0] }, { "size": 5, "px": [11, 11, 11, 4, 17], "py": [7, 9, 8, 6, 11], "pz": [0, 0, 0, 1, 0], "nx": [8, 8, 8, 3, 0], "ny": [4, 8, 8, 8, 13], "nz": [1, 0, -1, -1, -1] }, { "size": 5, "px": [14, 15, 7, 16, 16], "py": [3, 3, 1, 3, 3], "pz": [0, 0, 1, 0, -1], "nx": [23, 22, 23, 22, 22], "ny": [6, 2, 14, 3, 4], "nz": [0, 0, 0, 0, 0] }, { "size": 4, "px": [6, 4, 7, 15], "py": [4, 2, 6, 17], "pz": [1, 2, 1, 0], "nx": [3, 8, 3, 14], "ny": [4, 4, 10, 22], "nz": [1, 1, -1, -1] }, { "size": 3, "px": [3, 5, 22], "py": [7, 7, 5], "pz": [1, -1, -1], "nx": [2, 2, 4], "ny": [5, 2, 7], "nz": [2, 2, 1] }, { "size": 5, "px": [7, 6, 5, 6, 3], "py": [0, 1, 2, 2, 0], "pz": [0, 0, 0, 0, 1], "nx": [0, 1, 1, 0, 1], "ny": [0, 2, 1, 2, 0], "nz": [2, 0, 0, 1, 0] }, { "size": 5, "px": [11, 11, 11, 11, 5], "py": [11, 10, 13, 12, 6], "pz": [0, 0, 0, 0, -1], "nx": [15, 14, 5, 2, 8], "ny": [9, 8, 10, 2, 10], "nz": [0, 0, 1, 2, 0] }, { "size": 5, "px": [8, 5, 6, 8, 7], "py": [12, 12, 12, 23, 12], "pz": [0, 0, 0, 0, 0], "nx": [3, 17, 5, 2, 8], "ny": [4, 0, 10, 2, 10], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [10, 10, 10, 19, 20], "py": [8, 10, 9, 15, 13], "pz": [1, 1, 1, 0, 0], "nx": [23, 11, 5, 23, 23], "ny": [20, 10, 5, 19, 19], "nz": [0, 1, 2, 0, -1] }, { "size": 5, "px": [9, 13, 3, 10, 12], "py": [2, 0, 0, 1, 1], "pz": [0, 0, 2, 0, 0], "nx": [3, 3, 6, 7, 7], "ny": [5, 2, 11, 4, 4], "nz": [2, 2, 1, 1, -1] }, { "size": 2, "px": [15, 7], "py": [17, 6], "pz": [0, 1], "nx": [14, 0], "ny": [16, 10], "nz": [0, -1] }, { "size": 5, "px": [17, 15, 18, 12, 19], "py": [22, 12, 13, 7, 15], "pz": [0, 0, 0, 0, 0], "nx": [8, 15, 6, 1, 7], "ny": [4, 8, 22, 5, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [10, 9, 18, 19, 8], "py": [2, 1, 3, 3, 1], "pz": [1, 1, 0, 0, 1], "nx": [23, 23, 23, 11, 11], "ny": [0, 1, 2, 0, 1], "nz": [0, 0, 0, 1, -1] }, { "size": 5, "px": [12, 23, 0, 1, 8], "py": [14, 5, 0, 17, 1], "pz": [0, -1, -1, -1, -1], "nx": [8, 14, 15, 18, 14], "ny": [10, 11, 14, 19, 10], "nz": [1, 0, 0, 0, 0] }, { "size": 2, "px": [4, 6], "py": [6, 13], "pz": [1, 0], "nx": [4, 12], "ny": [10, 14], "nz": [1, -1] }, { "size": 5, "px": [5, 23, 11, 23, 13], "py": [3, 10, 4, 11, 12], "pz": [2, 0, 1, 0, 0], "nx": [7, 4, 9, 8, 8], "ny": [4, 2, 4, 4, 4], "nz": [1, 2, 1, 1, -1] }, { "size": 3, "px": [9, 5, 11], "py": [4, 2, 4], "pz": [0, 1, -1], "nx": [5, 2, 4], "ny": [0, 1, 2], "nz": [0, 2, 0] }, { "size": 5, "px": [5, 2, 2, 5, 8], "py": [12, 4, 4, 6, 13], "pz": [0, 2, 1, 1, 0], "nx": [3, 9, 4, 4, 8], "ny": [4, 0, 2, 2, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 3, "px": [9, 5, 22], "py": [7, 4, 20], "pz": [1, -1, -1], "nx": [8, 19, 4], "ny": [4, 18, 5], "nz": [1, 0, 2] }, { "size": 5, "px": [2, 3, 3, 3, 3], "py": [10, 16, 15, 14, 13], "pz": [1, 0, 0, 0, 0], "nx": [0, 0, 0, 1, 0], "ny": [10, 20, 5, 23, 21], "nz": [1, 0, 2, 0, 0] }, { "size": 2, "px": [12, 11], "py": [4, 18], "pz": [0, 0], "nx": [11, 23], "ny": [17, 13], "nz": [0, -1] }, { "size": 2, "px": [17, 8], "py": [16, 7], "pz": [0, 1], "nx": [8, 3], "ny": [4, 6], "nz": [1, -1] }, { "size": 5, "px": [13, 5, 14, 12, 3], "py": [4, 7, 4, 5, 3], "pz": [0, 1, 0, 0, 1], "nx": [21, 20, 21, 21, 21], "ny": [2, 0, 4, 3, 3], "nz": [0, 0, 0, 0, -1] }, { "size": 4, "px": [20, 20, 20, 10], "py": [21, 19, 20, 8], "pz": [0, 0, 0, 1], "nx": [8, 11, 0, 2], "ny": [10, 8, 1, 3], "nz": [1, -1, -1, -1] }, { "size": 4, "px": [6, 7, 12, 8], "py": [12, 12, 8, 11], "pz": [0, 0, 0, 0], "nx": [9, 5, 5, 18], "ny": [9, 2, 0, 20], "nz": [0, -1, -1, -1] }, { "size": 3, "px": [11, 5, 9], "py": [0, 0, 0], "pz": [0, 1, 0], "nx": [2, 6, 3], "ny": [3, 7, 4], "nz": [2, 0, 1] }, { "size": 5, "px": [18, 18, 9, 17, 17], "py": [15, 14, 7, 14, 14], "pz": [0, 0, 1, 0, -1], "nx": [21, 21, 21, 22, 20], "ny": [15, 21, 17, 14, 23], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [9, 12, 12, 7, 4], "py": [4, 11, 12, 6, 5], "pz": [1, 0, 0, 1, 2], "nx": [16, 11, 9, 6, 20], "ny": [8, 4, 11, 10, 23], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [12, 11, 10, 11, 11], "py": [23, 4, 4, 5, 23], "pz": [0, 0, 0, 0, 0], "nx": [11, 11, 7, 3, 20], "ny": [21, 21, 11, 1, 23], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [12, 1], "py": [12, 3], "pz": [0, -1], "nx": [10, 10], "ny": [3, 2], "nz": [1, 1] }, { "size": 5, "px": [9, 4, 15, 9, 9], "py": [8, 4, 23, 7, 7], "pz": [1, 2, 0, 1, -1], "nx": [5, 3, 3, 3, 2], "ny": [23, 19, 17, 18, 15], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [2, 0], "py": [16, 3], "pz": [0, 2], "nx": [9, 4], "ny": [15, 2], "nz": [0, -1] }, { "size": 2, "px": [2, 3], "py": [3, 7], "pz": [2, 1], "nx": [3, 8], "ny": [4, 10], "nz": [1, -1] }, { "size": 3, "px": [9, 4, 3], "py": [18, 0, 14], "pz": [0, -1, -1], "nx": [3, 5, 2], "ny": [5, 8, 5], "nz": [2, 1, 2] }, { "size": 3, "px": [1, 1, 10], "py": [2, 1, 7], "pz": [1, -1, -1], "nx": [0, 0, 0], "ny": [3, 5, 1], "nz": [0, 0, 1] }, { "size": 4, "px": [11, 11, 5, 2], "py": [12, 13, 7, 3], "pz": [0, 0, -1, -1], "nx": [5, 10, 10, 9], "ny": [6, 9, 10, 13], "nz": [1, 0, 0, 0] }, { "size": 2, "px": [4, 8], "py": [3, 6], "pz": [2, 1], "nx": [9, 1], "ny": [4, 3], "nz": [1, -1] }, { "size": 5, "px": [0, 0, 1, 1, 0], "py": [4, 10, 12, 13, 5], "pz": [1, 0, 0, 0, 1], "nx": [4, 4, 8, 7, 7], "ny": [3, 2, 10, 4, 4], "nz": [2, 2, 1, 1, -1] }, { "size": 3, "px": [3, 4, 3], "py": [1, 1, 2], "pz": [1, -1, -1], "nx": [4, 5, 3], "ny": [1, 0, 2], "nz": [0, 0, 0] }, { "size": 2, "px": [9, 2], "py": [6, 4], "pz": [1, -1], "nx": [8, 4], "ny": [6, 2], "nz": [1, 2] }, { "size": 5, "px": [12, 13, 15, 16, 7], "py": [1, 1, 2, 2, 1], "pz": [0, 0, 0, 0, 1], "nx": [4, 4, 4, 3, 7], "ny": [2, 2, 4, 2, 4], "nz": [2, -1, -1, -1, -1] }, { "size": 5, "px": [9, 3, 2, 11, 5], "py": [23, 7, 4, 10, 6], "pz": [0, 1, 2, 0, 1], "nx": [21, 20, 11, 21, 21], "ny": [21, 23, 8, 20, 20], "nz": [0, 0, 1, 0, -1] }, { "size": 4, "px": [12, 6, 13, 12], "py": [7, 3, 5, 6], "pz": [0, 1, 0, 0], "nx": [3, 0, 5, 10], "ny": [4, 6, 5, 1], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [10, 4], "py": [4, 0], "pz": [0, -1], "nx": [12, 11], "ny": [2, 1], "nz": [0, 0] }, { "size": 4, "px": [2, 3, 22, 5], "py": [6, 1, 18, 5], "pz": [1, -1, -1, -1], "nx": [0, 0, 0, 3], "ny": [14, 3, 12, 18], "nz": [0, 2, 0, 0] }, { "size": 3, "px": [10, 20, 21], "py": [10, 18, 15], "pz": [1, 0, 0], "nx": [15, 1, 2], "ny": [7, 0, 8], "nz": [0, -1, -1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [4, 7, 13, 4, 6], "pz": [1, 1, 0, 2, 1], "nx": [5, 9, 8, 4, 4], "ny": [3, 7, 7, 3, 3], "nz": [1, 0, 0, 1, -1] }, { "size": 3, "px": [13, 12, 14], "py": [2, 2, 2], "pz": [0, 0, 0], "nx": [4, 4, 4], "ny": [2, 2, 5], "nz": [2, -1, -1] }, { "size": 5, "px": [5, 4, 6, 2, 12], "py": [7, 9, 7, 4, 10], "pz": [0, 1, 0, 2, 0], "nx": [6, 1, 2, 5, 2], "ny": [9, 2, 4, 13, 4], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [11, 1], "py": [12, 5], "pz": [0, -1], "nx": [1, 0], "ny": [7, 2], "nz": [0, 2] }, { "size": 5, "px": [8, 8, 1, 16, 6], "py": [6, 6, 4, 8, 11], "pz": [1, -1, -1, -1, -1], "nx": [13, 5, 4, 4, 13], "ny": [12, 1, 2, 5, 11], "nz": [0, 2, 2, 2, 0] }, { "size": 2, "px": [5, 6], "py": [4, 14], "pz": [1, 0], "nx": [9, 5], "ny": [7, 1], "nz": [0, -1] }, { "size": 2, "px": [2, 6], "py": [4, 14], "pz": [2, 0], "nx": [9, 2], "ny": [15, 1], "nz": [0, -1] }, { "size": 5, "px": [10, 19, 20, 10, 9], "py": [1, 2, 3, 0, 0], "pz": [1, 0, 0, 1, -1], "nx": [11, 23, 23, 11, 23], "ny": [0, 3, 1, 1, 2], "nz": [1, 0, 0, 1, 0] }, { "size": 2, "px": [2, 9], "py": [3, 12], "pz": [2, 0], "nx": [2, 6], "ny": [4, 6], "nz": [1, -1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [4, 10, 11, 9, 9], "pz": [1, 0, 0, 0, -1], "nx": [16, 2, 17, 8, 4], "ny": [10, 2, 9, 4, 4], "nz": [0, 2, 0, 1, 1] }, { "size": 2, "px": [12, 0], "py": [5, 4], "pz": [0, -1], "nx": [7, 8], "ny": [4, 8], "nz": [1, 1] }, { "size": 2, "px": [21, 21], "py": [9, 10], "pz": [0, 0], "nx": [11, 8], "ny": [18, 8], "nz": [0, -1] }, { "size": 2, "px": [14, 7], "py": [23, 9], "pz": [0, 1], "nx": [7, 13], "ny": [10, 4], "nz": [1, -1] }, { "size": 5, "px": [12, 12, 12, 6, 2], "py": [11, 13, 12, 6, 4], "pz": [0, 0, 0, -1, -1], "nx": [0, 0, 0, 0, 0], "ny": [14, 13, 6, 12, 11], "nz": [0, 0, 1, 0, 0] }, { "size": 2, "px": [8, 9], "py": [6, 11], "pz": [1, -1], "nx": [15, 15], "ny": [11, 10], "nz": [0, 0] }, { "size": 4, "px": [4, 6, 7, 2], "py": [8, 4, 23, 7], "pz": [1, -1, -1, -1], "nx": [4, 20, 19, 17], "ny": [0, 3, 1, 1], "nz": [2, 0, 0, 0] }, { "size": 2, "px": [7, 0], "py": [6, 0], "pz": [1, -1], "nx": [7, 4], "ny": [8, 2], "nz": [1, 2] }, { "size": 2, "px": [10, 0], "py": [7, 0], "pz": [1, -1], "nx": [15, 15], "ny": [15, 14], "nz": [0, 0] }, { "size": 5, "px": [6, 2, 5, 2, 4], "py": [23, 7, 21, 8, 16], "pz": [0, 1, 0, 1, 0], "nx": [18, 2, 10, 0, 11], "ny": [9, 3, 23, 5, 3], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [9, 9, 8, 10, 4], "py": [0, 2, 2, 1, 1], "pz": [0, 0, 0, 0, 1], "nx": [4, 3, 2, 2, 5], "ny": [7, 3, 4, 2, 17], "nz": [0, 1, 2, 2, 0] }, { "size": 2, "px": [10, 7], "py": [5, 6], "pz": [1, -1], "nx": [11, 11], "ny": [6, 5], "nz": [1, 1] }, { "size": 5, "px": [11, 11, 5, 6, 11], "py": [8, 10, 5, 5, 9], "pz": [0, 0, 1, 1, 0], "nx": [13, 16, 11, 14, 4], "ny": [9, 13, 11, 20, 23], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [7, 14], "py": [14, 22], "pz": [0, -1], "nx": [3, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [4, 11], "py": [4, 5], "pz": [2, -1], "nx": [2, 4], "ny": [5, 7], "nz": [2, 1] }, { "size": 2, "px": [1, 0], "py": [0, 0], "pz": [0, 1], "nx": [0, 4], "ny": [0, 2], "nz": [0, -1] }, { "size": 5, "px": [11, 11, 11, 4, 9], "py": [5, 5, 2, 9, 23], "pz": [0, -1, -1, -1, -1], "nx": [11, 12, 10, 9, 5], "ny": [2, 2, 2, 2, 1], "nz": [0, 0, 0, 0, 1] }, { "size": 3, "px": [16, 14, 15], "py": [1, 1, 0], "pz": [0, 0, 0], "nx": [4, 7, 4], "ny": [2, 4, 4], "nz": [2, 1, -1] }, { "size": 2, "px": [5, 0], "py": [14, 5], "pz": [0, -1], "nx": [2, 4], "ny": [5, 17], "nz": [2, 0] }, { "size": 5, "px": [18, 7, 16, 19, 4], "py": [13, 6, 23, 13, 3], "pz": [0, 1, 0, 0, 2], "nx": [5, 2, 3, 4, 4], "ny": [1, 1, 4, 1, 3], "nz": [0, 1, 0, 0, 0] }, { "size": 2, "px": [8, 8], "py": [7, 6], "pz": [1, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [2, 1], "py": [10, 4], "pz": [1, 2], "nx": [4, 4], "ny": [3, 3], "nz": [2, -1] }, { "size": 2, "px": [10, 5], "py": [19, 1], "pz": [0, -1], "nx": [4, 12], "ny": [10, 17], "nz": [1, 0] }, { "size": 5, "px": [12, 6, 2, 4, 11], "py": [14, 4, 2, 1, 5], "pz": [0, -1, -1, -1, -1], "nx": [3, 4, 3, 4, 3], "ny": [13, 17, 14, 16, 15], "nz": [0, 0, 0, 0, 0] }], "alpha": [-1.368326e+00, 1.368326e+00, -7.706897e-01, 7.706897e-01, -8.378147e-01, 8.378147e-01, -6.120624e-01, 6.120624e-01, -5.139189e-01, 5.139189e-01, -4.759130e-01, 4.759130e-01, -5.161374e-01, 5.161374e-01, -5.407743e-01, 5.407743e-01, -4.216105e-01, 4.216105e-01, -4.418693e-01, 4.418693e-01, -4.435335e-01, 4.435335e-01, -4.052076e-01, 4.052076e-01, -4.293050e-01, 4.293050e-01, -3.431154e-01, 3.431154e-01, -4.231203e-01, 4.231203e-01, -3.917100e-01, 3.917100e-01, -3.623450e-01, 3.623450e-01, -3.202670e-01, 3.202670e-01, -3.331602e-01, 3.331602e-01, -3.552034e-01, 3.552034e-01, -3.784556e-01, 3.784556e-01, -3.295428e-01, 3.295428e-01, -3.587038e-01, 3.587038e-01, -2.861332e-01, 2.861332e-01, -3.403258e-01, 3.403258e-01, -3.989002e-01, 3.989002e-01, -2.631159e-01, 2.631159e-01, -3.272156e-01, 3.272156e-01, -2.816567e-01, 2.816567e-01, -3.125926e-01, 3.125926e-01, -3.146982e-01, 3.146982e-01, -2.521825e-01, 2.521825e-01, -2.434554e-01, 2.434554e-01, -3.435378e-01, 3.435378e-01, -3.161172e-01, 3.161172e-01, -2.805027e-01, 2.805027e-01, -3.303579e-01, 3.303579e-01, -2.725089e-01, 2.725089e-01, -2.575051e-01, 2.575051e-01, -3.210646e-01, 3.210646e-01, -2.986997e-01, 2.986997e-01, -2.408925e-01, 2.408925e-01, -2.456291e-01, 2.456291e-01, -2.836550e-01, 2.836550e-01, -2.469860e-01, 2.469860e-01, -2.915900e-01, 2.915900e-01, -2.513559e-01, 2.513559e-01, -2.433728e-01, 2.433728e-01, -2.377905e-01, 2.377905e-01, -2.089327e-01, 2.089327e-01, -1.978434e-01, 1.978434e-01, -3.017699e-01, 3.017699e-01, -2.339661e-01, 2.339661e-01, -1.932560e-01, 1.932560e-01, -2.278285e-01, 2.278285e-01, -2.438200e-01, 2.438200e-01, -2.216769e-01, 2.216769e-01, -1.941995e-01, 1.941995e-01, -2.129081e-01, 2.129081e-01, -2.270319e-01, 2.270319e-01, -2.393942e-01, 2.393942e-01, -2.132518e-01, 2.132518e-01, -1.867741e-01, 1.867741e-01, -2.394237e-01, 2.394237e-01, -2.005917e-01, 2.005917e-01, -2.445217e-01, 2.445217e-01, -2.229078e-01, 2.229078e-01, -2.342967e-01, 2.342967e-01, -2.481784e-01, 2.481784e-01, -2.735603e-01, 2.735603e-01, -2.187604e-01, 2.187604e-01, -1.677239e-01, 1.677239e-01, -2.248867e-01, 2.248867e-01, -2.505358e-01, 2.505358e-01, -1.867706e-01, 1.867706e-01, -1.904305e-01, 1.904305e-01, -1.939881e-01, 1.939881e-01, -2.249474e-01, 2.249474e-01, -1.762483e-01, 1.762483e-01, -2.299974e-01, 2.299974e-01] }, { "count": 115, "threshold": -5.151920e+00, "feature": [{ "size": 5, "px": [7, 14, 7, 10, 6], "py": [3, 3, 12, 4, 4], "pz": [0, 0, 0, 0, 1], "nx": [14, 3, 14, 9, 3], "ny": [7, 4, 8, 8, 5], "nz": [0, 1, 0, 0, 2] }, { "size": 5, "px": [13, 18, 16, 17, 15], "py": [1, 13, 1, 2, 0], "pz": [0, 0, 0, 0, 0], "nx": [23, 23, 8, 11, 22], "ny": [3, 4, 4, 8, 0], "nz": [0, 0, 1, 1, 0] }, { "size": 5, "px": [16, 6, 6, 7, 12], "py": [12, 13, 4, 12, 5], "pz": [0, 0, 1, 0, 0], "nx": [0, 0, 8, 4, 0], "ny": [0, 2, 4, 4, 2], "nz": [0, 0, 1, 1, -1] }, { "size": 3, "px": [12, 13, 7], "py": [13, 18, 6], "pz": [0, 0, 1], "nx": [13, 5, 6], "ny": [16, 3, 8], "nz": [0, -1, -1] }, { "size": 5, "px": [10, 12, 9, 13, 11], "py": [3, 3, 3, 3, 3], "pz": [0, 0, 0, 0, 0], "nx": [3, 4, 15, 4, 4], "ny": [2, 5, 10, 4, 4], "nz": [2, 1, 0, 1, -1] }, { "size": 5, "px": [12, 12, 12, 3, 12], "py": [7, 9, 8, 3, 10], "pz": [0, 0, 0, 2, 0], "nx": [4, 8, 15, 9, 9], "ny": [4, 4, 8, 8, 8], "nz": [1, 1, 0, 0, -1] }, { "size": 5, "px": [6, 3, 4, 4, 2], "py": [22, 12, 13, 14, 7], "pz": [0, 0, 0, 0, 1], "nx": [2, 0, 1, 1, 1], "ny": [23, 5, 22, 21, 21], "nz": [0, 2, 0, 0, -1] }, { "size": 2, "px": [3, 3], "py": [8, 8], "pz": [1, -1], "nx": [3, 4], "ny": [4, 10], "nz": [1, 1] }, { "size": 5, "px": [11, 11, 11, 11, 0], "py": [10, 12, 11, 13, 2], "pz": [0, 0, 0, -1, -1], "nx": [8, 13, 13, 13, 13], "ny": [10, 8, 9, 11, 10], "nz": [1, 0, 0, 0, 0] }, { "size": 5, "px": [16, 16, 15, 17, 18], "py": [12, 23, 11, 12, 12], "pz": [0, 0, 0, 0, 0], "nx": [8, 8, 9, 3, 13], "ny": [4, 4, 12, 3, 10], "nz": [1, -1, -1, -1, -1] }, { "size": 4, "px": [17, 16, 6, 5], "py": [14, 13, 4, 5], "pz": [0, 0, -1, -1], "nx": [8, 15, 4, 7], "ny": [10, 14, 4, 8], "nz": [1, 0, 2, 1] }, { "size": 5, "px": [20, 10, 20, 21, 19], "py": [14, 7, 13, 12, 22], "pz": [0, 1, 0, 0, 0], "nx": [22, 23, 11, 23, 23], "ny": [23, 22, 11, 21, 20], "nz": [0, 0, 1, 0, -1] }, { "size": 4, "px": [12, 13, 1, 18], "py": [14, 23, 3, 5], "pz": [0, -1, -1, -1], "nx": [2, 10, 5, 9], "ny": [2, 9, 8, 14], "nz": [2, 0, 1, 0] }, { "size": 5, "px": [10, 4, 7, 9, 8], "py": [1, 0, 2, 0, 1], "pz": [0, 1, 0, 0, 0], "nx": [2, 3, 5, 3, 3], "ny": [2, 4, 8, 3, 3], "nz": [2, 1, 1, 1, -1] }, { "size": 4, "px": [11, 2, 2, 11], "py": [6, 4, 5, 7], "pz": [0, 2, 2, 0], "nx": [3, 0, 5, 3], "ny": [4, 9, 8, 3], "nz": [1, -1, -1, -1] }, { "size": 5, "px": [12, 10, 9, 12, 12], "py": [11, 2, 1, 10, 10], "pz": [0, 1, 1, 0, -1], "nx": [22, 11, 5, 22, 23], "ny": [1, 1, 0, 0, 3], "nz": [0, 1, 2, 0, 0] }, { "size": 4, "px": [5, 10, 7, 11], "py": [14, 3, 0, 4], "pz": [0, -1, -1, -1], "nx": [4, 4, 4, 4], "ny": [17, 18, 15, 16], "nz": [0, 0, 0, 0] }, { "size": 5, "px": [2, 2, 3, 2, 2], "py": [16, 12, 20, 15, 17], "pz": [0, 0, 0, 0, 0], "nx": [12, 8, 4, 15, 15], "ny": [17, 4, 4, 8, 8], "nz": [0, 1, 1, 0, -1] }, { "size": 5, "px": [12, 12, 1, 6, 12], "py": [11, 10, 3, 6, 10], "pz": [0, 0, -1, -1, -1], "nx": [0, 0, 1, 0, 2], "ny": [4, 0, 2, 1, 0], "nz": [0, 2, 0, 1, 0] }, { "size": 5, "px": [21, 20, 21, 21, 14], "py": [9, 16, 11, 8, 12], "pz": [0, 0, 0, 0, 0], "nx": [17, 6, 15, 0, 2], "ny": [8, 23, 13, 2, 0], "nz": [0, -1, -1, -1, -1] }, { "size": 4, "px": [6, 9, 9, 5], "py": [14, 18, 23, 14], "pz": [0, 0, 0, 0], "nx": [9, 5, 5, 12], "ny": [21, 5, 3, 1], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [12, 13], "py": [4, 4], "pz": [0, 0], "nx": [4, 3], "ny": [4, 1], "nz": [1, 2] }, { "size": 5, "px": [7, 8, 11, 4, 10], "py": [3, 3, 2, 1, 2], "pz": [0, 0, 0, 1, 0], "nx": [19, 20, 19, 20, 20], "ny": [0, 3, 1, 2, 2], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [9, 1], "py": [7, 4], "pz": [1, -1], "nx": [4, 7], "ny": [5, 9], "nz": [2, 1] }, { "size": 5, "px": [11, 10, 1, 5, 1], "py": [10, 12, 6, 6, 5], "pz": [0, 0, 1, 1, 1], "nx": [16, 3, 2, 4, 4], "ny": [10, 4, 2, 4, 4], "nz": [0, 1, 2, 1, -1] }, { "size": 2, "px": [15, 0], "py": [17, 0], "pz": [0, -1], "nx": [7, 4], "ny": [8, 5], "nz": [1, 2] }, { "size": 5, "px": [8, 10, 9, 9, 9], "py": [2, 2, 2, 1, 1], "pz": [0, 0, 0, 0, -1], "nx": [4, 2, 3, 3, 2], "ny": [0, 3, 2, 1, 4], "nz": [0, 0, 0, 0, 0] }, { "size": 4, "px": [11, 15, 17, 16], "py": [8, 10, 11, 11], "pz": [0, 0, 0, 0], "nx": [14, 1, 1, 2], "ny": [9, 5, 7, 0], "nz": [0, -1, -1, -1] }, { "size": 3, "px": [3, 5, 9], "py": [8, 6, 12], "pz": [0, 1, 0], "nx": [3, 4, 18], "ny": [4, 2, 22], "nz": [1, -1, -1] }, { "size": 5, "px": [6, 1, 7, 3, 3], "py": [13, 4, 13, 7, 7], "pz": [0, 2, 0, 1, -1], "nx": [0, 0, 0, 0, 0], "ny": [16, 15, 8, 13, 14], "nz": [0, 0, 1, 0, 0] }, { "size": 2, "px": [5, 16], "py": [13, 10], "pz": [0, -1], "nx": [3, 4], "ny": [4, 5], "nz": [1, 1] }, { "size": 5, "px": [5, 23, 11, 23, 23], "py": [5, 12, 4, 16, 15], "pz": [2, 0, 1, 0, 0], "nx": [3, 2, 4, 5, 5], "ny": [4, 2, 4, 11, 11], "nz": [1, 2, 1, 1, -1] }, { "size": 4, "px": [10, 10, 3, 23], "py": [7, 7, 3, 16], "pz": [1, -1, -1, -1], "nx": [5, 23, 11, 22], "ny": [4, 13, 7, 16], "nz": [2, 0, 1, 0] }, { "size": 5, "px": [15, 14, 13, 15, 16], "py": [1, 0, 0, 0, 1], "pz": [0, 0, 0, 0, 0], "nx": [4, 9, 8, 8, 8], "ny": [2, 4, 9, 4, 4], "nz": [2, 1, 1, 1, -1] }, { "size": 2, "px": [10, 4], "py": [5, 5], "pz": [0, -1], "nx": [3, 15], "ny": [1, 8], "nz": [2, 0] }, { "size": 2, "px": [6, 12], "py": [6, 9], "pz": [1, 0], "nx": [10, 10], "ny": [10, 10], "nz": [0, -1] }, { "size": 5, "px": [1, 0, 0, 0, 0], "py": [5, 4, 11, 9, 12], "pz": [0, 1, 0, 0, 0], "nx": [9, 8, 2, 4, 7], "ny": [7, 7, 2, 4, 7], "nz": [0, 0, 2, 1, 0] }, { "size": 2, "px": [4, 8], "py": [4, 7], "pz": [2, 1], "nx": [9, 8], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [5, 6], "py": [4, 1], "pz": [2, -1], "nx": [8, 6], "ny": [7, 3], "nz": [1, 1] }, { "size": 5, "px": [8, 5, 7, 6, 11], "py": [12, 5, 13, 13, 22], "pz": [0, 1, 0, 0, 0], "nx": [23, 23, 23, 22, 22], "ny": [20, 19, 21, 23, 23], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [3, 17], "py": [6, 9], "pz": [1, -1], "nx": [3, 3], "ny": [10, 9], "nz": [1, 1] }, { "size": 2, "px": [14, 11], "py": [23, 5], "pz": [0, 0], "nx": [7, 3], "ny": [10, 20], "nz": [1, -1] }, { "size": 2, "px": [3, 4], "py": [8, 8], "pz": [1, 1], "nx": [9, 4], "ny": [15, 4], "nz": [0, -1] }, { "size": 2, "px": [2, 4], "py": [4, 7], "pz": [2, 1], "nx": [2, 4], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [23, 11], "py": [21, 10], "pz": [0, 1], "nx": [2, 3], "ny": [11, 14], "nz": [1, 0] }, { "size": 4, "px": [11, 11, 11, 3], "py": [13, 12, 11, 4], "pz": [0, 0, 0, -1], "nx": [14, 13, 13, 6], "ny": [13, 11, 10, 5], "nz": [0, 0, 0, 1] }, { "size": 2, "px": [4, 7], "py": [3, 6], "pz": [2, 1], "nx": [9, 19], "ny": [4, 14], "nz": [1, -1] }, { "size": 3, "px": [10, 5, 7], "py": [5, 0, 6], "pz": [1, -1, -1], "nx": [10, 21, 5], "ny": [0, 5, 3], "nz": [1, 0, 2] }, { "size": 2, "px": [16, 13], "py": [3, 15], "pz": [0, -1], "nx": [17, 7], "ny": [23, 8], "nz": [0, 1] }, { "size": 3, "px": [4, 2, 2], "py": [15, 7, 19], "pz": [0, 1, -1], "nx": [2, 8, 4], "ny": [5, 14, 9], "nz": [2, 0, 1] }, { "size": 3, "px": [8, 3, 6], "py": [10, 2, 4], "pz": [0, 2, 1], "nx": [3, 8, 4], "ny": [4, 14, 9], "nz": [1, -1, -1] }, { "size": 2, "px": [14, 3], "py": [18, 3], "pz": [0, -1], "nx": [12, 14], "ny": [17, 9], "nz": [0, 0] }, { "size": 3, "px": [7, 1, 10], "py": [14, 10, 10], "pz": [0, -1, -1], "nx": [9, 6, 2], "ny": [13, 18, 2], "nz": [0, 0, 2] }, { "size": 2, "px": [11, 8], "py": [13, 11], "pz": [0, -1], "nx": [2, 4], "ny": [7, 18], "nz": [1, 0] }, { "size": 2, "px": [5, 4], "py": [21, 17], "pz": [0, 0], "nx": [9, 3], "ny": [5, 1], "nz": [1, -1] }, { "size": 2, "px": [6, 6], "py": [4, 0], "pz": [0, -1], "nx": [4, 3], "ny": [2, 0], "nz": [0, 1] }, { "size": 2, "px": [2, 1], "py": [1, 5], "pz": [0, -1], "nx": [0, 1], "ny": [1, 0], "nz": [1, 0] }, { "size": 2, "px": [18, 1], "py": [13, 5], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [0, 0, 0, 0, 1], "py": [4, 3, 2, 12, 15], "pz": [1, 1, 2, 0, 0], "nx": [5, 9, 4, 8, 8], "ny": [3, 6, 3, 6, 6], "nz": [1, 0, 1, 0, -1] }, { "size": 2, "px": [2, 5], "py": [0, 2], "pz": [1, -1], "nx": [2, 1], "ny": [0, 1], "nz": [0, 1] }, { "size": 4, "px": [7, 15, 4, 20], "py": [8, 23, 4, 8], "pz": [1, 0, 2, 0], "nx": [6, 0, 3, 4], "ny": [9, 2, 13, 6], "nz": [0, -1, -1, -1] }, { "size": 4, "px": [11, 11, 10, 20], "py": [10, 9, 11, 8], "pz": [0, 0, 0, -1], "nx": [21, 20, 21, 21], "ny": [18, 23, 19, 17], "nz": [0, 0, 0, 0] }, { "size": 2, "px": [3, 8], "py": [7, 5], "pz": [1, -1], "nx": [3, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [5, 11], "py": [3, 4], "pz": [2, 1], "nx": [8, 7], "ny": [5, 12], "nz": [1, 0] }, { "size": 2, "px": [4, 1], "py": [1, 3], "pz": [1, -1], "nx": [3, 6], "ny": [0, 0], "nz": [1, 0] }, { "size": 2, "px": [19, 9], "py": [16, 8], "pz": [0, 1], "nx": [14, 6], "ny": [15, 1], "nz": [0, -1] }, { "size": 2, "px": [12, 6], "py": [13, 5], "pz": [0, -1], "nx": [5, 5], "ny": [1, 2], "nz": [2, 2] }, { "size": 5, "px": [16, 14, 4, 15, 12], "py": [1, 1, 1, 2, 1], "pz": [0, 0, 2, 0, 0], "nx": [6, 4, 3, 2, 10], "ny": [22, 8, 2, 1, 7], "nz": [0, 1, 1, 2, 0] }, { "size": 5, "px": [6, 8, 6, 5, 5], "py": [1, 0, 0, 1, 0], "pz": [0, 0, 0, 0, 0], "nx": [4, 4, 4, 4, 8], "ny": [4, 3, 2, 5, 10], "nz": [2, 2, 2, 2, 1] }, { "size": 2, "px": [9, 8], "py": [17, 0], "pz": [0, -1], "nx": [2, 5], "ny": [5, 8], "nz": [2, 1] }, { "size": 2, "px": [8, 0], "py": [7, 3], "pz": [1, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [10, 21], "py": [11, 20], "pz": [1, 0], "nx": [11, 4], "ny": [17, 1], "nz": [0, -1] }, { "size": 5, "px": [5, 10, 4, 17, 10], "py": [3, 6, 3, 11, 5], "pz": [1, 0, 1, 0, 0], "nx": [21, 20, 9, 19, 10], "ny": [4, 3, 0, 2, 1], "nz": [0, 0, 1, 0, -1] }, { "size": 2, "px": [23, 23], "py": [10, 10], "pz": [0, -1], "nx": [23, 23], "ny": [21, 22], "nz": [0, 0] }, { "size": 5, "px": [9, 20, 19, 20, 20], "py": [0, 3, 1, 2, 2], "pz": [1, 0, 0, 0, -1], "nx": [11, 23, 11, 23, 5], "ny": [1, 2, 0, 1, 0], "nz": [1, 0, 1, 0, 2] }, { "size": 3, "px": [6, 8, 7], "py": [4, 10, 11], "pz": [1, 0, 0], "nx": [8, 3, 4], "ny": [9, 4, 4], "nz": [0, -1, -1] }, { "size": 4, "px": [13, 13, 10, 4], "py": [14, 23, 1, 5], "pz": [0, -1, -1, -1], "nx": [15, 14, 8, 8], "ny": [13, 12, 8, 9], "nz": [0, 0, 1, 1] }, { "size": 2, "px": [11, 9], "py": [5, 8], "pz": [0, -1], "nx": [7, 8], "ny": [7, 4], "nz": [0, 1] }, { "size": 5, "px": [4, 8, 4, 7, 7], "py": [2, 3, 3, 11, 11], "pz": [2, 1, 2, 1, -1], "nx": [0, 0, 1, 0, 0], "ny": [4, 6, 15, 3, 2], "nz": [1, 1, 0, 2, 2] }, { "size": 2, "px": [6, 1], "py": [12, 1], "pz": [0, -1], "nx": [1, 10], "ny": [2, 11], "nz": [2, 0] }, { "size": 5, "px": [0, 0, 2, 3, 7], "py": [0, 1, 4, 3, 11], "pz": [0, -1, -1, -1, -1], "nx": [9, 11, 9, 6, 12], "ny": [2, 1, 1, 0, 2], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [10, 11], "py": [4, 4], "pz": [0, 0], "nx": [8, 4], "ny": [4, 2], "nz": [1, -1] }, { "size": 5, "px": [1, 1, 1, 1, 1], "py": [15, 10, 19, 16, 18], "pz": [0, 1, 0, 0, 0], "nx": [4, 5, 3, 5, 6], "ny": [4, 19, 9, 18, 19], "nz": [1, 0, 1, 0, -1] }, { "size": 5, "px": [12, 12, 12, 12, 20], "py": [11, 12, 13, 13, 18], "pz": [0, 0, 0, -1, -1], "nx": [0, 0, 0, 0, 0], "ny": [4, 2, 7, 6, 12], "nz": [1, 2, 1, 1, 0] }, { "size": 2, "px": [0, 0], "py": [9, 11], "pz": [0, 0], "nx": [10, 4], "ny": [5, 3], "nz": [1, -1] }, { "size": 2, "px": [11, 8], "py": [9, 6], "pz": [0, 1], "nx": [13, 13], "ny": [10, 10], "nz": [0, -1] }, { "size": 2, "px": [6, 3], "py": [5, 3], "pz": [1, 2], "nx": [3, 3], "ny": [5, 5], "nz": [2, -1] }, { "size": 2, "px": [19, 9], "py": [10, 6], "pz": [0, 1], "nx": [4, 1], "ny": [2, 2], "nz": [2, -1] }, { "size": 2, "px": [14, 4], "py": [19, 12], "pz": [0, -1], "nx": [14, 8], "ny": [17, 10], "nz": [0, 1] }, { "size": 4, "px": [4, 2, 13, 2], "py": [12, 6, 9, 3], "pz": [0, 1, -1, -1], "nx": [1, 0, 1, 0], "ny": [16, 14, 11, 15], "nz": [0, 0, 1, 0] }, { "size": 2, "px": [3, 3], "py": [8, 7], "pz": [1, 1], "nx": [4, 4], "ny": [4, 8], "nz": [1, -1] }, { "size": 5, "px": [9, 11, 12, 6, 10], "py": [2, 1, 2, 1, 2], "pz": [0, 0, 0, 1, 0], "nx": [4, 6, 4, 6, 2], "ny": [4, 0, 9, 1, 8], "nz": [0, 0, 1, 0, 1] }, { "size": 5, "px": [4, 4, 7, 2, 2], "py": [19, 20, 23, 8, 9], "pz": [0, 0, 0, 1, 1], "nx": [7, 0, 5, 6, 2], "ny": [10, 5, 4, 1, 8], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [18, 18, 17, 18, 18], "py": [15, 16, 14, 20, 17], "pz": [0, 0, 0, 0, 0], "nx": [15, 2, 2, 5, 2], "ny": [8, 0, 2, 9, 4], "nz": [0, -1, -1, -1, -1] }, { "size": 4, "px": [13, 13, 13, 18], "py": [11, 12, 12, 20], "pz": [0, 0, -1, -1], "nx": [1, 3, 10, 10], "ny": [1, 6, 12, 11], "nz": [2, 0, 0, 0] }, { "size": 2, "px": [8, 9], "py": [0, 1], "pz": [1, 1], "nx": [19, 4], "ny": [2, 2], "nz": [0, -1] }, { "size": 2, "px": [6, 3], "py": [4, 2], "pz": [1, 2], "nx": [8, 4], "ny": [4, 0], "nz": [1, -1] }, { "size": 5, "px": [23, 11, 22, 13, 13], "py": [8, 3, 3, 12, 12], "pz": [0, 1, 0, 0, -1], "nx": [15, 7, 14, 13, 8], "ny": [7, 3, 6, 6, 3], "nz": [0, 1, 0, 0, 1] }, { "size": 3, "px": [9, 11, 19], "py": [7, 3, 0], "pz": [1, -1, -1], "nx": [23, 23, 11], "ny": [16, 12, 7], "nz": [0, 0, 1] }, { "size": 2, "px": [15, 8], "py": [23, 7], "pz": [0, -1], "nx": [4, 3], "ny": [5, 4], "nz": [2, 2] }, { "size": 2, "px": [4, 10], "py": [6, 13], "pz": [1, -1], "nx": [2, 3], "ny": [4, 10], "nz": [2, 1] }, { "size": 2, "px": [4, 1], "py": [11, 2], "pz": [1, 2], "nx": [9, 2], "ny": [5, 2], "nz": [1, -1] }, { "size": 2, "px": [22, 22], "py": [22, 21], "pz": [0, 0], "nx": [3, 0], "ny": [5, 3], "nz": [1, -1] }, { "size": 2, "px": [20, 10], "py": [12, 6], "pz": [0, 1], "nx": [20, 10], "ny": [23, 11], "nz": [0, -1] }, { "size": 4, "px": [10, 3, 3, 4], "py": [5, 3, 4, 9], "pz": [0, -1, -1, -1], "nx": [14, 4, 3, 11], "ny": [2, 1, 1, 3], "nz": [0, 2, 2, 0] }, { "size": 3, "px": [15, 15, 3], "py": [1, 1, 4], "pz": [0, -1, -1], "nx": [7, 4, 4], "ny": [8, 2, 3], "nz": [1, 2, 2] }, { "size": 3, "px": [0, 0, 0], "py": [3, 4, 6], "pz": [2, 2, 1], "nx": [0, 21, 4], "ny": [23, 14, 3], "nz": [0, -1, -1] }, { "size": 5, "px": [4, 4, 5, 3, 4], "py": [9, 11, 8, 4, 8], "pz": [1, 1, 1, 2, 1], "nx": [21, 21, 10, 19, 19], "ny": [3, 4, 1, 0, 0], "nz": [0, 0, 1, 0, -1] }, { "size": 4, "px": [21, 20, 20, 21], "py": [18, 21, 20, 17], "pz": [0, 0, 0, 0], "nx": [8, 1, 4, 2], "ny": [10, 0, 2, 4], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [3, 6], "py": [7, 14], "pz": [1, 0], "nx": [3, 5], "ny": [4, 5], "nz": [1, -1] }, { "size": 3, "px": [12, 0, 23], "py": [20, 2, 13], "pz": [0, -1, -1], "nx": [12, 2, 9], "ny": [19, 2, 7], "nz": [0, 2, 0] }, { "size": 2, "px": [0, 6], "py": [22, 11], "pz": [0, -1], "nx": [20, 18], "ny": [12, 23], "nz": [0, 0] }, { "size": 5, "px": [9, 15, 15, 16, 8], "py": [2, 1, 2, 2, 1], "pz": [1, 0, 0, 0, 1], "nx": [1, 1, 1, 1, 1], "ny": [16, 10, 17, 18, 18], "nz": [0, 1, 0, 0, -1] }, { "size": 5, "px": [10, 5, 3, 5, 8], "py": [14, 2, 1, 4, 1], "pz": [0, -1, -1, -1, -1], "nx": [23, 23, 23, 23, 23], "ny": [18, 15, 16, 14, 17], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [2, 2, 2, 3, 2], "py": [16, 17, 15, 20, 11], "pz": [0, 0, 0, 0, 1], "nx": [8, 22, 2, 1, 23], "ny": [20, 11, 5, 0, 17], "nz": [0, -1, -1, -1, -1] }], "alpha": [-1.299972e+00, 1.299972e+00, -7.630804e-01, 7.630804e-01, -5.530378e-01, 5.530378e-01, -5.444703e-01, 5.444703e-01, -5.207701e-01, 5.207701e-01, -5.035143e-01, 5.035143e-01, -4.514416e-01, 4.514416e-01, -4.897723e-01, 4.897723e-01, -5.006264e-01, 5.006264e-01, -4.626049e-01, 4.626049e-01, -4.375402e-01, 4.375402e-01, -3.742565e-01, 3.742565e-01, -3.873996e-01, 3.873996e-01, -3.715484e-01, 3.715484e-01, -3.562480e-01, 3.562480e-01, -3.216189e-01, 3.216189e-01, -3.983409e-01, 3.983409e-01, -3.191891e-01, 3.191891e-01, -3.242173e-01, 3.242173e-01, -3.528040e-01, 3.528040e-01, -3.562318e-01, 3.562318e-01, -3.592398e-01, 3.592398e-01, -2.557584e-01, 2.557584e-01, -2.747951e-01, 2.747951e-01, -2.747554e-01, 2.747554e-01, -2.980481e-01, 2.980481e-01, -2.887670e-01, 2.887670e-01, -3.895318e-01, 3.895318e-01, -2.786896e-01, 2.786896e-01, -2.763841e-01, 2.763841e-01, -2.704816e-01, 2.704816e-01, -2.075489e-01, 2.075489e-01, -3.104773e-01, 3.104773e-01, -2.580337e-01, 2.580337e-01, -2.448334e-01, 2.448334e-01, -3.054279e-01, 3.054279e-01, -2.335804e-01, 2.335804e-01, -2.972322e-01, 2.972322e-01, -2.270521e-01, 2.270521e-01, -2.134621e-01, 2.134621e-01, -2.261655e-01, 2.261655e-01, -2.091024e-01, 2.091024e-01, -2.478928e-01, 2.478928e-01, -2.468972e-01, 2.468972e-01, -1.919746e-01, 1.919746e-01, -2.756623e-01, 2.756623e-01, -2.629717e-01, 2.629717e-01, -2.198653e-01, 2.198653e-01, -2.174434e-01, 2.174434e-01, -2.193626e-01, 2.193626e-01, -1.956262e-01, 1.956262e-01, -1.720459e-01, 1.720459e-01, -1.781067e-01, 1.781067e-01, -1.773484e-01, 1.773484e-01, -1.793871e-01, 1.793871e-01, -1.973396e-01, 1.973396e-01, -2.397262e-01, 2.397262e-01, -2.164685e-01, 2.164685e-01, -2.214348e-01, 2.214348e-01, -2.265941e-01, 2.265941e-01, -2.075436e-01, 2.075436e-01, -2.244070e-01, 2.244070e-01, -2.291992e-01, 2.291992e-01, -2.223506e-01, 2.223506e-01, -1.639398e-01, 1.639398e-01, -1.732374e-01, 1.732374e-01, -1.808631e-01, 1.808631e-01, -1.860962e-01, 1.860962e-01, -1.781604e-01, 1.781604e-01, -2.108322e-01, 2.108322e-01, -2.386390e-01, 2.386390e-01, -1.942083e-01, 1.942083e-01, -1.949161e-01, 1.949161e-01, -1.953729e-01, 1.953729e-01, -2.317591e-01, 2.317591e-01, -2.335136e-01, 2.335136e-01, -2.282835e-01, 2.282835e-01, -2.148716e-01, 2.148716e-01, -1.588127e-01, 1.588127e-01, -1.566765e-01, 1.566765e-01, -1.644839e-01, 1.644839e-01, -2.386947e-01, 2.386947e-01, -1.704126e-01, 1.704126e-01, -2.213945e-01, 2.213945e-01, -1.740398e-01, 1.740398e-01, -2.451678e-01, 2.451678e-01, -2.120524e-01, 2.120524e-01, -1.886646e-01, 1.886646e-01, -2.824447e-01, 2.824447e-01, -1.900364e-01, 1.900364e-01, -2.179183e-01, 2.179183e-01, -2.257696e-01, 2.257696e-01, -2.023404e-01, 2.023404e-01, -1.886901e-01, 1.886901e-01, -1.850663e-01, 1.850663e-01, -2.035414e-01, 2.035414e-01, -1.930174e-01, 1.930174e-01, -1.898282e-01, 1.898282e-01, -1.666640e-01, 1.666640e-01, -1.646143e-01, 1.646143e-01, -1.543475e-01, 1.543475e-01, -1.366289e-01, 1.366289e-01, -1.636837e-01, 1.636837e-01, -2.547716e-01, 2.547716e-01, -1.281869e-01, 1.281869e-01, -1.509159e-01, 1.509159e-01, -1.447827e-01, 1.447827e-01, -1.626126e-01, 1.626126e-01, -2.387014e-01, 2.387014e-01, -2.571160e-01, 2.571160e-01, -1.719175e-01, 1.719175e-01, -1.646742e-01, 1.646742e-01, -1.717041e-01, 1.717041e-01, -2.039217e-01, 2.039217e-01, -1.796907e-01, 1.796907e-01] }, { "count": 153, "threshold": -4.971032e+00, "feature": [{ "size": 5, "px": [14, 13, 18, 10, 16], "py": [2, 2, 13, 3, 12], "pz": [0, 0, 0, 0, 0], "nx": [21, 7, 14, 23, 23], "ny": [16, 7, 8, 3, 13], "nz": [0, 1, 0, 0, 0] }, { "size": 5, "px": [12, 12, 12, 15, 14], "py": [9, 10, 11, 3, 3], "pz": [0, 0, 0, 0, 0], "nx": [9, 9, 8, 14, 3], "ny": [9, 8, 5, 9, 5], "nz": [0, 0, 1, 0, 2] }, { "size": 5, "px": [5, 11, 7, 6, 8], "py": [12, 8, 12, 12, 11], "pz": [0, 0, 0, 0, 0], "nx": [8, 4, 3, 9, 9], "ny": [4, 4, 4, 9, 9], "nz": [1, 1, 1, 0, -1] }, { "size": 5, "px": [9, 8, 4, 10, 6], "py": [2, 2, 1, 3, 13], "pz": [0, 0, 1, 0, 0], "nx": [1, 1, 5, 1, 1], "ny": [2, 3, 8, 4, 16], "nz": [0, 0, 1, 0, 0] }, { "size": 5, "px": [3, 16, 6, 17, 15], "py": [2, 17, 4, 12, 12], "pz": [2, 0, 1, 0, 0], "nx": [4, 8, 15, 1, 1], "ny": [4, 4, 8, 16, 16], "nz": [1, 1, -1, -1, -1] }, { "size": 4, "px": [18, 15, 8, 17], "py": [12, 23, 6, 12], "pz": [0, 0, 1, 0], "nx": [15, 4, 10, 5], "ny": [21, 8, 14, 3], "nz": [0, -1, -1, -1] }, { "size": 5, "px": [18, 17, 9, 19, 19], "py": [3, 1, 0, 3, 3], "pz": [0, 0, 1, 0, -1], "nx": [22, 11, 23, 23, 23], "ny": [0, 1, 2, 3, 4], "nz": [0, 1, 0, 0, 0] }, { "size": 4, "px": [9, 5, 5, 10], "py": [18, 15, 14, 18], "pz": [0, 0, 0, 0], "nx": [10, 11, 2, 0], "ny": [16, 7, 12, 7], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [2, 12], "py": [4, 6], "pz": [2, 0], "nx": [3, 12], "ny": [4, 19], "nz": [1, -1] }, { "size": 5, "px": [3, 4, 5, 2, 2], "py": [3, 3, 3, 1, 1], "pz": [0, 0, 0, 1, -1], "nx": [0, 0, 1, 0, 0], "ny": [3, 4, 0, 1, 2], "nz": [0, 0, 0, 1, 0] }, { "size": 5, "px": [12, 12, 12, 8, 10], "py": [13, 12, 12, 1, 18], "pz": [0, 0, -1, -1, -1], "nx": [13, 8, 7, 14, 9], "ny": [10, 10, 7, 13, 4], "nz": [0, 1, 1, 0, 1] }, { "size": 5, "px": [15, 4, 12, 14, 12], "py": [12, 3, 9, 10, 8], "pz": [0, 2, 0, 0, 0], "nx": [14, 7, 11, 2, 9], "ny": [8, 4, 7, 5, 4], "nz": [0, 1, -1, -1, -1] }, { "size": 3, "px": [3, 9, 7], "py": [7, 23, 15], "pz": [1, -1, -1], "nx": [4, 4, 2], "ny": [9, 7, 5], "nz": [1, 1, 2] }, { "size": 3, "px": [5, 17, 5], "py": [3, 23, 4], "pz": [2, 0, 2], "nx": [23, 2, 4], "ny": [23, 16, 4], "nz": [0, -1, -1] }, { "size": 5, "px": [4, 9, 9, 10, 8], "py": [1, 0, 1, 0, 2], "pz": [1, 0, 0, 0, 0], "nx": [2, 5, 4, 2, 2], "ny": [2, 19, 11, 4, 1], "nz": [2, 0, 1, 2, 2] }, { "size": 5, "px": [8, 3, 8, 4, 7], "py": [23, 9, 13, 8, 16], "pz": [0, 1, 0, 1, 0], "nx": [8, 2, 5, 3, 2], "ny": [8, 15, 1, 1, 1], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [11, 5], "py": [14, 5], "pz": [0, -1], "nx": [1, 9], "ny": [3, 13], "nz": [2, 0] }, { "size": 5, "px": [5, 8, 1, 8, 6], "py": [12, 12, 3, 23, 12], "pz": [0, 0, 2, 0, 0], "nx": [1, 1, 2, 1, 1], "ny": [22, 21, 23, 20, 20], "nz": [0, 0, 0, 0, -1] }, { "size": 5, "px": [14, 21, 19, 21, 20], "py": [13, 8, 20, 10, 7], "pz": [0, 0, 0, 0, 0], "nx": [16, 0, 14, 23, 1], "ny": [8, 1, 23, 10, 20], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [15, 16, 13, 14, 14], "py": [3, 3, 3, 3, 3], "pz": [0, 0, 0, 0, -1], "nx": [18, 19, 18, 9, 17], "ny": [2, 2, 1, 1, 0], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [17, 9], "py": [14, 4], "pz": [0, -1], "nx": [9, 18], "ny": [4, 18], "nz": [1, 0] }, { "size": 2, "px": [21, 20], "py": [17, 21], "pz": [0, 0], "nx": [12, 3], "ny": [17, 10], "nz": [0, -1] }, { "size": 2, "px": [2, 1], "py": [10, 4], "pz": [1, 2], "nx": [4, 1], "ny": [10, 5], "nz": [1, -1] }, { "size": 5, "px": [7, 8, 4, 9, 9], "py": [2, 2, 0, 2, 2], "pz": [0, 0, 1, 0, -1], "nx": [5, 5, 4, 6, 3], "ny": [0, 1, 2, 0, 0], "nz": [0, 0, 0, 0, 1] }, { "size": 2, "px": [2, 5], "py": [3, 5], "pz": [2, -1], "nx": [3, 2], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [0, 1, 3, 4, 4], "pz": [2, 2, 1, 1, -1], "nx": [20, 20, 19, 20, 19], "ny": [21, 20, 23, 19, 22], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [9, 18], "py": [8, 16], "pz": [1, 0], "nx": [14, 6], "ny": [15, 16], "nz": [0, -1] }, { "size": 3, "px": [3, 4, 7], "py": [3, 3, 9], "pz": [2, 2, 1], "nx": [8, 9, 7], "ny": [4, 11, 4], "nz": [1, -1, -1] }, { "size": 5, "px": [6, 14, 4, 7, 7], "py": [4, 23, 3, 6, 6], "pz": [1, 0, 2, 1, -1], "nx": [2, 0, 2, 1, 3], "ny": [20, 4, 21, 10, 23], "nz": [0, 2, 0, 1, 0] }, { "size": 5, "px": [2, 4, 8, 9, 10], "py": [3, 8, 13, 23, 23], "pz": [2, 1, 0, 0, 0], "nx": [10, 4, 0, 3, 3], "ny": [21, 3, 0, 3, 23], "nz": [0, -1, -1, -1, -1] }, { "size": 3, "px": [11, 10, 11], "py": [6, 5, 5], "pz": [0, 0, 0], "nx": [14, 6, 1], "ny": [7, 9, 5], "nz": [0, 1, -1] }, { "size": 5, "px": [11, 11, 11, 11, 6], "py": [11, 12, 10, 13, 6], "pz": [0, 0, 0, 0, 1], "nx": [9, 13, 13, 13, 4], "ny": [4, 9, 10, 11, 2], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 11], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [1, 2], "py": [4, 11], "pz": [2, 0], "nx": [8, 8], "ny": [15, 15], "nz": [0, -1] }, { "size": 5, "px": [12, 12, 13, 12, 12], "py": [10, 11, 13, 12, 12], "pz": [0, 0, 0, 0, -1], "nx": [0, 0, 0, 1, 0], "ny": [13, 2, 12, 5, 14], "nz": [0, 2, 0, 0, 0] }, { "size": 5, "px": [0, 0, 0, 1, 1], "py": [4, 3, 11, 15, 13], "pz": [1, 2, 0, 0, 0], "nx": [2, 3, 3, 1, 0], "ny": [2, 4, 4, 5, 14], "nz": [2, 1, -1, -1, -1] }, { "size": 2, "px": [4, 11], "py": [12, 10], "pz": [0, -1], "nx": [1, 2], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [18, 8, 9, 9, 9], "py": [15, 7, 8, 10, 7], "pz": [0, 1, 1, 1, 1], "nx": [22, 23, 21, 22, 11], "ny": [20, 16, 23, 19, 9], "nz": [0, 0, 0, 0, 1] }, { "size": 5, "px": [14, 12, 13, 14, 15], "py": [1, 0, 0, 0, 1], "pz": [0, 0, 0, 0, 0], "nx": [4, 9, 4, 7, 7], "ny": [2, 3, 1, 8, 8], "nz": [2, 1, 2, 1, -1] }, { "size": 2, "px": [13, 9], "py": [14, 19], "pz": [0, -1], "nx": [6, 10], "ny": [0, 2], "nz": [1, 0] }, { "size": 2, "px": [13, 12], "py": [4, 4], "pz": [0, 0], "nx": [3, 3], "ny": [1, 1], "nz": [2, -1] }, { "size": 3, "px": [14, 5, 5], "py": [18, 3, 4], "pz": [0, -1, -1], "nx": [8, 7, 8], "ny": [4, 8, 10], "nz": [1, 1, 1] }, { "size": 2, "px": [8, 18], "py": [6, 11], "pz": [1, 0], "nx": [9, 1], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [16, 11], "py": [9, 7], "pz": [0, 0], "nx": [7, 7], "ny": [4, 4], "nz": [1, -1] }, { "size": 5, "px": [23, 11, 23, 11, 23], "py": [13, 4, 12, 7, 10], "pz": [0, 1, 0, 1, 0], "nx": [7, 4, 8, 15, 15], "ny": [9, 2, 4, 8, 8], "nz": [0, 2, 1, 0, -1] }, { "size": 2, "px": [6, 3], "py": [1, 0], "pz": [0, 1], "nx": [4, 1], "ny": [1, 2], "nz": [0, -1] }, { "size": 2, "px": [5, 5], "py": [7, 6], "pz": [0, 1], "nx": [6, 4], "ny": [9, 11], "nz": [0, -1] }, { "size": 4, "px": [5, 6, 5, 5], "py": [8, 6, 11, 6], "pz": [1, 1, 1, 0], "nx": [23, 0, 4, 5], "ny": [0, 2, 2, 1], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [18, 4], "py": [13, 3], "pz": [0, -1], "nx": [15, 4], "ny": [11, 2], "nz": [0, 2] }, { "size": 2, "px": [4, 0], "py": [8, 0], "pz": [1, -1], "nx": [9, 2], "ny": [15, 5], "nz": [0, 2] }, { "size": 5, "px": [15, 15, 16, 14, 14], "py": [0, 1, 1, 0, 0], "pz": [0, 0, 0, 0, -1], "nx": [4, 4, 8, 8, 15], "ny": [4, 5, 4, 11, 23], "nz": [2, 2, 1, 1, 0] }, { "size": 4, "px": [12, 11, 3, 14], "py": [14, 22, 1, 0], "pz": [0, -1, -1, -1], "nx": [8, 15, 7, 16], "ny": [2, 3, 1, 3], "nz": [1, 0, 1, 0] }, { "size": 2, "px": [5, 12], "py": [6, 17], "pz": [1, -1], "nx": [2, 1], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [13, 12, 12, 7, 7], "py": [5, 6, 5, 14, 14], "pz": [0, 0, 0, 0, -1], "nx": [10, 3, 10, 1, 10], "ny": [13, 8, 11, 3, 10], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [4, 4], "py": [15, 0], "pz": [0, -1], "nx": [4, 4], "ny": [16, 17], "nz": [0, 0] }, { "size": 5, "px": [1, 4, 2, 1, 2], "py": [4, 0, 1, 1, 0], "pz": [1, 1, 1, 2, 1], "nx": [4, 9, 1, 5, 1], "ny": [3, 4, 4, 5, 5], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [10, 3], "py": [3, 1], "pz": [0, 2], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [16, 0], "py": [21, 0], "pz": [0, -1], "nx": [6, 8], "ny": [8, 4], "nz": [1, 1] }, { "size": 2, "px": [7, 11], "py": [4, 18], "pz": [0, -1], "nx": [5, 7], "ny": [0, 2], "nz": [2, 0] }, { "size": 2, "px": [9, 7], "py": [0, 3], "pz": [1, -1], "nx": [20, 10], "ny": [0, 1], "nz": [0, 1] }, { "size": 4, "px": [10, 4, 1, 5], "py": [0, 6, 8, 4], "pz": [1, -1, -1, -1], "nx": [6, 15, 4, 14], "ny": [3, 5, 1, 5], "nz": [1, 0, 2, 0] }, { "size": 2, "px": [4, 4], "py": [3, 4], "pz": [2, 2], "nx": [9, 2], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [8, 4], "py": [3, 4], "pz": [0, -1], "nx": [8, 6], "ny": [2, 1], "nz": [0, 0] }, { "size": 2, "px": [2, 0], "py": [6, 3], "pz": [1, 2], "nx": [0, 7], "ny": [7, 8], "nz": [1, -1] }, { "size": 2, "px": [10, 0], "py": [7, 3], "pz": [1, -1], "nx": [15, 4], "ny": [14, 4], "nz": [0, 2] }, { "size": 4, "px": [3, 1, 2, 2], "py": [20, 7, 18, 17], "pz": [0, 1, 0, 0], "nx": [9, 5, 5, 4], "ny": [5, 4, 18, 4], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [5, 4], "py": [3, 1], "pz": [2, -1], "nx": [23, 23], "ny": [14, 13], "nz": [0, 0] }, { "size": 2, "px": [12, 4], "py": [6, 1], "pz": [0, -1], "nx": [8, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 5, "px": [22, 22, 11, 11, 11], "py": [12, 13, 4, 6, 6], "pz": [0, 0, 1, 1, -1], "nx": [4, 4, 4, 4, 3], "ny": [16, 15, 18, 14, 11], "nz": [0, 0, 0, 0, 1] }, { "size": 2, "px": [4, 10], "py": [0, 1], "pz": [1, 0], "nx": [2, 2], "ny": [2, 2], "nz": [2, -1] }, { "size": 2, "px": [15, 6], "py": [4, 4], "pz": [0, -1], "nx": [15, 4], "ny": [2, 1], "nz": [0, 2] }, { "size": 2, "px": [11, 2], "py": [10, 20], "pz": [0, -1], "nx": [4, 9], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [4, 19], "py": [3, 8], "pz": [2, 0], "nx": [8, 21], "ny": [4, 20], "nz": [1, -1] }, { "size": 5, "px": [4, 6, 7, 6, 2], "py": [6, 15, 13, 14, 3], "pz": [1, 0, 0, 0, -1], "nx": [21, 22, 19, 21, 10], "ny": [6, 12, 0, 3, 2], "nz": [0, 0, 0, 0, 1] }, { "size": 5, "px": [8, 12, 15, 14, 13], "py": [0, 0, 0, 0, 0], "pz": [1, 0, 0, 0, 0], "nx": [4, 3, 1, 3, 4], "ny": [19, 16, 3, 15, 4], "nz": [0, 0, 2, 0, 1] }, { "size": 2, "px": [3, 3], "py": [2, 3], "pz": [2, 2], "nx": [8, 4], "ny": [4, 1], "nz": [1, -1] }, { "size": 4, "px": [0, 0, 0, 5], "py": [10, 9, 11, 21], "pz": [1, 1, -1, -1], "nx": [12, 4, 3, 11], "ny": [3, 1, 1, 3], "nz": [0, 2, 2, 0] }, { "size": 2, "px": [3, 1], "py": [0, 0], "pz": [1, 2], "nx": [1, 4], "ny": [2, 1], "nz": [1, -1] }, { "size": 5, "px": [2, 5, 1, 0, 1], "py": [14, 23, 7, 5, 9], "pz": [0, 0, 1, 1, 1], "nx": [0, 0, 7, 9, 11], "ny": [23, 22, 4, 9, 3], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [8, 9], "py": [7, 1], "pz": [1, -1], "nx": [8, 8], "ny": [8, 9], "nz": [1, 1] }, { "size": 2, "px": [11, 9], "py": [11, 3], "pz": [1, -1], "nx": [3, 2], "ny": [14, 10], "nz": [0, 1] }, { "size": 4, "px": [2, 4, 5, 4], "py": [8, 20, 22, 16], "pz": [1, 0, 0, 0], "nx": [8, 2, 11, 3], "ny": [7, 4, 15, 4], "nz": [0, -1, -1, -1] }, { "size": 3, "px": [1, 2, 3], "py": [2, 1, 0], "pz": [0, 0, 0], "nx": [0, 0, 15], "ny": [1, 0, 11], "nz": [0, 0, -1] }, { "size": 2, "px": [12, 22], "py": [6, 7], "pz": [0, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 3, "px": [13, 0, 5], "py": [19, 10, 2], "pz": [0, -1, -1], "nx": [3, 4, 6], "ny": [5, 5, 9], "nz": [2, 2, 1] }, { "size": 2, "px": [8, 15], "py": [8, 22], "pz": [1, 0], "nx": [7, 4], "ny": [10, 7], "nz": [1, -1] }, { "size": 2, "px": [10, 10], "py": [7, 6], "pz": [1, 1], "nx": [10, 1], "ny": [9, 0], "nz": [1, -1] }, { "size": 2, "px": [9, 11], "py": [4, 3], "pz": [0, -1], "nx": [5, 9], "ny": [0, 1], "nz": [1, 0] }, { "size": 5, "px": [14, 13, 14, 12, 15], "py": [1, 2, 2, 2, 2], "pz": [0, 0, 0, 0, 0], "nx": [4, 8, 4, 7, 4], "ny": [2, 4, 3, 4, 4], "nz": [2, 1, 2, 1, -1] }, { "size": 3, "px": [13, 8, 2], "py": [14, 5, 8], "pz": [0, -1, -1], "nx": [6, 8, 9], "ny": [3, 2, 2], "nz": [0, 0, 0] }, { "size": 3, "px": [3, 6, 8], "py": [7, 4, 12], "pz": [1, 1, 0], "nx": [3, 8, 9], "ny": [5, 2, 2], "nz": [1, -1, -1] }, { "size": 2, "px": [13, 4], "py": [16, 3], "pz": [0, 2], "nx": [13, 7], "ny": [15, 5], "nz": [0, -1] }, { "size": 2, "px": [3, 0], "py": [7, 9], "pz": [1, -1], "nx": [2, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [3, 6, 8, 7, 7], "py": [0, 1, 0, 0, 0], "pz": [1, 0, 0, 0, -1], "nx": [7, 9, 4, 3, 4], "ny": [9, 7, 4, 2, 2], "nz": [1, 1, 1, 2, 2] }, { "size": 3, "px": [3, 4, 16], "py": [4, 4, 6], "pz": [1, 2, 0], "nx": [2, 2, 2], "ny": [0, 0, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [0, 0], "py": [1, 0], "pz": [2, 2], "nx": [5, 5], "ny": [2, 2], "nz": [1, -1] }, { "size": 2, "px": [9, 3], "py": [7, 20], "pz": [1, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [8, 21], "py": [10, 18], "pz": [0, -1], "nx": [9, 4], "ny": [10, 4], "nz": [0, 1] }, { "size": 2, "px": [6, 13], "py": [6, 23], "pz": [1, -1], "nx": [10, 10], "ny": [11, 12], "nz": [0, 0] }, { "size": 5, "px": [10, 9, 5, 10, 10], "py": [9, 13, 6, 10, 10], "pz": [0, 0, 1, 0, -1], "nx": [21, 21, 21, 10, 21], "ny": [18, 20, 19, 11, 17], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [8, 8], "py": [7, 6], "pz": [1, 1], "nx": [8, 1], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [11, 4], "py": [14, 7], "pz": [0, -1], "nx": [13, 13], "ny": [13, 11], "nz": [0, 0] }, { "size": 2, "px": [4, 4], "py": [4, 5], "pz": [2, 2], "nx": [12, 5], "ny": [16, 2], "nz": [0, -1] }, { "size": 3, "px": [1, 3, 20], "py": [3, 9, 2], "pz": [2, -1, -1], "nx": [0, 0, 0], "ny": [7, 4, 13], "nz": [1, 2, 0] }, { "size": 2, "px": [0, 0], "py": [4, 2], "pz": [1, 2], "nx": [1, 0], "ny": [4, 4], "nz": [1, -1] }, { "size": 3, "px": [8, 9, 11], "py": [2, 1, 2], "pz": [0, 0, 0], "nx": [2, 2, 0], "ny": [2, 2, 13], "nz": [2, -1, -1] }, { "size": 2, "px": [1, 10], "py": [23, 5], "pz": [0, -1], "nx": [3, 6], "ny": [1, 1], "nz": [2, 1] }, { "size": 4, "px": [13, 6, 3, 4], "py": [8, 6, 4, 2], "pz": [0, -1, -1, -1], "nx": [1, 1, 1, 4], "ny": [9, 7, 8, 20], "nz": [1, 1, 1, 0] }, { "size": 5, "px": [11, 4, 4, 10, 3], "py": [9, 16, 13, 12, 7], "pz": [0, 0, 0, 0, 0], "nx": [7, 11, 3, 17, 4], "ny": [8, 11, 9, 0, 4], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [6, 6], "py": [6, 8], "pz": [1, -1], "nx": [0, 0], "ny": [1, 2], "nz": [2, 2] }, { "size": 2, "px": [10, 5], "py": [7, 2], "pz": [0, -1], "nx": [4, 13], "ny": [5, 9], "nz": [2, 0] }, { "size": 2, "px": [10, 5], "py": [8, 2], "pz": [1, -1], "nx": [16, 4], "ny": [14, 5], "nz": [0, 2] }, { "size": 2, "px": [1, 1], "py": [16, 15], "pz": [0, 0], "nx": [1, 20], "ny": [23, 1], "nz": [0, -1] }, { "size": 2, "px": [2, 3], "py": [4, 7], "pz": [2, 1], "nx": [2, 3], "ny": [5, 4], "nz": [2, -1] }, { "size": 2, "px": [19, 8], "py": [5, 4], "pz": [0, -1], "nx": [10, 10], "ny": [1, 3], "nz": [1, 1] }, { "size": 2, "px": [21, 21], "py": [18, 16], "pz": [0, 0], "nx": [10, 3], "ny": [17, 5], "nz": [0, -1] }, { "size": 2, "px": [9, 2], "py": [23, 4], "pz": [0, 2], "nx": [5, 11], "ny": [3, 7], "nz": [2, 1] }, { "size": 2, "px": [7, 0], "py": [3, 2], "pz": [0, -1], "nx": [3, 6], "ny": [1, 1], "nz": [1, 0] }, { "size": 4, "px": [5, 9, 8, 9], "py": [8, 12, 13, 18], "pz": [0, 0, 0, 0], "nx": [6, 5, 2, 5], "ny": [8, 4, 7, 11], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [7, 2], "py": [0, 0], "pz": [0, 2], "nx": [5, 5], "ny": [3, 4], "nz": [1, -1] }, { "size": 2, "px": [11, 11], "py": [12, 13], "pz": [0, 0], "nx": [9, 1], "ny": [14, 3], "nz": [0, -1] }, { "size": 5, "px": [8, 16, 9, 4, 15], "py": [11, 13, 8, 4, 12], "pz": [1, 0, 1, 2, 0], "nx": [3, 3, 3, 3, 4], "ny": [4, 2, 1, 3, 0], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [9, 5], "py": [7, 6], "pz": [1, -1], "nx": [19, 8], "ny": [17, 11], "nz": [0, 1] }, { "size": 5, "px": [14, 15, 12, 13, 13], "py": [2, 2, 2, 2, 2], "pz": [0, 0, 0, 0, -1], "nx": [20, 9, 19, 20, 4], "ny": [14, 2, 5, 15, 1], "nz": [0, 1, 0, 0, 2] }, { "size": 2, "px": [18, 8], "py": [20, 7], "pz": [0, 1], "nx": [4, 9], "ny": [2, 2], "nz": [2, -1] }, { "size": 2, "px": [6, 3], "py": [11, 5], "pz": [1, 2], "nx": [13, 19], "ny": [20, 20], "nz": [0, -1] }, { "size": 3, "px": [12, 11, 3], "py": [20, 20, 5], "pz": [0, 0, -1], "nx": [11, 12, 6], "ny": [21, 21, 10], "nz": [0, 0, 1] }, { "size": 2, "px": [3, 6], "py": [7, 14], "pz": [1, 0], "nx": [3, 13], "ny": [4, 8], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [5, 9], "pz": [2, 1], "nx": [2, 11], "ny": [8, 6], "nz": [1, -1] }, { "size": 2, "px": [2, 2], "py": [5, 5], "pz": [1, -1], "nx": [0, 0], "ny": [6, 3], "nz": [1, 2] }, { "size": 2, "px": [11, 23], "py": [5, 9], "pz": [1, 0], "nx": [8, 2], "ny": [11, 0], "nz": [0, -1] }, { "size": 2, "px": [11, 23], "py": [12, 9], "pz": [0, -1], "nx": [11, 22], "ny": [10, 21], "nz": [1, 0] }, { "size": 2, "px": [12, 12], "py": [7, 7], "pz": [0, -1], "nx": [5, 4], "ny": [7, 10], "nz": [1, 1] }, { "size": 2, "px": [9, 8], "py": [18, 1], "pz": [0, -1], "nx": [5, 4], "ny": [8, 10], "nz": [1, 1] }, { "size": 2, "px": [16, 17], "py": [11, 11], "pz": [0, 0], "nx": [15, 2], "ny": [9, 4], "nz": [0, -1] }, { "size": 2, "px": [0, 1], "py": [3, 0], "pz": [2, -1], "nx": [9, 10], "ny": [6, 5], "nz": [1, 1] }, { "size": 2, "px": [13, 13], "py": [20, 21], "pz": [0, -1], "nx": [2, 2], "ny": [6, 5], "nz": [1, 1] }, { "size": 5, "px": [20, 20, 4, 18, 19], "py": [17, 16, 5, 22, 20], "pz": [0, 0, 2, 0, 0], "nx": [8, 11, 5, 6, 2], "ny": [10, 15, 11, 10, 1], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [11, 11], "py": [4, 4], "pz": [0, -1], "nx": [8, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 3, "px": [6, 5, 6], "py": [8, 10, 10], "pz": [1, 1, 1], "nx": [11, 8, 22], "ny": [19, 2, 15], "nz": [0, -1, -1] }, { "size": 3, "px": [5, 2, 13], "py": [7, 10, 10], "pz": [1, -1, -1], "nx": [11, 11, 23], "ny": [8, 9, 14], "nz": [1, 1, 0] }, { "size": 5, "px": [3, 6, 1, 5, 10], "py": [7, 14, 1, 9, 2], "pz": [1, -1, -1, -1, -1], "nx": [11, 0, 1, 5, 1], "ny": [14, 12, 18, 5, 19], "nz": [0, 0, 0, 1, 0] }, { "size": 3, "px": [21, 21, 10], "py": [16, 17, 10], "pz": [0, 0, 1], "nx": [5, 5, 1], "ny": [9, 9, 18], "nz": [1, -1, -1] }, { "size": 2, "px": [6, 21], "py": [6, 17], "pz": [1, -1], "nx": [20, 10], "ny": [7, 4], "nz": [0, 1] }, { "size": 2, "px": [10, 11], "py": [0, 0], "pz": [1, -1], "nx": [6, 13], "ny": [2, 4], "nz": [1, 0] }, { "size": 4, "px": [4, 4, 7, 9], "py": [3, 4, 10, 3], "pz": [2, 2, 1, 1], "nx": [21, 2, 15, 5], "ny": [0, 0, 0, 2], "nz": [0, -1, -1, -1] }, { "size": 3, "px": [11, 11, 11], "py": [7, 6, 9], "pz": [1, 1, 1], "nx": [23, 4, 9], "ny": [23, 5, 6], "nz": [0, -1, -1] }, { "size": 2, "px": [14, 15], "py": [1, 1], "pz": [0, 0], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [11, 23, 11, 23, 23], "py": [11, 22, 10, 21, 20], "pz": [1, 0, 1, 0, 0], "nx": [10, 9, 19, 10, 10], "ny": [10, 11, 20, 9, 9], "nz": [1, 1, 0, 1, -1] }, { "size": 2, "px": [7, 23], "py": [13, 22], "pz": [0, -1], "nx": [8, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [12, 1], "py": [19, 0], "pz": [0, -1], "nx": [11, 12], "ny": [22, 17], "nz": [0, 0] }, { "size": 2, "px": [10, 8], "py": [4, 3], "pz": [1, -1], "nx": [5, 23], "ny": [2, 7], "nz": [2, 0] }, { "size": 2, "px": [9, 10], "py": [6, 20], "pz": [1, -1], "nx": [8, 8], "ny": [4, 6], "nz": [1, 1] }], "alpha": [-1.135386e+00, 1.135386e+00, -9.090800e-01, 9.090800e-01, -5.913780e-01, 5.913780e-01, -5.556534e-01, 5.556534e-01, -5.084150e-01, 5.084150e-01, -4.464489e-01, 4.464489e-01, -4.463241e-01, 4.463241e-01, -4.985226e-01, 4.985226e-01, -4.424638e-01, 4.424638e-01, -4.300093e-01, 4.300093e-01, -4.231341e-01, 4.231341e-01, -4.087428e-01, 4.087428e-01, -3.374480e-01, 3.374480e-01, -3.230151e-01, 3.230151e-01, -3.084427e-01, 3.084427e-01, -3.235494e-01, 3.235494e-01, -2.589281e-01, 2.589281e-01, -2.970292e-01, 2.970292e-01, -2.957065e-01, 2.957065e-01, -3.997619e-01, 3.997619e-01, -3.535901e-01, 3.535901e-01, -2.725396e-01, 2.725396e-01, -2.649725e-01, 2.649725e-01, -3.103888e-01, 3.103888e-01, -3.117775e-01, 3.117775e-01, -2.589620e-01, 2.589620e-01, -2.689202e-01, 2.689202e-01, -2.127024e-01, 2.127024e-01, -2.436322e-01, 2.436322e-01, -3.120574e-01, 3.120574e-01, -2.786010e-01, 2.786010e-01, -2.649072e-01, 2.649072e-01, -2.766509e-01, 2.766509e-01, -2.367237e-01, 2.367237e-01, -2.658049e-01, 2.658049e-01, -2.103463e-01, 2.103463e-01, -1.911522e-01, 1.911522e-01, -2.535425e-01, 2.535425e-01, -2.434696e-01, 2.434696e-01, -2.180788e-01, 2.180788e-01, -2.496873e-01, 2.496873e-01, -2.700969e-01, 2.700969e-01, -2.565479e-01, 2.565479e-01, -2.737741e-01, 2.737741e-01, -1.675507e-01, 1.675507e-01, -2.551417e-01, 2.551417e-01, -2.067648e-01, 2.067648e-01, -1.636834e-01, 1.636834e-01, -2.129306e-01, 2.129306e-01, -1.656758e-01, 1.656758e-01, -1.919369e-01, 1.919369e-01, -2.031763e-01, 2.031763e-01, -2.062327e-01, 2.062327e-01, -2.577950e-01, 2.577950e-01, -2.951823e-01, 2.951823e-01, -2.023160e-01, 2.023160e-01, -2.022234e-01, 2.022234e-01, -2.132906e-01, 2.132906e-01, -1.653278e-01, 1.653278e-01, -1.648474e-01, 1.648474e-01, -1.593352e-01, 1.593352e-01, -1.735650e-01, 1.735650e-01, -1.688778e-01, 1.688778e-01, -1.519705e-01, 1.519705e-01, -1.812202e-01, 1.812202e-01, -1.967481e-01, 1.967481e-01, -1.852954e-01, 1.852954e-01, -2.317780e-01, 2.317780e-01, -2.036251e-01, 2.036251e-01, -1.609324e-01, 1.609324e-01, -2.160205e-01, 2.160205e-01, -2.026190e-01, 2.026190e-01, -1.854761e-01, 1.854761e-01, -1.832038e-01, 1.832038e-01, -2.001141e-01, 2.001141e-01, -1.418333e-01, 1.418333e-01, -1.704773e-01, 1.704773e-01, -1.586261e-01, 1.586261e-01, -1.587582e-01, 1.587582e-01, -1.899489e-01, 1.899489e-01, -1.477160e-01, 1.477160e-01, -2.260467e-01, 2.260467e-01, -2.393598e-01, 2.393598e-01, -1.582373e-01, 1.582373e-01, -1.702498e-01, 1.702498e-01, -1.737398e-01, 1.737398e-01, -1.462529e-01, 1.462529e-01, -1.396517e-01, 1.396517e-01, -1.629625e-01, 1.629625e-01, -1.446933e-01, 1.446933e-01, -1.811657e-01, 1.811657e-01, -1.336427e-01, 1.336427e-01, -1.924813e-01, 1.924813e-01, -1.457520e-01, 1.457520e-01, -1.600259e-01, 1.600259e-01, -1.297000e-01, 1.297000e-01, -2.076199e-01, 2.076199e-01, -1.510060e-01, 1.510060e-01, -1.914568e-01, 1.914568e-01, -2.138162e-01, 2.138162e-01, -1.856916e-01, 1.856916e-01, -1.843047e-01, 1.843047e-01, -1.526846e-01, 1.526846e-01, -1.328320e-01, 1.328320e-01, -1.751311e-01, 1.751311e-01, -1.643908e-01, 1.643908e-01, -1.482706e-01, 1.482706e-01, -1.622298e-01, 1.622298e-01, -1.884979e-01, 1.884979e-01, -1.633604e-01, 1.633604e-01, -1.554166e-01, 1.554166e-01, -1.405332e-01, 1.405332e-01, -1.772398e-01, 1.772398e-01, -1.410008e-01, 1.410008e-01, -1.362301e-01, 1.362301e-01, -1.709087e-01, 1.709087e-01, -1.584613e-01, 1.584613e-01, -1.188814e-01, 1.188814e-01, -1.423888e-01, 1.423888e-01, -1.345565e-01, 1.345565e-01, -1.835986e-01, 1.835986e-01, -1.445329e-01, 1.445329e-01, -1.385826e-01, 1.385826e-01, -1.558917e-01, 1.558917e-01, -1.476053e-01, 1.476053e-01, -1.370722e-01, 1.370722e-01, -2.362666e-01, 2.362666e-01, -2.907774e-01, 2.907774e-01, -1.656360e-01, 1.656360e-01, -1.644407e-01, 1.644407e-01, -1.443394e-01, 1.443394e-01, -1.438823e-01, 1.438823e-01, -1.476964e-01, 1.476964e-01, -1.956593e-01, 1.956593e-01, -2.417519e-01, 2.417519e-01, -1.659315e-01, 1.659315e-01, -1.466254e-01, 1.466254e-01, -2.034909e-01, 2.034909e-01, -2.128771e-01, 2.128771e-01, -1.665429e-01, 1.665429e-01, -1.387131e-01, 1.387131e-01, -1.298823e-01, 1.298823e-01, -1.329495e-01, 1.329495e-01, -1.769587e-01, 1.769587e-01, -1.366530e-01, 1.366530e-01, -1.254359e-01, 1.254359e-01, -1.673022e-01, 1.673022e-01, -1.602519e-01, 1.602519e-01, -1.897245e-01, 1.897245e-01, -1.893579e-01, 1.893579e-01, -1.579350e-01, 1.579350e-01, -1.472589e-01, 1.472589e-01, -1.614193e-01, 1.614193e-01] }, { "count": 203, "threshold": -4.769677e+00, "feature": [{ "size": 5, "px": [12, 5, 14, 9, 7], "py": [9, 13, 3, 1, 3], "pz": [0, 0, 0, 0, 0], "nx": [1, 0, 5, 14, 9], "ny": [5, 3, 8, 8, 9], "nz": [2, 0, 1, 0, 0] }, { "size": 5, "px": [14, 13, 11, 17, 12], "py": [2, 2, 4, 13, 3], "pz": [0, 0, 0, 0, 0], "nx": [7, 22, 8, 23, 22], "ny": [8, 15, 11, 12, 3], "nz": [1, 0, 1, 0, 0] }, { "size": 5, "px": [9, 11, 11, 11, 16], "py": [4, 8, 7, 9, 12], "pz": [0, 0, 0, 0, 0], "nx": [4, 8, 14, 9, 9], "ny": [4, 4, 8, 8, 8], "nz": [1, 1, 0, 0, -1] }, { "size": 5, "px": [6, 12, 12, 8, 3], "py": [11, 7, 8, 10, 2], "pz": [0, 0, 0, 0, 2], "nx": [8, 4, 4, 4, 0], "ny": [4, 4, 4, 11, 0], "nz": [1, 1, -1, -1, -1] }, { "size": 5, "px": [19, 17, 18, 9, 9], "py": [3, 2, 3, 1, 1], "pz": [0, 0, 0, 1, -1], "nx": [21, 21, 10, 22, 22], "ny": [1, 2, 0, 4, 3], "nz": [0, 0, 1, 0, 0] }, { "size": 2, "px": [4, 7], "py": [4, 6], "pz": [2, 1], "nx": [8, 7], "ny": [4, 10], "nz": [1, 1] }, { "size": 5, "px": [14, 17, 17, 13, 12], "py": [18, 15, 16, 18, 18], "pz": [0, 0, 0, 0, 0], "nx": [13, 19, 5, 20, 6], "ny": [16, 4, 1, 19, 0], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [6, 7, 4, 5, 5], "py": [15, 23, 6, 12, 16], "pz": [0, 0, 1, 0, 0], "nx": [3, 14, 14, 6, 6], "ny": [4, 11, 11, 9, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [16, 9, 6, 3, 11], "py": [2, 2, 5, 3, 2], "pz": [0, 0, 1, 2, 0], "nx": [3, 4, 2, 5, 5], "ny": [4, 11, 2, 8, 8], "nz": [1, 1, 2, 1, -1] }, { "size": 5, "px": [6, 1, 5, 3, 3], "py": [14, 4, 15, 7, 7], "pz": [0, 2, 0, 1, -1], "nx": [0, 0, 1, 1, 1], "ny": [7, 8, 18, 17, 5], "nz": [1, 1, 0, 0, 2] }, { "size": 5, "px": [12, 12, 9, 5, 3], "py": [14, 14, 0, 3, 7], "pz": [0, -1, -1, -1, -1], "nx": [7, 7, 14, 8, 13], "ny": [7, 8, 13, 10, 10], "nz": [1, 1, 0, 1, 0] }, { "size": 2, "px": [3, 4], "py": [7, 9], "pz": [1, -1], "nx": [2, 4], "ny": [5, 4], "nz": [2, 1] }, { "size": 3, "px": [10, 21, 17], "py": [7, 11, 23], "pz": [1, 0, 0], "nx": [21, 9, 3], "ny": [23, 5, 5], "nz": [0, -1, -1] }, { "size": 5, "px": [8, 11, 9, 10, 11], "py": [2, 0, 1, 1, 2], "pz": [0, 0, 0, 0, 0], "nx": [4, 5, 6, 4, 3], "ny": [8, 4, 18, 7, 4], "nz": [1, 1, 0, 1, -1] }, { "size": 5, "px": [20, 22, 3, 19, 10], "py": [20, 9, 4, 22, 3], "pz": [0, 0, 2, 0, 1], "nx": [8, 20, 8, 3, 2], "ny": [4, 3, 6, 4, 3], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [4, 4], "py": [8, 7], "pz": [1, 1], "nx": [9, 2], "ny": [15, 5], "nz": [0, -1] }, { "size": 2, "px": [11, 13], "py": [13, 4], "pz": [0, -1], "nx": [20, 21], "ny": [1, 4], "nz": [0, 0] }, { "size": 5, "px": [1, 2, 7, 6, 8], "py": [0, 2, 3, 3, 3], "pz": [2, 1, 0, 0, 0], "nx": [1, 2, 1, 1, 1], "ny": [0, 0, 4, 3, 3], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [3, 10], "py": [9, 11], "pz": [0, 0], "nx": [6, 3], "ny": [9, 2], "nz": [0, -1] }, { "size": 5, "px": [12, 12, 12, 12, 6], "py": [10, 11, 13, 12, 6], "pz": [0, 0, 0, 0, -1], "nx": [10, 2, 1, 10, 10], "ny": [10, 4, 2, 11, 9], "nz": [0, 1, 2, 0, 0] }, { "size": 5, "px": [16, 18, 11, 17, 15], "py": [11, 12, 8, 12, 11], "pz": [0, 0, 0, 0, 0], "nx": [14, 0, 19, 0, 10], "ny": [9, 3, 14, 8, 9], "nz": [0, -1, -1, -1, -1] }, { "size": 4, "px": [5, 9, 5, 8], "py": [21, 18, 20, 23], "pz": [0, 0, 0, 0], "nx": [8, 4, 3, 1], "ny": [20, 3, 4, 3], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [2, 3], "py": [3, 2], "pz": [2, 2], "nx": [3, 12], "ny": [4, 23], "nz": [1, -1] }, { "size": 5, "px": [0, 1, 1, 1, 1], "py": [2, 16, 14, 13, 12], "pz": [2, 0, 0, 0, 0], "nx": [8, 4, 9, 4, 7], "ny": [9, 3, 4, 2, 9], "nz": [1, 2, 1, 2, 1] }, { "size": 2, "px": [4, 9], "py": [3, 7], "pz": [2, -1], "nx": [4, 9], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [15, 16, 17, 15, 8], "py": [3, 3, 3, 18, 1], "pz": [0, 0, 0, 0, 1], "nx": [1, 2, 2, 1, 3], "ny": [5, 3, 2, 6, 0], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [4, 17], "py": [4, 14], "pz": [2, 0], "nx": [15, 7], "ny": [15, 10], "nz": [0, -1] }, { "size": 3, "px": [14, 12, 3], "py": [3, 13, 3], "pz": [0, -1, -1], "nx": [4, 17, 4], "ny": [3, 19, 4], "nz": [2, 0, 2] }, { "size": 4, "px": [4, 5, 12, 2], "py": [9, 6, 19, 4], "pz": [1, 1, 0, 2], "nx": [12, 17, 4, 4], "ny": [18, 19, 4, 4], "nz": [0, -1, -1, -1] }, { "size": 5, "px": [10, 19, 20, 20, 19], "py": [7, 14, 13, 14, 13], "pz": [1, 0, 0, 0, -1], "nx": [11, 23, 23, 23, 23], "ny": [9, 15, 13, 16, 14], "nz": [1, 0, 0, 0, 0] }, { "size": 4, "px": [0, 0, 0, 2], "py": [5, 6, 5, 14], "pz": [1, 1, 2, 0], "nx": [0, 3, 3, 17], "ny": [23, 5, 5, 9], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [15, 4], "py": [23, 5], "pz": [0, 2], "nx": [9, 3], "ny": [4, 4], "nz": [1, -1] }, { "size": 4, "px": [6, 5, 10, 12], "py": [3, 3, 23, 23], "pz": [1, 1, 0, 0], "nx": [11, 1, 1, 4], "ny": [21, 3, 5, 5], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [5, 2], "py": [9, 4], "pz": [1, 2], "nx": [4, 9], "ny": [4, 2], "nz": [1, -1] }, { "size": 5, "px": [23, 23, 23, 23, 23], "py": [14, 9, 13, 11, 12], "pz": [0, 0, 0, 0, 0], "nx": [6, 13, 7, 8, 8], "ny": [9, 6, 3, 3, 3], "nz": [1, 0, 1, 1, -1] }, { "size": 2, "px": [10, 3], "py": [4, 5], "pz": [0, -1], "nx": [3, 8], "ny": [1, 3], "nz": [2, 1] }, { "size": 2, "px": [3, 12], "py": [4, 18], "pz": [2, 0], "nx": [12, 0], "ny": [16, 3], "nz": [0, -1] }, { "size": 2, "px": [16, 2], "py": [4, 4], "pz": [0, -1], "nx": [16, 4], "ny": [1, 0], "nz": [0, 2] }, { "size": 2, "px": [3, 4], "py": [7, 1], "pz": [1, -1], "nx": [5, 3], "ny": [19, 9], "nz": [0, 1] }, { "size": 4, "px": [20, 19, 20, 21], "py": [2, 0, 1, 3], "pz": [0, 0, 0, 0], "nx": [11, 5, 23, 11], "ny": [0, 0, 1, 1], "nz": [1, 2, 0, 1] }, { "size": 2, "px": [12, 13], "py": [7, 5], "pz": [0, 0], "nx": [8, 5], "ny": [3, 5], "nz": [1, -1] }, { "size": 5, "px": [22, 21, 22, 22, 22], "py": [20, 22, 18, 19, 16], "pz": [0, 0, 0, 0, 0], "nx": [2, 3, 3, 15, 15], "ny": [4, 5, 4, 7, 7], "nz": [1, 2, 1, 0, -1] }, { "size": 3, "px": [15, 14, 14], "py": [1, 1, 1], "pz": [0, 0, -1], "nx": [17, 18, 16], "ny": [1, 2, 1], "nz": [0, 0, 0] }, { "size": 4, "px": [17, 16, 16, 15], "py": [2, 1, 0, 0], "pz": [0, 0, 0, 0], "nx": [7, 4, 2, 11], "ny": [11, 2, 1, 4], "nz": [1, 2, -1, -1] }, { "size": 4, "px": [18, 0, 0, 0], "py": [14, 6, 5, 4], "pz": [0, -1, -1, -1], "nx": [19, 19, 19, 19], "ny": [16, 19, 17, 18], "nz": [0, 0, 0, 0] }, { "size": 4, "px": [11, 5, 5, 0], "py": [14, 1, 4, 4], "pz": [0, -1, -1, -1], "nx": [11, 8, 2, 15], "ny": [17, 14, 1, 9], "nz": [0, 0, 2, 0] }, { "size": 2, "px": [4, 5], "py": [19, 21], "pz": [0, 0], "nx": [10, 2], "ny": [15, 4], "nz": [0, -1] }, { "size": 2, "px": [6, 4], "py": [4, 6], "pz": [1, 1], "nx": [3, 3], "ny": [4, 5], "nz": [1, -1] }, { "size": 2, "px": [2, 7], "py": [1, 13], "pz": [2, 0], "nx": [7, 2], "ny": [1, 4], "nz": [1, -1] }, { "size": 4, "px": [15, 10, 4, 7], "py": [23, 3, 1, 7], "pz": [0, 1, 2, 1], "nx": [0, 4, 1, 1], "ny": [0, 2, 0, -1900147915], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [7, 2], "py": [12, 11], "pz": [0, -1], "nx": [2, 4], "ny": [2, 5], "nz": [2, 1] }, { "size": 5, "px": [0, 0, 0, 1, 0], "py": [9, 4, 3, 2, 6], "pz": [0, 1, 2, 1, 1], "nx": [9, 4, 2, 16, 16], "ny": [7, 4, 2, 8, 8], "nz": [0, 1, 2, 0, -1] }, { "size": 5, "px": [18, 4, 9, 4, 4], "py": [12, 5, 6, 3, 4], "pz": [0, 2, 1, 2, -1], "nx": [4, 3, 3, 2, 3], "ny": [23, 19, 21, 16, 18], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [6, 6], "py": [14, 13], "pz": [0, 0], "nx": [3, 10], "ny": [4, 7], "nz": [1, -1] }, { "size": 5, "px": [3, 4, 4, 2, 2], "py": [8, 11, 7, 4, 4], "pz": [1, 1, 1, 2, -1], "nx": [20, 18, 19, 20, 19], "ny": [4, 0, 2, 3, 1], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [17, 12, 14, 8, 16], "py": [2, 0, 0, 0, 0], "pz": [0, 0, 0, 1, 0], "nx": [3, 15, 3, 2, 2], "ny": [2, 9, 7, 2, 2], "nz": [2, 0, 1, 2, -1] }, { "size": 5, "px": [11, 10, 11, 11, 11], "py": [10, 12, 11, 12, 12], "pz": [0, 0, 0, 0, -1], "nx": [13, 13, 20, 10, 13], "ny": [9, 11, 8, 4, 10], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [8, 16], "py": [7, 13], "pz": [1, 0], "nx": [8, 13], "ny": [4, 11], "nz": [1, -1] }, { "size": 2, "px": [6, 7], "py": [20, 3], "pz": [0, -1], "nx": [3, 4], "ny": [10, 10], "nz": [1, 1] }, { "size": 3, "px": [13, 10, 17], "py": [9, 3, 5], "pz": [0, -1, -1], "nx": [1, 3, 1], "ny": [5, 16, 6], "nz": [2, 0, 1] }, { "size": 2, "px": [0, 0], "py": [5, 5], "pz": [2, -1], "nx": [8, 3], "ny": [14, 10], "nz": [0, 1] }, { "size": 4, "px": [11, 9, 12, 10], "py": [2, 2, 2, 2], "pz": [0, 0, 0, 0], "nx": [4, 4, 4, 10], "ny": [5, 5, 0, 16], "nz": [1, -1, -1, -1] }, { "size": 3, "px": [7, 9, 12], "py": [2, 2, 2], "pz": [1, -1, -1], "nx": [4, 7, 2], "ny": [3, 1, 0], "nz": [0, 0, 2] }, { "size": 2, "px": [2, 4], "py": [3, 12], "pz": [2, 0], "nx": [7, 4], "ny": [6, 5], "nz": [1, 2] }, { "size": 4, "px": [12, 12, 6, 3], "py": [12, 11, 21, 7], "pz": [0, 0, -1, -1], "nx": [1, 0, 0, 0], "ny": [13, 3, 6, 5], "nz": [0, 2, 1, 1] }, { "size": 3, "px": [3, 1, 3], "py": [21, 8, 18], "pz": [0, 1, 0], "nx": [11, 20, 0], "ny": [17, 17, 6], "nz": [0, -1, -1] }, { "size": 2, "px": [2, 8], "py": [3, 12], "pz": [2, 0], "nx": [2, 20], "ny": [4, 17], "nz": [1, -1] }, { "size": 5, "px": [2, 3, 4, 3, 2], "py": [10, 14, 14, 15, 13], "pz": [1, 0, 0, 0, 0], "nx": [0, 0, 1, 0, 0], "ny": [21, 20, 23, 19, 19], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [2, 15], "py": [7, 4], "pz": [1, -1], "nx": [3, 8], "ny": [4, 14], "nz": [1, 0] }, { "size": 5, "px": [19, 14, 12, 15, 4], "py": [8, 12, 10, 16, 2], "pz": [0, 0, 0, 0, 2], "nx": [8, 0, 12, 4, 0], "ny": [4, 1, 12, 2, 19], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [18, 9], "py": [15, 3], "pz": [0, -1], "nx": [8, 15], "ny": [9, 14], "nz": [1, 0] }, { "size": 5, "px": [4, 2, 3, 4, 9], "py": [9, 4, 3, 8, 23], "pz": [1, 2, 1, 1, 0], "nx": [11, 23, 23, 11, 11], "ny": [0, 2, 3, 1, 1], "nz": [1, 0, 0, 1, -1] }, { "size": 2, "px": [6, 7], "py": [1, 1], "pz": [0, 0], "nx": [3, 4], "ny": [10, 5], "nz": [1, -1] }, { "size": 4, "px": [11, 9, 8, 5], "py": [12, 15, 13, 3], "pz": [0, -1, -1, -1], "nx": [3, 12, 14, 13], "ny": [0, 3, 3, 3], "nz": [2, 0, 0, 0] }, { "size": 2, "px": [11, 11], "py": [6, 5], "pz": [0, 0], "nx": [8, 11], "ny": [4, 20], "nz": [1, -1] }, { "size": 5, "px": [21, 20, 21, 21, 21], "py": [18, 21, 17, 19, 19], "pz": [0, 0, 0, 0, -1], "nx": [2, 5, 4, 4, 5], "ny": [5, 12, 11, 10, 10], "nz": [1, 0, 0, 0, 0] }, { "size": 5, "px": [1, 1, 1, 1, 1], "py": [10, 11, 7, 9, 8], "pz": [0, 0, 0, 0, 0], "nx": [11, 23, 23, 23, 23], "ny": [10, 20, 21, 19, 19], "nz": [1, 0, 0, 0, -1] }, { "size": 5, "px": [7, 8, 7, 3, 1], "py": [14, 13, 13, 2, 2], "pz": [0, 0, -1, -1, -1], "nx": [1, 10, 2, 2, 10], "ny": [2, 13, 4, 16, 12], "nz": [2, 0, 1, 0, 0] }, { "size": 2, "px": [17, 18], "py": [12, 12], "pz": [0, 0], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [17, 0], "py": [5, 20], "pz": [0, -1], "nx": [4, 9], "ny": [0, 2], "nz": [2, 1] }, { "size": 5, "px": [22, 22, 22, 11, 23], "py": [16, 15, 14, 6, 13], "pz": [0, 0, 0, 1, 0], "nx": [16, 15, 7, 9, 9], "ny": [15, 8, 4, 10, 10], "nz": [0, 0, 1, 1, -1] }, { "size": 2, "px": [13, 3], "py": [3, 1], "pz": [0, 2], "nx": [8, 3], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [5, 6], "py": [4, 1], "pz": [1, -1], "nx": [6, 3], "ny": [4, 2], "nz": [1, 2] }, { "size": 3, "px": [4, 2, 6], "py": [6, 3, 4], "pz": [1, 2, 1], "nx": [10, 0, 4], "ny": [9, 4, 3], "nz": [0, -1, -1] }, { "size": 4, "px": [2, 8, 4, 10], "py": [4, 23, 7, 23], "pz": [2, 0, 1, 0], "nx": [9, 4, 11, 9], "ny": [21, 5, 16, 0], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [6, 3], "py": [13, 0], "pz": [0, -1], "nx": [8, 2], "ny": [11, 2], "nz": [0, 2] }, { "size": 2, "px": [3, 3], "py": [1, 4], "pz": [1, -1], "nx": [3, 5], "ny": [0, 1], "nz": [1, 0] }, { "size": 2, "px": [7, 2], "py": [0, 0], "pz": [0, 2], "nx": [2, 10], "ny": [1, 6], "nz": [2, 0] }, { "size": 2, "px": [10, 2], "py": [7, 0], "pz": [1, -1], "nx": [21, 5], "ny": [15, 4], "nz": [0, 2] }, { "size": 2, "px": [1, 1], "py": [10, 9], "pz": [0, 0], "nx": [0, 3], "ny": [13, 11], "nz": [0, -1] }, { "size": 2, "px": [11, 9], "py": [13, 0], "pz": [0, -1], "nx": [3, 3], "ny": [4, 3], "nz": [1, 1] }, { "size": 5, "px": [14, 13, 13, 14, 14], "py": [12, 10, 11, 13, 13], "pz": [0, 0, 0, 0, -1], "nx": [9, 8, 4, 5, 7], "ny": [4, 4, 2, 2, 4], "nz": [0, 0, 1, 1, 0] }, { "size": 3, "px": [2, 4, 1], "py": [2, 0, 0], "pz": [0, 0, 1], "nx": [0, 7, 4], "ny": [0, 3, 2], "nz": [1, -1, -1] }, { "size": 2, "px": [11, 4], "py": [5, 0], "pz": [0, -1], "nx": [8, 6], "ny": [4, 9], "nz": [1, 1] }, { "size": 3, "px": [0, 0, 0], "py": [20, 2, 4], "pz": [0, -1, -1], "nx": [12, 3, 10], "ny": [3, 1, 3], "nz": [0, 2, 0] }, { "size": 5, "px": [5, 11, 10, 13, 13], "py": [0, 0, 0, 2, 2], "pz": [1, 0, 0, 0, -1], "nx": [4, 5, 5, 4, 5], "ny": [14, 0, 2, 6, 1], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 11], "ny": [4, 1], "nz": [1, -1] }, { "size": 2, "px": [14, -1715597992], "py": [19, 9], "pz": [0, -1], "nx": [7, 14], "ny": [10, 17], "nz": [1, 0] }, { "size": 2, "px": [11, 1], "py": [9, 0], "pz": [0, -1], "nx": [1, 12], "ny": [2, 10], "nz": [2, 0] }, { "size": 2, "px": [17, 9], "py": [13, 17], "pz": [0, -1], "nx": [8, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [0, 7], "py": [1, 9], "pz": [1, -1], "nx": [18, 4], "ny": [14, 2], "nz": [0, 2] }, { "size": 2, "px": [14, 7], "py": [23, 9], "pz": [0, -1], "nx": [4, 8], "ny": [5, 10], "nz": [2, 1] }, { "size": 2, "px": [8, 7], "py": [17, 9], "pz": [0, -1], "nx": [3, 2], "ny": [0, 3], "nz": [0, 0] }, { "size": 2, "px": [13, 4], "py": [20, 1], "pz": [0, -1], "nx": [5, 3], "ny": [21, 17], "nz": [0, 0] }, { "size": 3, "px": [0, 0, 1], "py": [3, 6, 15], "pz": [2, 1, 0], "nx": [10, 8, 3], "ny": [6, 4, 2], "nz": [0, -1, -1] }, { "size": 2, "px": [8, 8], "py": [18, 8], "pz": [0, -1], "nx": [5, 4], "ny": [8, 10], "nz": [1, 1] }, { "size": 2, "px": [6, 5], "py": [2, 2], "pz": [1, 1], "nx": [8, 9], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [6, 3], "py": [11, 5], "pz": [1, 2], "nx": [13, 3], "ny": [19, 2], "nz": [0, -1] }, { "size": 2, "px": [4, 6], "py": [1, 11], "pz": [2, -1], "nx": [3, 2], "ny": [1, 0], "nz": [1, 2] }, { "size": 2, "px": [9, 4], "py": [10, 5], "pz": [1, 2], "nx": [8, 4], "ny": [10, 4], "nz": [1, -1] }, { "size": 2, "px": [12, 12], "py": [11, 20], "pz": [0, -1], "nx": [0, 0], "ny": [6, 10], "nz": [1, 0] }, { "size": 2, "px": [7, 12], "py": [2, 20], "pz": [0, -1], "nx": [2, 2], "ny": [2, 3], "nz": [2, 2] }, { "size": 2, "px": [0, 15], "py": [5, 21], "pz": [1, -1], "nx": [10, 9], "ny": [3, 3], "nz": [0, 1] }, { "size": 2, "px": [15, 9], "py": [1, 0], "pz": [0, 1], "nx": [19, 3], "ny": [0, 3], "nz": [0, -1] }, { "size": 2, "px": [21, 5], "py": [13, 5], "pz": [0, 2], "nx": [23, 6], "ny": [23, 5], "nz": [0, -1] }, { "size": 2, "px": [5, 8], "py": [3, 1], "pz": [2, -1], "nx": [9, 9], "ny": [6, 5], "nz": [1, 1] }, { "size": 2, "px": [2, 2], "py": [7, 7], "pz": [1, -1], "nx": [5, 3], "ny": [23, 17], "nz": [0, 0] }, { "size": 2, "px": [11, 3], "py": [6, 4], "pz": [0, -1], "nx": [2, 4], "ny": [2, 4], "nz": [2, 1] }, { "size": 3, "px": [14, 0, 17], "py": [20, 3, 21], "pz": [0, -1, -1], "nx": [11, 11, 11], "ny": [7, 9, 10], "nz": [1, 1, 1] }, { "size": 5, "px": [11, 11, 23, 23, 12], "py": [10, 11, 21, 20, 12], "pz": [1, 1, 0, 0, 0], "nx": [8, 3, 6, 7, 7], "ny": [4, 5, 11, 11, 11], "nz": [1, 2, 1, 1, -1] }, { "size": 2, "px": [11, 11], "py": [11, 10], "pz": [0, 0], "nx": [9, 3], "ny": [2, 5], "nz": [1, -1] }, { "size": 2, "px": [12, 14], "py": [19, 19], "pz": [0, 0], "nx": [12, 13], "ny": [18, 17], "nz": [0, -1] }, { "size": 5, "px": [13, 14, 12, 15, 14], "py": [0, 0, 1, 1, 1], "pz": [0, 0, 0, 0, 0], "nx": [4, 8, 4, 7, 7], "ny": [3, 4, 2, 5, 5], "nz": [2, 1, 2, 1, -1] }, { "size": 2, "px": [17, 5], "py": [10, 2], "pz": [0, -1], "nx": [4, 9], "ny": [2, 3], "nz": [2, 1] }, { "size": 2, "px": [18, 10], "py": [6, 10], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [8, 18, 8, 4, 16], "py": [6, 12, 9, 4, 13], "pz": [1, 0, 1, 2, 0], "nx": [3, 4, 3, 5, 5], "ny": [0, 2, 3, 1, 1], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [3, 6], "py": [2, 4], "pz": [2, 1], "nx": [8, 0], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [4, 5], "pz": [2, -1], "nx": [4, 2], "ny": [14, 7], "nz": [0, 1] }, { "size": 4, "px": [3, 4, 4, 3], "py": [11, 12, 12, 2], "pz": [0, 0, -1, -1], "nx": [1, 2, 1, 2], "ny": [11, 14, 12, 16], "nz": [0, 0, 0, 0] }, { "size": 2, "px": [6, 0], "py": [11, 0], "pz": [0, -1], "nx": [3, 4], "ny": [4, 5], "nz": [1, 1] }, { "size": 2, "px": [3, 2], "py": [21, 11], "pz": [0, 1], "nx": [3, 2], "ny": [10, 0], "nz": [1, -1] }, { "size": 3, "px": [10, 3, 13], "py": [2, 0, 2], "pz": [0, 2, 0], "nx": [7, 16, 1], "ny": [10, 4, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [6, 12], "py": [2, 5], "pz": [1, 0], "nx": [6, 18], "ny": [1, 19], "nz": [1, -1] }, { "size": 2, "px": [3, 16], "py": [0, 16], "pz": [1, -1], "nx": [11, 2], "ny": [5, 1], "nz": [0, 2] }, { "size": 2, "px": [11, 10], "py": [13, 1], "pz": [0, -1], "nx": [1, 1], "ny": [22, 21], "nz": [0, 0] }, { "size": 2, "px": [11, 10], "py": [18, 18], "pz": [0, 0], "nx": [5, 8], "ny": [9, 0], "nz": [1, -1] }, { "size": 2, "px": [3, 2], "py": [20, 18], "pz": [0, 0], "nx": [8, 3], "ny": [5, 1], "nz": [1, -1] }, { "size": 2, "px": [14, 2], "py": [17, 1], "pz": [0, -1], "nx": [14, 13], "ny": [15, 15], "nz": [0, 0] }, { "size": 2, "px": [3, 4], "py": [2, 3], "pz": [2, 2], "nx": [8, 3], "ny": [4, 0], "nz": [1, -1] }, { "size": 5, "px": [8, 18, 18, 8, 7], "py": [6, 11, 11, 7, 9], "pz": [1, 0, -1, -1, -1], "nx": [5, 13, 5, 11, 5], "ny": [3, 11, 0, 8, 2], "nz": [2, 0, 2, 1, 2] }, { "size": 5, "px": [12, 0, 5, 4, 7], "py": [15, 0, 4, 0, 9], "pz": [0, -1, -1, -1, -1], "nx": [8, 7, 4, 16, 6], "ny": [17, 12, 9, 10, 12], "nz": [0, 0, 1, 0, 0] }, { "size": 2, "px": [6, 7], "py": [14, 1], "pz": [0, -1], "nx": [5, 4], "ny": [9, 4], "nz": [1, 1] }, { "size": 4, "px": [8, 0, 22, 4], "py": [4, 4, 23, 0], "pz": [0, -1, -1, -1], "nx": [2, 4, 2, 5], "ny": [0, 1, 2, 9], "nz": [2, 1, 2, 1] }, { "size": 5, "px": [9, 9, 10, 10, 8], "py": [0, 1, 1, 2, 0], "pz": [1, 1, 1, 1, 1], "nx": [4, 16, 16, 16, 6], "ny": [2, 11, 11, 11, 12], "nz": [2, 0, -1, -1, -1] }, { "size": 2, "px": [6, 6], "py": [6, 5], "pz": [1, 1], "nx": [0, 4], "ny": [3, 2], "nz": [1, -1] }, { "size": 3, "px": [10, 3, 4], "py": [5, 9, 8], "pz": [1, -1, -1], "nx": [11, 23, 23], "ny": [7, 12, 11], "nz": [1, 0, 0] }, { "size": 3, "px": [13, 12, 7], "py": [19, 19, 10], "pz": [0, 0, 1], "nx": [13, 5, 19], "ny": [20, 15, 22], "nz": [0, -1, -1] }, { "size": 2, "px": [12, 12], "py": [12, 13], "pz": [0, 0], "nx": [9, 10], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [0, 12], "py": [1, 13], "pz": [2, -1], "nx": [2, 7], "ny": [2, 13], "nz": [2, 0] }, { "size": 2, "px": [10, 10], "py": [8, 9], "pz": [1, 1], "nx": [19, 7], "ny": [23, 13], "nz": [0, -1] }, { "size": 4, "px": [8, 7, 23, 15], "py": [11, 12, 4, 21], "pz": [0, 0, -1, -1], "nx": [2, 5, 1, 10], "ny": [6, 6, 2, 13], "nz": [0, 1, 1, 0] }, { "size": 2, "px": [10, 9], "py": [3, 3], "pz": [0, 0], "nx": [2, 3], "ny": [2, 4], "nz": [2, -1] }, { "size": 2, "px": [5, 2], "py": [3, 4], "pz": [2, -1], "nx": [3, 6], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [7, 11], "py": [20, 16], "pz": [0, -1], "nx": [2, 4], "ny": [5, 20], "nz": [2, 0] }, { "size": 2, "px": [9, 7], "py": [7, 5], "pz": [1, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [4, 2], "py": [11, 3], "pz": [1, 2], "nx": [5, 5], "ny": [3, 5], "nz": [2, -1] }, { "size": 2, "px": [11, 3], "py": [11, 5], "pz": [1, -1], "nx": [4, 1], "ny": [12, 3], "nz": [0, 2] }, { "size": 2, "px": [9, 11], "py": [6, 4], "pz": [1, -1], "nx": [10, 20], "ny": [9, 18], "nz": [1, 0] }, { "size": 5, "px": [2, 2, 2, 2, 1], "py": [15, 13, 16, 14, 7], "pz": [0, 0, 0, 0, 1], "nx": [15, 8, 9, 8, 4], "ny": [11, 6, 5, 5, 4], "nz": [0, 1, 1, 1, -1] }, { "size": 2, "px": [12, 2], "py": [5, 5], "pz": [0, -1], "nx": [3, 2], "ny": [7, 2], "nz": [1, 2] }, { "size": 2, "px": [5, 11], "py": [1, 3], "pz": [2, 1], "nx": [10, 10], "ny": [3, 3], "nz": [1, -1] }, { "size": 2, "px": [17, 11], "py": [13, 18], "pz": [0, -1], "nx": [6, 9], "ny": [9, 4], "nz": [1, 1] }, { "size": 5, "px": [5, 1, 2, 5, 6], "py": [14, 4, 9, 15, 23], "pz": [0, 2, 1, 0, 0], "nx": [4, 9, 18, 16, 17], "ny": [0, 1, 1, 0, 0], "nz": [2, 1, 0, 0, 0] }, { "size": 2, "px": [16, 17], "py": [0, 0], "pz": [0, 0], "nx": [23, 23], "ny": [5, 4], "nz": [0, -1] }, { "size": 2, "px": [13, 8], "py": [20, 6], "pz": [0, -1], "nx": [5, 6], "ny": [12, 10], "nz": [0, 1] }, { "size": 2, "px": [6, 15], "py": [15, 0], "pz": [0, -1], "nx": [6, 3], "ny": [16, 4], "nz": [0, 1] }, { "size": 2, "px": [18, 20], "py": [7, 8], "pz": [0, 0], "nx": [18, 11], "ny": [9, 14], "nz": [0, -1] }, { "size": 2, "px": [9, 4], "py": [12, 6], "pz": [0, 1], "nx": [3, 15], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [5, 2], "pz": [1, 2], "nx": [5, 5], "ny": [2, 2], "nz": [1, -1] }, { "size": 2, "px": [5, 20], "py": [1, 20], "pz": [1, -1], "nx": [15, 17], "ny": [1, 2], "nz": [0, 0] }, { "size": 2, "px": [7, 2], "py": [16, 4], "pz": [0, 2], "nx": [4, 0], "ny": [10, 6], "nz": [1, -1] }, { "size": 2, "px": [3, 8], "py": [5, 0], "pz": [1, -1], "nx": [1, 1], "ny": [10, 18], "nz": [1, 0] }, { "size": 2, "px": [22, 0], "py": [3, 0], "pz": [0, -1], "nx": [23, 11], "ny": [4, 1], "nz": [0, 1] }, { "size": 3, "px": [19, 10, 20], "py": [21, 8, 18], "pz": [0, 1, 0], "nx": [3, 6, 20], "ny": [5, 11, 14], "nz": [2, -1, -1] }, { "size": 4, "px": [2, 1, 6, 5], "py": [7, 4, 23, 22], "pz": [1, 2, 0, 0], "nx": [9, 19, 20, 4], "ny": [8, 11, 9, 2], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [3, 6], "py": [2, 11], "pz": [2, 1], "nx": [12, 10], "ny": [21, 9], "nz": [0, -1] }, { "size": 4, "px": [6, 0, 2, 2], "py": [6, 1, 4, 1], "pz": [1, -1, -1, -1], "nx": [0, 0, 0, 0], "ny": [5, 8, 9, 4], "nz": [1, 0, 0, 1] }, { "size": 5, "px": [3, 13, 6, 11, 9], "py": [0, 3, 1, 1, 2], "pz": [2, 0, 1, 0, 0], "nx": [7, 20, 16, 4, 7], "ny": [7, 2, 19, 2, 6], "nz": [1, 0, 0, 2, 1] }, { "size": 4, "px": [7, 5, 2, 6], "py": [7, 7, 4, 11], "pz": [0, 0, 2, 1], "nx": [7, 1, 21, 0], "ny": [8, 4, 11, 3], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [2, 2], "py": [3, 2], "pz": [2, 2], "nx": [8, 9], "ny": [3, 11], "nz": [1, -1] }, { "size": 2, "px": [7, 13], "py": [3, 5], "pz": [1, 0], "nx": [4, 3], "ny": [2, 2], "nz": [1, -1] }, { "size": 4, "px": [3, 12, 13, 11], "py": [0, 1, 1, 1], "pz": [2, 0, 0, 0], "nx": [8, 9, 13, 0], "ny": [4, 1, 16, 3], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [10, 1], "py": [4, 14], "pz": [0, -1], "nx": [5, 10], "ny": [1, 2], "nz": [1, 0] }, { "size": 2, "px": [11, 12], "py": [21, 21], "pz": [0, 0], "nx": [10, 11], "ny": [19, 19], "nz": [0, 0] }, { "size": 2, "px": [8, 12], "py": [6, 21], "pz": [1, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [11, 7], "py": [19, 0], "pz": [0, -1], "nx": [6, 5], "ny": [9, 11], "nz": [1, 1] }, { "size": 5, "px": [11, 11, 11, 10, 10], "py": [10, 12, 11, 13, 13], "pz": [0, 0, 0, 0, -1], "nx": [7, 13, 6, 12, 7], "ny": [10, 6, 3, 6, 11], "nz": [0, 0, 1, 0, 0] }, { "size": 2, "px": [12, 11], "py": [6, 12], "pz": [0, -1], "nx": [4, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 5, "px": [16, 15, 16, 15, 17], "py": [1, 0, 0, 1, 1], "pz": [0, 0, 0, 0, 0], "nx": [13, 7, 6, 12, 12], "ny": [5, 4, 3, 6, 6], "nz": [0, 1, 1, 0, -1] }, { "size": 2, "px": [2, 3], "py": [1, 3], "pz": [2, 1], "nx": [1, 5], "ny": [1, 3], "nz": [2, -1] }, { "size": 2, "px": [6, 3], "py": [13, 6], "pz": [0, 1], "nx": [4, 9], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [0, 3], "py": [4, 3], "pz": [1, -1], "nx": [4, 8], "ny": [3, 6], "nz": [2, 1] }, { "size": 2, "px": [6, 3], "py": [2, 1], "pz": [0, 1], "nx": [5, 5], "ny": [7, 21], "nz": [1, -1] }, { "size": 2, "px": [8, 4], "py": [0, 0], "pz": [1, -1], "nx": [19, 17], "ny": [1, 0], "nz": [0, 0] }, { "size": 4, "px": [8, 11, 5, 0], "py": [6, 1, 1, 22], "pz": [1, -1, -1, -1], "nx": [0, 10, 10, 1], "ny": [6, 12, 13, 4], "nz": [1, 0, 0, 1] }, { "size": 2, "px": [8, 17], "py": [6, 13], "pz": [1, 0], "nx": [14, 17], "ny": [9, 3], "nz": [0, -1] }, { "size": 2, "px": [5, 8], "py": [0, 4], "pz": [2, -1], "nx": [9, 8], "ny": [1, 1], "nz": [0, 0] }, { "size": 2, "px": [11, 14], "py": [13, 9], "pz": [0, -1], "nx": [23, 23], "ny": [21, 19], "nz": [0, 0] }, { "size": 2, "px": [10, 9], "py": [9, 3], "pz": [0, -1], "nx": [6, 3], "ny": [2, 1], "nz": [1, 2] }, { "size": 2, "px": [11, 1], "py": [4, 4], "pz": [0, -1], "nx": [2, 4], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [5, 9], "py": [3, 3], "pz": [2, -1], "nx": [17, 9], "ny": [12, 5], "nz": [0, 1] }, { "size": 2, "px": [9, 7], "py": [18, 16], "pz": [0, -1], "nx": [5, 2], "ny": [9, 5], "nz": [1, 2] }, { "size": 2, "px": [3, 6], "py": [0, 1], "pz": [1, -1], "nx": [4, 5], "ny": [1, 0], "nz": [0, 0] }], "alpha": [-1.149973e+00, 1.149973e+00, -6.844773e-01, 6.844773e-01, -6.635048e-01, 6.635048e-01, -4.888349e-01, 4.888349e-01, -4.267976e-01, 4.267976e-01, -4.258100e-01, 4.258100e-01, -4.815853e-01, 4.815853e-01, -4.091859e-01, 4.091859e-01, -3.137414e-01, 3.137414e-01, -3.339860e-01, 3.339860e-01, -3.891196e-01, 3.891196e-01, -4.167691e-01, 4.167691e-01, -3.186609e-01, 3.186609e-01, -2.957171e-01, 2.957171e-01, -3.210062e-01, 3.210062e-01, -2.725684e-01, 2.725684e-01, -2.452176e-01, 2.452176e-01, -2.812662e-01, 2.812662e-01, -3.029622e-01, 3.029622e-01, -3.293745e-01, 3.293745e-01, -3.441536e-01, 3.441536e-01, -2.946918e-01, 2.946918e-01, -2.890545e-01, 2.890545e-01, -1.949205e-01, 1.949205e-01, -2.176102e-01, 2.176102e-01, -2.595190e-01, 2.595190e-01, -2.690931e-01, 2.690931e-01, -2.130294e-01, 2.130294e-01, -2.316308e-01, 2.316308e-01, -2.798562e-01, 2.798562e-01, -2.146988e-01, 2.146988e-01, -2.332089e-01, 2.332089e-01, -2.470614e-01, 2.470614e-01, -2.204300e-01, 2.204300e-01, -2.272045e-01, 2.272045e-01, -2.583686e-01, 2.583686e-01, -2.072299e-01, 2.072299e-01, -1.834971e-01, 1.834971e-01, -2.332656e-01, 2.332656e-01, -3.271297e-01, 3.271297e-01, -2.401937e-01, 2.401937e-01, -2.006316e-01, 2.006316e-01, -2.401947e-01, 2.401947e-01, -2.475346e-01, 2.475346e-01, -2.579532e-01, 2.579532e-01, -2.466235e-01, 2.466235e-01, -1.787582e-01, 1.787582e-01, -2.036892e-01, 2.036892e-01, -1.665028e-01, 1.665028e-01, -1.576510e-01, 1.576510e-01, -2.036997e-01, 2.036997e-01, -2.040734e-01, 2.040734e-01, -1.792532e-01, 1.792532e-01, -2.174767e-01, 2.174767e-01, -1.876948e-01, 1.876948e-01, -1.883137e-01, 1.883137e-01, -1.923872e-01, 1.923872e-01, -2.620218e-01, 2.620218e-01, -1.659873e-01, 1.659873e-01, -1.475948e-01, 1.475948e-01, -1.731607e-01, 1.731607e-01, -2.059256e-01, 2.059256e-01, -1.586309e-01, 1.586309e-01, -1.607668e-01, 1.607668e-01, -1.975101e-01, 1.975101e-01, -2.130745e-01, 2.130745e-01, -1.898872e-01, 1.898872e-01, -2.052598e-01, 2.052598e-01, -1.599397e-01, 1.599397e-01, -1.770134e-01, 1.770134e-01, -1.888249e-01, 1.888249e-01, -1.515406e-01, 1.515406e-01, -1.907771e-01, 1.907771e-01, -1.698406e-01, 1.698406e-01, -2.079535e-01, 2.079535e-01, -1.966967e-01, 1.966967e-01, -1.631391e-01, 1.631391e-01, -2.158666e-01, 2.158666e-01, -2.891774e-01, 2.891774e-01, -1.581556e-01, 1.581556e-01, -1.475359e-01, 1.475359e-01, -1.806169e-01, 1.806169e-01, -1.782238e-01, 1.782238e-01, -1.660440e-01, 1.660440e-01, -1.576919e-01, 1.576919e-01, -1.741775e-01, 1.741775e-01, -1.427265e-01, 1.427265e-01, -1.695880e-01, 1.695880e-01, -1.486712e-01, 1.486712e-01, -1.533565e-01, 1.533565e-01, -1.601464e-01, 1.601464e-01, -1.978414e-01, 1.978414e-01, -1.746566e-01, 1.746566e-01, -1.794736e-01, 1.794736e-01, -1.896567e-01, 1.896567e-01, -1.666197e-01, 1.666197e-01, -1.969351e-01, 1.969351e-01, -2.321735e-01, 2.321735e-01, -1.592485e-01, 1.592485e-01, -1.671464e-01, 1.671464e-01, -1.688885e-01, 1.688885e-01, -1.868042e-01, 1.868042e-01, -1.301138e-01, 1.301138e-01, -1.330094e-01, 1.330094e-01, -1.268423e-01, 1.268423e-01, -1.820868e-01, 1.820868e-01, -1.881020e-01, 1.881020e-01, -1.580814e-01, 1.580814e-01, -1.302653e-01, 1.302653e-01, -1.787262e-01, 1.787262e-01, -1.658453e-01, 1.658453e-01, -1.240772e-01, 1.240772e-01, -1.315621e-01, 1.315621e-01, -1.756341e-01, 1.756341e-01, -1.429438e-01, 1.429438e-01, -1.351775e-01, 1.351775e-01, -2.035692e-01, 2.035692e-01, -1.267670e-01, 1.267670e-01, -1.288470e-01, 1.288470e-01, -1.393648e-01, 1.393648e-01, -1.755962e-01, 1.755962e-01, -1.308445e-01, 1.308445e-01, -1.703894e-01, 1.703894e-01, -1.461334e-01, 1.461334e-01, -1.368683e-01, 1.368683e-01, -1.244085e-01, 1.244085e-01, -1.718163e-01, 1.718163e-01, -1.415624e-01, 1.415624e-01, -1.752024e-01, 1.752024e-01, -1.666463e-01, 1.666463e-01, -1.407325e-01, 1.407325e-01, -1.258317e-01, 1.258317e-01, -1.416511e-01, 1.416511e-01, -1.420816e-01, 1.420816e-01, -1.562547e-01, 1.562547e-01, -1.542952e-01, 1.542952e-01, -1.158829e-01, 1.158829e-01, -1.392875e-01, 1.392875e-01, -1.610095e-01, 1.610095e-01, -1.546440e-01, 1.546440e-01, -1.416235e-01, 1.416235e-01, -2.028817e-01, 2.028817e-01, -1.106779e-01, 1.106779e-01, -9.231660e-02, 9.231660e-02, -1.164460e-01, 1.164460e-01, -1.701578e-01, 1.701578e-01, -1.277995e-01, 1.277995e-01, -1.946177e-01, 1.946177e-01, -1.394509e-01, 1.394509e-01, -1.370145e-01, 1.370145e-01, -1.446031e-01, 1.446031e-01, -1.665215e-01, 1.665215e-01, -1.435822e-01, 1.435822e-01, -1.559354e-01, 1.559354e-01, -1.591860e-01, 1.591860e-01, -1.193338e-01, 1.193338e-01, -1.236954e-01, 1.236954e-01, -1.209139e-01, 1.209139e-01, -1.267385e-01, 1.267385e-01, -1.232397e-01, 1.232397e-01, -1.299632e-01, 1.299632e-01, -1.302020e-01, 1.302020e-01, -1.202975e-01, 1.202975e-01, -1.525378e-01, 1.525378e-01, -1.123073e-01, 1.123073e-01, -1.605678e-01, 1.605678e-01, -1.406867e-01, 1.406867e-01, -1.354273e-01, 1.354273e-01, -1.393192e-01, 1.393192e-01, -1.278263e-01, 1.278263e-01, -1.172073e-01, 1.172073e-01, -1.153493e-01, 1.153493e-01, -1.356318e-01, 1.356318e-01, -1.316614e-01, 1.316614e-01, -1.374489e-01, 1.374489e-01, -1.018254e-01, 1.018254e-01, -1.473336e-01, 1.473336e-01, -1.289687e-01, 1.289687e-01, -1.299183e-01, 1.299183e-01, -1.178391e-01, 1.178391e-01, -1.619059e-01, 1.619059e-01, -1.842569e-01, 1.842569e-01, -1.829095e-01, 1.829095e-01, -1.939918e-01, 1.939918e-01, -1.395362e-01, 1.395362e-01, -1.774673e-01, 1.774673e-01, -1.688216e-01, 1.688216e-01, -1.671747e-01, 1.671747e-01, -1.850178e-01, 1.850178e-01, -1.106695e-01, 1.106695e-01, -1.258323e-01, 1.258323e-01, -1.246819e-01, 1.246819e-01, -9.892193e-02, 9.892193e-02, -1.399638e-01, 1.399638e-01, -1.228375e-01, 1.228375e-01, -1.756236e-01, 1.756236e-01, -1.360307e-01, 1.360307e-01, -1.266574e-01, 1.266574e-01, -1.372135e-01, 1.372135e-01, -1.175947e-01, 1.175947e-01, -1.330075e-01, 1.330075e-01, -1.396152e-01, 1.396152e-01, -2.088443e-01, 2.088443e-01] }, { "count": 301, "threshold": -4.887516e+00, "feature": [{ "size": 5, "px": [8, 11, 8, 14, 10], "py": [6, 9, 3, 3, 4], "pz": [1, 0, 0, 0, 0], "nx": [8, 7, 19, 7, 13], "ny": [11, 8, 8, 5, 8], "nz": [1, 1, 0, 1, 0] }, { "size": 5, "px": [14, 3, 13, 12, 12], "py": [4, 6, 4, 4, 8], "pz": [0, 1, 0, 0, 0], "nx": [2, 5, 2, 10, 10], "ny": [2, 8, 5, 8, 8], "nz": [2, 1, 2, 0, -1] }, { "size": 5, "px": [6, 5, 3, 7, 7], "py": [2, 3, 1, 2, 2], "pz": [0, 0, 1, 0, -1], "nx": [2, 2, 1, 2, 1], "ny": [3, 1, 2, 2, 2], "nz": [0, 0, 2, 0, 1] }, { "size": 5, "px": [3, 3, 6, 12, 8], "py": [4, 2, 4, 10, 17], "pz": [2, 2, 1, 0, 0], "nx": [4, 8, 8, 2, 1], "ny": [4, 4, 4, 2, 2], "nz": [1, 1, -1, -1, -1] }, { "size": 5, "px": [18, 19, 17, 9, 16], "py": [1, 2, 2, 0, 2], "pz": [0, 0, 0, 1, 0], "nx": [23, 23, 22, 22, 22], "ny": [4, 3, 1, 0, 2], "nz": [0, 0, 0, 0, 0] }, { "size": 3, "px": [15, 4, 14], "py": [23, 4, 18], "pz": [0, 2, 0], "nx": [7, 0, 5], "ny": [10, 4, 9], "nz": [1, -1, -1] }, { "size": 5, "px": [11, 11, 16, 11, 17], "py": [8, 6, 11, 7, 11], "pz": [0, 0, 0, 0, 0], "nx": [8, 4, 14, 14, 1], "ny": [4, 4, 8, 8, 5], "nz": [1, 1, 0, -1, -1] }, { "size": 5, "px": [12, 12, 12, 12, 12], "py": [13, 10, 11, 12, 12], "pz": [0, 0, 0, 0, -1], "nx": [4, 4, 1, 2, 9], "ny": [8, 10, 2, 4, 15], "nz": [0, 1, 2, 1, 0] }, { "size": 2, "px": [19, 0], "py": [14, 17], "pz": [0, -1], "nx": [20, 19], "ny": [15, 22], "nz": [0, 0] }, { "size": 5, "px": [3, 3, 1, 3, 5], "py": [13, 15, 6, 14, 22], "pz": [0, 0, 1, 0, 0], "nx": [0, 0, 1, 0, 0], "ny": [11, 21, 23, 5, 5], "nz": [1, 0, 0, 2, -1] }, { "size": 5, "px": [4, 2, 10, 4, 3], "py": [19, 4, 13, 16, 13], "pz": [0, 1, 0, 0, 0], "nx": [3, 20, 7, 4, 0], "ny": [4, 19, 5, 1, 5], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [11, 5], "py": [4, 4], "pz": [0, -1], "nx": [15, 3], "ny": [15, 1], "nz": [0, 2] }, { "size": 4, "px": [17, 17, 12, 11], "py": [14, 15, 18, 18], "pz": [0, 0, 0, 0], "nx": [11, 4, 1, 0], "ny": [17, 20, 8, 5], "nz": [0, -1, -1, -1] }, { "size": 5, "px": [6, 2, 1, 2, 11], "py": [14, 4, 1, 1, 18], "pz": [0, -1, -1, -1, -1], "nx": [5, 5, 3, 5, 2], "ny": [18, 17, 7, 9, 2], "nz": [0, 0, 1, 1, 2] }, { "size": 5, "px": [20, 19, 20, 15, 20], "py": [17, 20, 12, 12, 8], "pz": [0, 0, 0, 0, 0], "nx": [17, 0, 5, 2, 2], "ny": [8, 4, 9, 2, 2], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [6, 8], "py": [7, 11], "pz": [1, -1], "nx": [7, 8], "ny": [7, 10], "nz": [1, 1] }, { "size": 5, "px": [15, 16, 14, 8, 8], "py": [2, 2, 2, 0, 0], "pz": [0, 0, 0, 1, -1], "nx": [20, 11, 21, 18, 19], "ny": [3, 6, 5, 1, 2], "nz": [0, 1, 0, 0, 0] }, { "size": 4, "px": [17, 18, 9, 8], "py": [23, 21, 7, 8], "pz": [0, 0, 1, 1], "nx": [8, 17, 10, 18], "ny": [4, 12, 2, 1], "nz": [1, -1, -1, -1] }, { "size": 5, "px": [2, 2, 9, 4, 8], "py": [7, 3, 12, 12, 23], "pz": [1, 1, 0, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [3, 1, 2, 4, 4], "nz": [0, 0, 0, 0, -1] }, { "size": 3, "px": [7, 8, 5], "py": [22, 23, 9], "pz": [0, 0, 1], "nx": [9, 4, 2], "ny": [21, 4, 0], "nz": [0, -1, -1] }, { "size": 2, "px": [3, 3], "py": [7, 7], "pz": [1, -1], "nx": [3, 2], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [15, 11, 10, 3, 17], "py": [0, 1, 2, 3, 1], "pz": [0, 0, 0, 2, 0], "nx": [5, 8, 4, 3, 3], "ny": [9, 4, 7, 10, 10], "nz": [1, 1, 1, 1, -1] }, { "size": 3, "px": [22, 11, 22], "py": [12, 5, 14], "pz": [0, 1, 0], "nx": [23, 23, 3], "ny": [22, 23, 8], "nz": [0, 0, -1] }, { "size": 2, "px": [3, 11], "py": [7, 5], "pz": [1, -1], "nx": [8, 2], "ny": [14, 5], "nz": [0, 2] }, { "size": 4, "px": [17, 16, 2, 4], "py": [14, 13, 5, 0], "pz": [0, 0, -1, -1], "nx": [8, 9, 15, 8], "ny": [8, 9, 14, 7], "nz": [1, 1, 0, 1] }, { "size": 2, "px": [5, 16], "py": [6, 13], "pz": [1, -1], "nx": [2, 1], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [1, 0, 1, 2, 1], "py": [15, 2, 16, 19, 12], "pz": [0, 2, 0, 0, 0], "nx": [8, 7, 4, 9, 9], "ny": [5, 11, 4, 5, 5], "nz": [1, 1, 1, 1, -1] }, { "size": 2, "px": [8, 7], "py": [11, 12], "pz": [0, 0], "nx": [9, 1], "ny": [10, 16], "nz": [0, -1] }, { "size": 2, "px": [15, 13], "py": [17, 10], "pz": [0, -1], "nx": [7, 4], "ny": [8, 4], "nz": [1, 2] }, { "size": 5, "px": [11, 10, 7, 8, 9], "py": [0, 0, 1, 1, 1], "pz": [0, 0, 0, 0, 0], "nx": [4, 5, 4, 5, 6], "ny": [1, 0, 2, 1, 0], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [2, 2], "py": [4, 3], "pz": [2, 2], "nx": [3, 21], "ny": [4, 20], "nz": [1, -1] }, { "size": 5, "px": [10, 11, 5, 2, 11], "py": [12, 10, 6, 11, 11], "pz": [0, 0, 1, 0, 0], "nx": [4, 15, 16, 7, 7], "ny": [5, 10, 11, 10, 10], "nz": [1, 0, 0, 0, -1] }, { "size": 5, "px": [13, 14, 1, 11, 11], "py": [2, 2, 3, 2, 2], "pz": [0, 0, 2, 0, -1], "nx": [3, 0, 0, 1, 0], "ny": [23, 15, 14, 9, 8], "nz": [0, 0, 0, 1, 1] }, { "size": 2, "px": [17, 2], "py": [13, 5], "pz": [0, -1], "nx": [4, 9], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [10, 5], "py": [4, 1], "pz": [0, -1], "nx": [11, 3], "ny": [3, 0], "nz": [0, 2] }, { "size": 2, "px": [5, 3], "py": [3, 3], "pz": [2, -1], "nx": [11, 23], "ny": [8, 14], "nz": [1, 0] }, { "size": 3, "px": [22, 22, 22], "py": [16, 18, 9], "pz": [0, 0, 0], "nx": [13, 2, 0], "ny": [17, 3, 5], "nz": [0, -1, -1] }, { "size": 5, "px": [13, 10, 13, 14, 11], "py": [2, 2, 1, 2, 1], "pz": [0, 0, 0, 0, 0], "nx": [3, 3, 8, 6, 6], "ny": [2, 5, 4, 11, 11], "nz": [2, 2, 1, 1, -1] }, { "size": 3, "px": [12, 1, 1], "py": [14, 0, 1], "pz": [0, -1, -1], "nx": [8, 15, 7], "ny": [1, 2, 0], "nz": [1, 0, 1] }, { "size": 2, "px": [4, 5], "py": [20, 23], "pz": [0, 0], "nx": [3, 3], "ny": [10, 2], "nz": [1, -1] }, { "size": 2, "px": [2, 4], "py": [7, 2], "pz": [1, -1], "nx": [4, 3], "ny": [23, 16], "nz": [0, 0] }, { "size": 3, "px": [3, 3, 6], "py": [5, 2, 4], "pz": [2, 2, 1], "nx": [3, 1, 2], "ny": [5, 17, 0], "nz": [1, -1, -1] }, { "size": 2, "px": [14, 8], "py": [17, 6], "pz": [0, 1], "nx": [13, 10], "ny": [16, 9], "nz": [0, -1] }, { "size": 5, "px": [15, 7, 14, 13, 14], "py": [1, 0, 0, 0, 1], "pz": [0, 1, 0, 0, 0], "nx": [4, 4, 4, 8, 8], "ny": [5, 3, 2, 10, 10], "nz": [2, 2, 2, 1, -1] }, { "size": 5, "px": [8, 9, 4, 5, 4], "py": [13, 12, 9, 5, 7], "pz": [0, 0, 1, 1, 1], "nx": [22, 21, 22, 22, 22], "ny": [4, 0, 3, 2, 2], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [17, 17], "py": [16, 13], "pz": [0, 0], "nx": [14, 21], "ny": [8, 0], "nz": [0, -1] }, { "size": 2, "px": [16, 10], "py": [4, 9], "pz": [0, -1], "nx": [16, 10], "ny": [3, 3], "nz": [0, 1] }, { "size": 5, "px": [1, 1, 0, 1, 0], "py": [17, 16, 7, 15, 8], "pz": [0, 0, 1, 0, 0], "nx": [4, 3, 8, 9, 7], "ny": [3, 3, 6, 6, 6], "nz": [1, 1, 0, 0, -1] }, { "size": 2, "px": [3, 3], "py": [2, 3], "pz": [2, 2], "nx": [8, 3], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [10, 2], "py": [17, 4], "pz": [0, 2], "nx": [10, 12], "ny": [15, 14], "nz": [0, -1] }, { "size": 2, "px": [11, 11], "py": [14, 12], "pz": [0, 0], "nx": [9, 10], "ny": [13, 11], "nz": [0, 0] }, { "size": 2, "px": [12, 13], "py": [5, 5], "pz": [0, 0], "nx": [3, 4], "ny": [4, 1], "nz": [1, -1] }, { "size": 5, "px": [7, 10, 8, 11, 11], "py": [13, 2, 12, 2, 2], "pz": [0, 0, 0, 0, -1], "nx": [10, 1, 1, 10, 1], "ny": [12, 5, 3, 13, 1], "nz": [0, 1, 1, 0, 2] }, { "size": 2, "px": [6, 10], "py": [4, 2], "pz": [1, -1], "nx": [4, 6], "ny": [4, 9], "nz": [1, 1] }, { "size": 2, "px": [20, 20], "py": [21, 22], "pz": [0, 0], "nx": [15, 8], "ny": [5, 5], "nz": [0, -1] }, { "size": 2, "px": [4, 3], "py": [3, 3], "pz": [2, 2], "nx": [9, 17], "ny": [4, 15], "nz": [1, -1] }, { "size": 3, "px": [2, 2, 4], "py": [3, 3, 7], "pz": [2, -1, -1], "nx": [7, 4, 4], "ny": [6, 5, 4], "nz": [1, 2, 2] }, { "size": 5, "px": [8, 9, 16, 17, 17], "py": [1, 2, 1, 1, 1], "pz": [1, 1, 0, 0, -1], "nx": [2, 2, 4, 2, 4], "ny": [16, 14, 22, 15, 21], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [9, 9], "py": [18, 0], "pz": [0, -1], "nx": [2, 5], "ny": [5, 8], "nz": [2, 1] }, { "size": 2, "px": [7, 8], "py": [11, 11], "pz": [0, 0], "nx": [15, 5], "ny": [8, 8], "nz": [0, -1] }, { "size": 2, "px": [0, 3], "py": [4, 3], "pz": [2, -1], "nx": [1, 6], "ny": [4, 14], "nz": [2, 0] }, { "size": 2, "px": [6, 12], "py": [7, 11], "pz": [1, -1], "nx": [0, 0], "ny": [7, 12], "nz": [1, 0] }, { "size": 2, "px": [3, 7], "py": [10, 22], "pz": [1, 0], "nx": [4, 3], "ny": [10, 0], "nz": [1, -1] }, { "size": 2, "px": [5, 19], "py": [4, 21], "pz": [2, -1], "nx": [11, 11], "ny": [8, 9], "nz": [1, 1] }, { "size": 2, "px": [3, 3], "py": [8, 7], "pz": [1, 1], "nx": [4, 20], "ny": [4, 5], "nz": [1, -1] }, { "size": 5, "px": [11, 23, 23, 23, 23], "py": [7, 13, 19, 20, 21], "pz": [1, 0, 0, 0, 0], "nx": [4, 3, 2, 8, 8], "ny": [11, 5, 5, 23, 23], "nz": [1, 1, 2, 0, -1] }, { "size": 2, "px": [4, 1], "py": [0, 2], "pz": [0, 0], "nx": [0, 6], "ny": [0, 11], "nz": [0, -1] }, { "size": 2, "px": [11, 8], "py": [12, 1], "pz": [0, -1], "nx": [23, 23], "ny": [13, 12], "nz": [0, 0] }, { "size": 5, "px": [23, 11, 23, 11, 11], "py": [13, 7, 12, 5, 6], "pz": [0, 1, 0, 1, 1], "nx": [6, 3, 8, 7, 7], "ny": [12, 4, 4, 11, 11], "nz": [0, 1, 1, 0, -1] }, { "size": 2, "px": [20, 5], "py": [15, 5], "pz": [0, -1], "nx": [10, 10], "ny": [11, 10], "nz": [1, 1] }, { "size": 2, "px": [11, 4], "py": [19, 8], "pz": [0, 1], "nx": [11, 19], "ny": [18, 2], "nz": [0, -1] }, { "size": 2, "px": [14, 6], "py": [3, 4], "pz": [0, -1], "nx": [8, 15], "ny": [1, 0], "nz": [1, 0] }, { "size": 4, "px": [14, 5, 13, 12], "py": [23, 3, 23, 23], "pz": [0, 1, 0, 0], "nx": [12, 0, 1, 4], "ny": [21, 3, 2, 4], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [19, 5], "py": [12, 2], "pz": [0, -1], "nx": [4, 7], "ny": [3, 5], "nz": [2, 1] }, { "size": 2, "px": [0, 8], "py": [5, 3], "pz": [2, -1], "nx": [5, 22], "ny": [3, 11], "nz": [2, 0] }, { "size": 2, "px": [2, 6], "py": [3, 12], "pz": [2, 0], "nx": [3, 5], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [5, 5], "py": [0, 6], "pz": [2, -1], "nx": [14, 6], "ny": [4, 2], "nz": [0, 1] }, { "size": 2, "px": [16, 11], "py": [1, 0], "pz": [0, -1], "nx": [4, 8], "ny": [4, 10], "nz": [2, 1] }, { "size": 2, "px": [9, 4], "py": [4, 3], "pz": [1, 1], "nx": [5, 8], "ny": [0, 10], "nz": [2, -1] }, { "size": 2, "px": [16, 1], "py": [22, 1], "pz": [0, -1], "nx": [2, 2], "ny": [4, 2], "nz": [2, 2] }, { "size": 2, "px": [12, 2], "py": [11, 2], "pz": [0, -1], "nx": [5, 5], "ny": [1, 0], "nz": [2, 2] }, { "size": 2, "px": [11, 11], "py": [4, 3], "pz": [1, 1], "nx": [7, 5], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [9, 2], "py": [22, 3], "pz": [0, 2], "nx": [4, 9], "ny": [10, 11], "nz": [1, -1] }, { "size": 2, "px": [2, 4], "py": [8, 10], "pz": [1, -1], "nx": [5, 3], "ny": [23, 18], "nz": [0, 0] }, { "size": 2, "px": [12, 6], "py": [21, 9], "pz": [0, -1], "nx": [11, 23], "ny": [6, 10], "nz": [1, 0] }, { "size": 2, "px": [9, 9], "py": [8, 7], "pz": [1, 1], "nx": [18, 8], "ny": [18, 6], "nz": [0, -1] }, { "size": 2, "px": [13, 3], "py": [19, 0], "pz": [0, -1], "nx": [6, 5], "ny": [9, 11], "nz": [1, 1] }, { "size": 5, "px": [2, 10, 9, 7, 8], "py": [0, 1, 0, 1, 0], "pz": [2, 0, 0, 0, 0], "nx": [3, 4, 6, 8, 8], "ny": [2, 4, 9, 4, 4], "nz": [2, 1, 1, 1, -1] }, { "size": 2, "px": [8, 4], "py": [6, 3], "pz": [1, 2], "nx": [9, 4], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [0, 4], "py": [23, 3], "pz": [0, -1], "nx": [12, 9], "ny": [2, 2], "nz": [0, 0] }, { "size": 2, "px": [4, 2], "py": [10, 3], "pz": [1, 2], "nx": [0, 2], "ny": [23, 5], "nz": [0, -1] }, { "size": 2, "px": [12, 14], "py": [18, 0], "pz": [0, -1], "nx": [12, 8], "ny": [16, 10], "nz": [0, 1] }, { "size": 4, "px": [10, 18, 7, 5], "py": [14, 8, 0, 3], "pz": [0, -1, -1, -1], "nx": [8, 6, 8, 5], "ny": [11, 12, 5, 5], "nz": [0, 0, 1, 1] }, { "size": 2, "px": [6, 5], "py": [2, 2], "pz": [1, 1], "nx": [8, 8], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [12, 10], "py": [20, 20], "pz": [0, 0], "nx": [11, 10], "ny": [19, 19], "nz": [0, 0] }, { "size": 2, "px": [17, 10], "py": [16, 20], "pz": [0, -1], "nx": [8, 7], "ny": [4, 8], "nz": [1, 1] }, { "size": 3, "px": [2, 1, 3], "py": [20, 4, 21], "pz": [0, 2, 0], "nx": [3, 4, 0], "ny": [10, 1, 0], "nz": [1, -1, -1] }, { "size": 5, "px": [6, 7, 3, 6, 6], "py": [15, 14, 7, 16, 19], "pz": [0, 0, 1, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [18, 19, 16, 17, 17], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [8, 16], "py": [6, 12], "pz": [1, 0], "nx": [8, 15], "ny": [4, 10], "nz": [1, -1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [1, 3, 2, 0, 4], "pz": [2, 2, 2, 2, 1], "nx": [13, 8, 14, 4, 7], "ny": [23, 6, 23, 3, 9], "nz": [0, 1, 0, 2, -1] }, { "size": 2, "px": [3, 6], "py": [3, 5], "pz": [2, 1], "nx": [10, 8], "ny": [11, 6], "nz": [0, -1] }, { "size": 2, "px": [11, 10], "py": [4, 4], "pz": [0, 0], "nx": [8, 5], "ny": [4, 9], "nz": [1, -1] }, { "size": 5, "px": [15, 18, 9, 16, 4], "py": [12, 13, 6, 23, 3], "pz": [0, 0, 1, 0, 2], "nx": [6, 3, 6, 2, 7], "ny": [2, 3, 0, 1, 0], "nz": [0, 0, 0, 1, 0] }, { "size": 2, "px": [4, 18], "py": [12, 13], "pz": [0, -1], "nx": [2, 8], "ny": [3, 4], "nz": [2, 1] }, { "size": 2, "px": [4, 2], "py": [10, 4], "pz": [1, 2], "nx": [3, 3], "ny": [5, 0], "nz": [2, -1] }, { "size": 2, "px": [9, 19], "py": [7, 8], "pz": [1, 0], "nx": [8, 3], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [6, 0], "py": [6, 0], "pz": [0, -1], "nx": [0, 0], "ny": [7, 2], "nz": [1, 2] }, { "size": 2, "px": [8, 8], "py": [0, 0], "pz": [1, -1], "nx": [17, 18], "ny": [0, 2], "nz": [0, 0] }, { "size": 4, "px": [13, 4, 4, 1], "py": [14, 7, 3, 5], "pz": [0, -1, -1, -1], "nx": [3, 16, 3, 7], "ny": [1, 15, 5, 13], "nz": [2, 0, 2, 0] }, { "size": 2, "px": [4, 9], "py": [6, 11], "pz": [1, 0], "nx": [3, 23], "ny": [4, 8], "nz": [1, -1] }, { "size": 5, "px": [9, 17, 4, 16, 16], "py": [2, 3, 1, 3, 3], "pz": [1, 0, 2, 0, -1], "nx": [2, 3, 3, 2, 3], "ny": [1, 7, 2, 3, 3], "nz": [2, 1, 1, 1, 1] }, { "size": 2, "px": [10, 5], "py": [22, 9], "pz": [0, 1], "nx": [10, 3], "ny": [21, 2], "nz": [0, -1] }, { "size": 2, "px": [11, 11], "py": [6, 3], "pz": [0, -1], "nx": [8, 5], "ny": [4, 3], "nz": [1, 1] }, { "size": 2, "px": [10, 5], "py": [8, 3], "pz": [0, -1], "nx": [14, 5], "ny": [14, 2], "nz": [0, 2] }, { "size": 2, "px": [7, 8], "py": [3, 2], "pz": [0, -1], "nx": [8, 2], "ny": [18, 2], "nz": [0, 2] }, { "size": 2, "px": [1, 1], "py": [19, 11], "pz": [0, 1], "nx": [9, 4], "ny": [5, 1], "nz": [0, -1] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 3], "ny": [4, 4], "nz": [1, -1] }, { "size": 5, "px": [7, 15, 13, 14, 4], "py": [6, 12, 9, 11, 4], "pz": [1, 0, 0, 0, 2], "nx": [7, 3, 8, 4, 5], "ny": [0, 3, 0, 2, 1], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [10, 13, 7, 8, 9], "py": [0, 1, 1, 0, 1], "pz": [0, 0, 0, 0, 0], "nx": [7, 4, 4, 4, 8], "ny": [8, 3, 4, 2, 4], "nz": [1, 2, 2, 2, 1] }, { "size": 2, "px": [6, 1], "py": [6, 0], "pz": [1, -1], "nx": [11, 7], "ny": [3, 2], "nz": [0, 1] }, { "size": 2, "px": [13, 0], "py": [13, 2], "pz": [0, -1], "nx": [0, 1], "ny": [13, 16], "nz": [0, 0] }, { "size": 2, "px": [8, 17], "py": [6, 13], "pz": [1, 0], "nx": [8, 1], "ny": [4, 16], "nz": [1, -1] }, { "size": 5, "px": [12, 11, 3, 6, 17], "py": [4, 4, 1, 2, 14], "pz": [0, 0, 2, 1, 0], "nx": [6, 23, 23, 6, 23], "ny": [5, 7, 6, 6, 14], "nz": [1, 0, 0, 1, 0] }, { "size": 2, "px": [5, 22], "py": [4, 17], "pz": [2, -1], "nx": [4, 8], "ny": [5, 7], "nz": [2, 1] }, { "size": 2, "px": [15, 14], "py": [1, 1], "pz": [0, 0], "nx": [4, 7], "ny": [2, 4], "nz": [2, -1] }, { "size": 2, "px": [15, 17], "py": [12, 7], "pz": [0, -1], "nx": [14, 10], "ny": [11, 4], "nz": [0, 1] }, { "size": 4, "px": [10, 2, 9, 15], "py": [5, 11, 1, 13], "pz": [0, -1, -1, -1], "nx": [11, 3, 3, 13], "ny": [1, 1, 0, 1], "nz": [0, 2, 2, 0] }, { "size": 2, "px": [7, 21], "py": [15, 22], "pz": [0, -1], "nx": [4, 9], "ny": [8, 14], "nz": [1, 0] }, { "size": 2, "px": [6, 5], "py": [21, 2], "pz": [0, -1], "nx": [3, 5], "ny": [11, 21], "nz": [1, 0] }, { "size": 2, "px": [17, 7], "py": [2, 0], "pz": [0, -1], "nx": [4, 8], "ny": [5, 11], "nz": [2, 1] }, { "size": 2, "px": [11, 8], "py": [10, 4], "pz": [0, -1], "nx": [13, 12], "ny": [3, 3], "nz": [0, 0] }, { "size": 2, "px": [6, 5], "py": [2, 2], "pz": [1, 1], "nx": [7, 1], "ny": [8, 2], "nz": [0, -1] }, { "size": 5, "px": [0, 0, 1, 0, 0], "py": [12, 4, 14, 0, 2], "pz": [0, 1, 0, 2, 2], "nx": [9, 5, 8, 4, 4], "ny": [6, 3, 6, 3, 3], "nz": [0, 1, 0, 1, -1] }, { "size": 5, "px": [8, 0, 0, 3, 2], "py": [6, 5, 0, 8, 2], "pz": [1, -1, -1, -1, -1], "nx": [23, 7, 22, 11, 4], "ny": [12, 6, 14, 4, 3], "nz": [0, 1, 0, 1, 2] }, { "size": 4, "px": [12, 12, 4, 8], "py": [12, 11, 3, 10], "pz": [0, 0, -1, -1], "nx": [0, 0, 0, 0], "ny": [2, 1, 0, 3], "nz": [1, 2, 2, 1] }, { "size": 2, "px": [10, 6], "py": [7, 6], "pz": [1, -1], "nx": [16, 4], "ny": [12, 2], "nz": [0, 2] }, { "size": 5, "px": [2, 1, 3, 3, 3], "py": [14, 8, 20, 21, 21], "pz": [0, 1, 0, 0, -1], "nx": [20, 10, 21, 21, 21], "ny": [23, 11, 21, 23, 20], "nz": [0, 1, 0, 0, 0] }, { "size": 2, "px": [6, 13], "py": [2, 4], "pz": [1, 0], "nx": [7, 21], "ny": [8, 0], "nz": [0, -1] }, { "size": 2, "px": [12, 3], "py": [17, 4], "pz": [0, 2], "nx": [11, 10], "ny": [15, 7], "nz": [0, -1] }, { "size": 4, "px": [11, 0, 19, 2], "py": [15, 2, 23, 10], "pz": [0, -1, -1, -1], "nx": [6, 8, 16, 2], "ny": [13, 11, 10, 2], "nz": [0, 0, 0, 2] }, { "size": 2, "px": [6, 3], "py": [14, 7], "pz": [0, 1], "nx": [3, 1], "ny": [4, 1], "nz": [1, -1] }, { "size": 4, "px": [12, 17, 5, 10], "py": [19, 15, 14, 3], "pz": [0, -1, -1, -1], "nx": [4, 12, 6, 12], "ny": [4, 18, 9, 22], "nz": [1, 0, 1, 0] }, { "size": 2, "px": [8, 3], "py": [13, 5], "pz": [0, -1], "nx": [3, 4], "ny": [4, 9], "nz": [1, 1] }, { "size": 5, "px": [6, 5, 4, 5, 3], "py": [2, 1, 2, 2, 0], "pz": [0, 0, 0, 0, 1], "nx": [7, 4, 9, 18, 18], "ny": [4, 4, 7, 14, 14], "nz": [1, 1, 1, 0, -1] }, { "size": 4, "px": [8, 3, 20, 1], "py": [6, 3, 18, 0], "pz": [1, -1, -1, -1], "nx": [13, 11, 5, 22], "ny": [12, 6, 2, 17], "nz": [0, 1, 2, 0] }, { "size": 2, "px": [6, 3], "py": [6, 3], "pz": [1, 2], "nx": [8, 5], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [21, 7], "py": [14, 7], "pz": [0, 1], "nx": [16, 11], "ny": [14, 6], "nz": [0, -1] }, { "size": 2, "px": [10, 4], "py": [3, 1], "pz": [0, -1], "nx": [9, 5], "ny": [0, 0], "nz": [0, 1] }, { "size": 2, "px": [4, 10], "py": [5, 8], "pz": [2, 1], "nx": [5, 14], "ny": [9, 7], "nz": [1, -1] }, { "size": 2, "px": [9, 2], "py": [23, 4], "pz": [0, 2], "nx": [2, 2], "ny": [5, 5], "nz": [2, -1] }, { "size": 5, "px": [10, 9, 11, 10, 10], "py": [2, 2, 1, 1, 1], "pz": [0, 0, 0, 0, -1], "nx": [2, 3, 2, 4, 5], "ny": [4, 10, 2, 4, 3], "nz": [2, 1, 1, 0, 0] }, { "size": 2, "px": [11, 4], "py": [13, 4], "pz": [0, -1], "nx": [8, 4], "ny": [4, 1], "nz": [1, 2] }, { "size": 2, "px": [17, 5], "py": [15, 1], "pz": [0, -1], "nx": [20, 19], "ny": [14, 14], "nz": [0, 0] }, { "size": 2, "px": [2, 2], "py": [20, 18], "pz": [0, 0], "nx": [2, 1], "ny": [23, 5], "nz": [0, -1] }, { "size": 2, "px": [10, 1], "py": [18, 3], "pz": [0, 2], "nx": [11, 3], "ny": [16, 5], "nz": [0, -1] }, { "size": 2, "px": [3, 8], "py": [6, 10], "pz": [1, 0], "nx": [9, 0], "ny": [9, 3], "nz": [0, -1] }, { "size": 2, "px": [20, 10], "py": [21, 7], "pz": [0, 1], "nx": [7, 2], "ny": [3, 5], "nz": [1, -1] }, { "size": 2, "px": [10, 6], "py": [4, 7], "pz": [1, -1], "nx": [23, 5], "ny": [9, 2], "nz": [0, 2] }, { "size": 5, "px": [2, 4, 5, 3, 4], "py": [0, 1, 1, 2, 2], "pz": [1, 0, 0, 0, 0], "nx": [1, 0, 1, 1, 1], "ny": [2, 1, 0, 1, 1], "nz": [0, 1, 0, 0, -1] }, { "size": 2, "px": [8, 16], "py": [7, 13], "pz": [1, 0], "nx": [8, 3], "ny": [4, 16], "nz": [1, -1] }, { "size": 2, "px": [17, 15], "py": [7, 19], "pz": [0, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [4, 3], "py": [11, 5], "pz": [1, 2], "nx": [7, 8], "ny": [9, 4], "nz": [1, -1] }, { "size": 2, "px": [23, 11], "py": [9, 6], "pz": [0, 1], "nx": [22, 22], "ny": [23, 23], "nz": [0, -1] }, { "size": 2, "px": [23, 23], "py": [21, 20], "pz": [0, 0], "nx": [2, 2], "ny": [5, 4], "nz": [1, -1] }, { "size": 2, "px": [17, 4], "py": [12, 2], "pz": [0, -1], "nx": [9, 8], "ny": [4, 5], "nz": [1, 1] }, { "size": 2, "px": [6, 14], "py": [2, 4], "pz": [1, 0], "nx": [7, 18], "ny": [1, 1], "nz": [1, -1] }, { "size": 2, "px": [20, 22], "py": [1, 2], "pz": [0, 0], "nx": [23, 23], "ny": [1, 1], "nz": [0, -1] }, { "size": 2, "px": [0, 1], "py": [9, 10], "pz": [1, 1], "nx": [8, 0], "ny": [15, 0], "nz": [0, -1] }, { "size": 3, "px": [11, 11, 6], "py": [10, 11, 11], "pz": [0, 0, -1], "nx": [23, 23, 23], "ny": [19, 21, 20], "nz": [0, 0, 0] }, { "size": 5, "px": [23, 23, 23, 6, 6], "py": [21, 22, 22, 3, 6], "pz": [0, 0, -1, -1, -1], "nx": [8, 8, 8, 17, 4], "ny": [7, 10, 8, 16, 5], "nz": [1, 1, 1, 0, 2] }, { "size": 2, "px": [10, 23], "py": [1, 22], "pz": [0, -1], "nx": [7, 2], "ny": [11, 2], "nz": [0, 2] }, { "size": 2, "px": [7, 14], "py": [3, 10], "pz": [1, -1], "nx": [5, 3], "ny": [2, 1], "nz": [0, 1] }, { "size": 2, "px": [5, 3], "py": [13, 7], "pz": [0, 1], "nx": [4, 10], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [10, 0], "py": [15, 6], "pz": [0, -1], "nx": [3, 6], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [13, 4], "py": [18, 17], "pz": [0, -1], "nx": [7, 6], "ny": [10, 7], "nz": [1, 1] }, { "size": 2, "px": [12, 11], "py": [3, 8], "pz": [0, -1], "nx": [7, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [17, 4], "py": [5, 7], "pz": [0, 1], "nx": [17, 10], "ny": [4, 0], "nz": [0, -1] }, { "size": 5, "px": [16, 8, 16, 15, 15], "py": [0, 0, 1, 0, 1], "pz": [0, 1, 0, 0, 0], "nx": [7, 4, 7, 4, 4], "ny": [7, 5, 8, 1, 1], "nz": [1, 2, 1, 2, -1] }, { "size": 2, "px": [13, 11], "py": [5, 6], "pz": [0, -1], "nx": [4, 5], "ny": [2, 2], "nz": [1, 1] }, { "size": 2, "px": [3, 6], "py": [3, 6], "pz": [2, 1], "nx": [8, 4], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [10, 16], "py": [8, 10], "pz": [0, 0], "nx": [7, 2], "ny": [3, 3], "nz": [1, -1] }, { "size": 2, "px": [6, 8], "py": [4, 11], "pz": [1, 0], "nx": [10, 1], "ny": [9, 20], "nz": [0, -1] }, { "size": 2, "px": [5, 1], "py": [4, 2], "pz": [2, -1], "nx": [23, 23], "ny": [15, 16], "nz": [0, 0] }, { "size": 5, "px": [9, 8, 2, 4, 9], "py": [1, 1, 0, 1, 2], "pz": [0, 0, 2, 1, 0], "nx": [8, 3, 8, 4, 4], "ny": [6, 2, 4, 2, 2], "nz": [1, 2, 1, 2, -1] }, { "size": 2, "px": [13, 6], "py": [10, 5], "pz": [0, -1], "nx": [13, 7], "ny": [6, 3], "nz": [0, 1] }, { "size": 2, "px": [11, 5], "py": [10, 5], "pz": [1, 2], "nx": [10, 8], "ny": [10, 9], "nz": [1, -1] }, { "size": 2, "px": [7, 4], "py": [6, 3], "pz": [1, 2], "nx": [9, 14], "ny": [4, 9], "nz": [1, -1] }, { "size": 3, "px": [5, 2, 15], "py": [3, 1, 22], "pz": [1, -1, -1], "nx": [15, 9, 4], "ny": [0, 1, 0], "nz": [0, 1, 2] }, { "size": 2, "px": [10, 19], "py": [9, 21], "pz": [1, 0], "nx": [2, 17], "ny": [5, 14], "nz": [2, -1] }, { "size": 3, "px": [16, 2, 1], "py": [2, 10, 4], "pz": [0, -1, -1], "nx": [4, 4, 9], "ny": [3, 2, 6], "nz": [2, 2, 1] }, { "size": 2, "px": [10, 2], "py": [6, 10], "pz": [1, -1], "nx": [21, 22], "ny": [16, 12], "nz": [0, 0] }, { "size": 2, "px": [7, 16], "py": [4, 23], "pz": [0, -1], "nx": [7, 3], "ny": [3, 3], "nz": [0, 1] }, { "size": 2, "px": [1, 1], "py": [13, 14], "pz": [0, 0], "nx": [1, 2], "ny": [18, 3], "nz": [0, -1] }, { "size": 2, "px": [18, 5], "py": [13, 4], "pz": [0, -1], "nx": [4, 13], "ny": [2, 11], "nz": [2, 0] }, { "size": 2, "px": [18, 17], "py": [3, 3], "pz": [0, 0], "nx": [19, 19], "ny": [1, 1], "nz": [0, -1] }, { "size": 2, "px": [9, 5], "py": [0, 5], "pz": [1, -1], "nx": [12, 3], "ny": [5, 1], "nz": [0, 2] }, { "size": 2, "px": [5, 3], "py": [2, 1], "pz": [1, 2], "nx": [18, 4], "ny": [4, 1], "nz": [0, -1] }, { "size": 5, "px": [13, 13, 2, 10, 15], "py": [11, 12, 13, 17, 23], "pz": [0, -1, -1, -1, -1], "nx": [12, 13, 4, 3, 8], "ny": [4, 4, 1, 0, 3], "nz": [0, 0, 2, 2, 1] }, { "size": 2, "px": [9, 3], "py": [2, 2], "pz": [0, -1], "nx": [4, 2], "ny": [7, 2], "nz": [1, 2] }, { "size": 2, "px": [13, 4], "py": [5, 1], "pz": [0, -1], "nx": [18, 4], "ny": [12, 2], "nz": [0, 2] }, { "size": 2, "px": [19, 4], "py": [11, 1], "pz": [0, -1], "nx": [4, 7], "ny": [2, 2], "nz": [2, 1] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [3, 2], "ny": [4, 5], "nz": [1, -1] }, { "size": 2, "px": [4, 0], "py": [7, 7], "pz": [0, -1], "nx": [4, 9], "ny": [0, 2], "nz": [2, 1] }, { "size": 2, "px": [4, 9], "py": [0, 2], "pz": [2, 1], "nx": [6, 4], "ny": [3, 4], "nz": [0, -1] }, { "size": 2, "px": [4, 2], "py": [9, 4], "pz": [1, 2], "nx": [13, 5], "ny": [18, 2], "nz": [0, -1] }, { "size": 3, "px": [5, 23, 23], "py": [2, 8, 7], "pz": [2, 0, 0], "nx": [10, 12, 1], "ny": [4, 1, 0], "nz": [1, -1, -1] }, { "size": 2, "px": [13, 0], "py": [3, 3], "pz": [0, -1], "nx": [4, 4], "ny": [2, 3], "nz": [2, 2] }, { "size": 2, "px": [6, 5], "py": [10, 5], "pz": [0, -1], "nx": [0, 0], "ny": [4, 11], "nz": [1, 0] }, { "size": 2, "px": [11, 2], "py": [14, 11], "pz": [0, -1], "nx": [10, 11], "ny": [4, 13], "nz": [1, 0] }, { "size": 2, "px": [5, 6], "py": [21, 23], "pz": [0, 0], "nx": [7, 0], "ny": [21, 3], "nz": [0, -1] }, { "size": 2, "px": [8, 4], "py": [6, 3], "pz": [1, 2], "nx": [8, 5], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [7, 6], "py": [8, 8], "pz": [0, 0], "nx": [6, 14], "ny": [9, 15], "nz": [0, -1] }, { "size": 2, "px": [16, 6], "py": [4, 8], "pz": [0, -1], "nx": [16, 8], "ny": [0, 1], "nz": [0, 1] }, { "size": 4, "px": [3, 6, 0, 9], "py": [0, 8, 5, 23], "pz": [1, -1, -1, -1], "nx": [12, 2, 6, 10], "ny": [5, 0, 3, 5], "nz": [0, 2, 1, 0] }, { "size": 2, "px": [3, 6], "py": [7, 13], "pz": [1, 0], "nx": [3, 9], "ny": [4, 9], "nz": [1, -1] }, { "size": 2, "px": [2, 5], "py": [8, 23], "pz": [1, 0], "nx": [8, 9], "ny": [15, 0], "nz": [0, -1] }, { "size": 2, "px": [13, 18], "py": [8, 0], "pz": [0, -1], "nx": [1, 1], "ny": [9, 8], "nz": [1, 1] }, { "size": 2, "px": [2, 7], "py": [4, 21], "pz": [2, 0], "nx": [13, 11], "ny": [8, 9], "nz": [0, -1] }, { "size": 2, "px": [5, 4], "py": [8, 8], "pz": [0, 0], "nx": [6, 1], "ny": [8, 5], "nz": [0, -1] }, { "size": 2, "px": [7, 3], "py": [20, 7], "pz": [0, -1], "nx": [4, 3], "ny": [10, 4], "nz": [1, 1] }, { "size": 2, "px": [9, 9], "py": [8, 7], "pz": [1, -1], "nx": [1, 2], "ny": [4, 9], "nz": [2, 1] }, { "size": 2, "px": [5, 10], "py": [5, 13], "pz": [1, -1], "nx": [3, 6], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [12, 5], "py": [6, 3], "pz": [0, -1], "nx": [8, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [10, 10], "py": [4, 4], "pz": [1, -1], "nx": [5, 11], "ny": [2, 5], "nz": [2, 1] }, { "size": 5, "px": [11, 23, 11, 23, 11], "py": [4, 9, 5, 10, 6], "pz": [1, 0, 1, 0, 1], "nx": [7, 14, 13, 7, 3], "ny": [9, 5, 6, 4, 4], "nz": [0, 0, 0, 1, -1] }, { "size": 2, "px": [8, 5], "py": [0, 0], "pz": [1, -1], "nx": [9, 20], "ny": [1, 4], "nz": [1, 0] }, { "size": 2, "px": [19, 20], "py": [0, 3], "pz": [0, 0], "nx": [4, 6], "ny": [11, 3], "nz": [1, -1] }, { "size": 4, "px": [13, 5, 20, 5], "py": [14, 3, 23, 4], "pz": [0, -1, -1, -1], "nx": [8, 15, 7, 16], "ny": [8, 14, 6, 15], "nz": [1, 0, 1, 0] }, { "size": 2, "px": [10, 20], "py": [5, 17], "pz": [0, -1], "nx": [7, 3], "ny": [10, 1], "nz": [0, 2] }, { "size": 3, "px": [1, 12, 7], "py": [3, 7, 10], "pz": [2, 0, 0], "nx": [2, 2, 3], "ny": [3, 2, 2], "nz": [1, -1, -1] }, { "size": 3, "px": [10, 5, 7], "py": [7, 10, 10], "pz": [1, -1, -1], "nx": [10, 10, 18], "ny": [10, 9, 23], "nz": [1, 1, 0] }, { "size": 3, "px": [14, 14, 4], "py": [3, 3, 4], "pz": [0, -1, -1], "nx": [4, 4, 8], "ny": [3, 2, 6], "nz": [2, 2, 1] }, { "size": 2, "px": [4, 12], "py": [4, 17], "pz": [2, 0], "nx": [13, 1], "ny": [15, 4], "nz": [0, -1] }, { "size": 2, "px": [10, 20], "py": [9, 22], "pz": [0, -1], "nx": [9, 4], "ny": [2, 0], "nz": [1, 2] }, { "size": 2, "px": [11, 2], "py": [3, 6], "pz": [0, -1], "nx": [2, 4], "ny": [2, 4], "nz": [2, 1] }, { "size": 3, "px": [15, 10, 1], "py": [12, 2, 3], "pz": [0, -1, -1], "nx": [7, 5, 10], "ny": [2, 1, 1], "nz": [0, 1, 0] }, { "size": 5, "px": [9, 11, 10, 12, 12], "py": [0, 0, 0, 0, 0], "pz": [0, 0, 0, 0, -1], "nx": [8, 4, 16, 5, 10], "ny": [4, 4, 10, 3, 6], "nz": [1, 1, 0, 1, 0] }, { "size": 2, "px": [0, 10], "py": [3, 5], "pz": [2, -1], "nx": [3, 6], "ny": [0, 1], "nz": [2, 1] }, { "size": 5, "px": [7, 8, 7, 2, 12], "py": [14, 13, 13, 16, 0], "pz": [0, 0, -1, -1, -1], "nx": [10, 1, 10, 1, 1], "ny": [13, 2, 12, 4, 9], "nz": [0, 2, 0, 1, 0] }, { "size": 3, "px": [6, 14, 13], "py": [1, 2, 1], "pz": [1, 0, 0], "nx": [8, 21, 10], "ny": [4, 23, 12], "nz": [1, -1, -1] }, { "size": 2, "px": [19, 19], "py": [22, 21], "pz": [0, 0], "nx": [20, 1], "ny": [22, 5], "nz": [0, -1] }, { "size": 2, "px": [13, 12], "py": [19, 22], "pz": [0, -1], "nx": [2, 3], "ny": [0, 1], "nz": [2, 1] }, { "size": 4, "px": [11, 9, 21, 4], "py": [13, 3, 19, 5], "pz": [0, -1, -1, -1], "nx": [9, 9, 9, 5], "ny": [13, 14, 12, 6], "nz": [0, 0, 0, 1] }, { "size": 4, "px": [11, 12, 13, 14], "py": [22, 22, 22, 22], "pz": [0, 0, 0, 0], "nx": [13, 2, 4, 5], "ny": [20, 0, 0, 6], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [3, 1], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [0, 1], "pz": [2, 2], "nx": [9, 4], "ny": [6, 5], "nz": [1, -1] }, { "size": 2, "px": [17, 0], "py": [10, 1], "pz": [0, -1], "nx": [9, 4], "ny": [3, 2], "nz": [1, 2] }, { "size": 2, "px": [10, 4], "py": [3, 1], "pz": [1, 2], "nx": [12, 18], "ny": [17, 4], "nz": [0, -1] }, { "size": 3, "px": [2, 3, 4], "py": [4, 3, 9], "pz": [2, 2, 1], "nx": [0, 3, 17], "ny": [0, 1, 18], "nz": [0, -1, -1] }, { "size": 2, "px": [7, 3], "py": [12, 6], "pz": [0, 1], "nx": [5, 1], "ny": [11, 1], "nz": [1, -1] }, { "size": 2, "px": [10, 17], "py": [20, 6], "pz": [0, -1], "nx": [5, 2], "ny": [9, 5], "nz": [1, 2] }, { "size": 2, "px": [8, 11], "py": [18, 2], "pz": [0, -1], "nx": [5, 4], "ny": [9, 9], "nz": [1, 1] }, { "size": 2, "px": [16, 15], "py": [2, 2], "pz": [0, 0], "nx": [17, 12], "ny": [2, 2], "nz": [0, -1] }, { "size": 2, "px": [18, 4], "py": [5, 5], "pz": [0, -1], "nx": [7, 5], "ny": [23, 19], "nz": [0, 0] }, { "size": 2, "px": [12, 13], "py": [23, 23], "pz": [0, 0], "nx": [7, 11], "ny": [10, 20], "nz": [1, -1] }, { "size": 2, "px": [5, 10], "py": [3, 18], "pz": [2, -1], "nx": [9, 9], "ny": [5, 6], "nz": [1, 1] }, { "size": 2, "px": [5, 10], "py": [2, 4], "pz": [1, 0], "nx": [4, 23], "ny": [4, 20], "nz": [1, -1] }, { "size": 2, "px": [2, 3], "py": [8, 1], "pz": [1, -1], "nx": [15, 12], "ny": [2, 1], "nz": [0, 0] }, { "size": 2, "px": [4, 7], "py": [3, 10], "pz": [2, 1], "nx": [10, 1], "ny": [20, 4], "nz": [0, -1] }, { "size": 2, "px": [11, 11], "py": [10, 11], "pz": [0, 0], "nx": [22, 3], "ny": [5, 4], "nz": [0, -1] }, { "size": 5, "px": [8, 17, 17, 9, 18], "py": [0, 1, 0, 1, 0], "pz": [1, 0, 0, 1, 0], "nx": [11, 8, 9, 4, 4], "ny": [23, 4, 6, 2, 2], "nz": [0, 1, 0, 2, -1] }, { "size": 2, "px": [5, 5], "py": [4, 4], "pz": [1, -1], "nx": [13, 4], "ny": [9, 2], "nz": [0, 2] }, { "size": 5, "px": [9, 4, 8, 7, 7], "py": [3, 1, 3, 3, 3], "pz": [0, 1, 0, 0, -1], "nx": [4, 2, 5, 3, 2], "ny": [1, 15, 1, 4, 13], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [17, 7], "py": [13, 7], "pz": [0, -1], "nx": [4, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [1, 2], "py": [1, 12], "pz": [2, 0], "nx": [9, 21], "ny": [5, 4], "nz": [0, -1] }, { "size": 2, "px": [12, 0], "py": [14, 1], "pz": [0, -1], "nx": [1, 1], "ny": [19, 10], "nz": [0, 1] }, { "size": 2, "px": [16, 1], "py": [5, 9], "pz": [0, -1], "nx": [16, 15], "ny": [3, 3], "nz": [0, 0] }, { "size": 2, "px": [4, 8], "py": [3, 6], "pz": [2, 1], "nx": [8, 4], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [11, 6], "py": [17, 15], "pz": [0, 0], "nx": [11, 0], "ny": [16, 4], "nz": [0, -1] }, { "size": 4, "px": [12, 11, 0, 3], "py": [16, 8, 7, 1], "pz": [0, -1, -1, -1], "nx": [10, 5, 10, 5], "ny": [11, 9, 10, 8], "nz": [0, 1, 0, 1] }, { "size": 2, "px": [3, 6], "py": [7, 13], "pz": [1, 0], "nx": [4, 14], "ny": [4, 16], "nz": [1, -1] }, { "size": 2, "px": [7, 17], "py": [6, 13], "pz": [0, -1], "nx": [4, 8], "ny": [4, 9], "nz": [2, 1] }, { "size": 2, "px": [15, 11], "py": [3, 2], "pz": [0, -1], "nx": [4, 15], "ny": [1, 2], "nz": [2, 0] }, { "size": 2, "px": [10, 11], "py": [18, 4], "pz": [0, -1], "nx": [5, 5], "ny": [8, 9], "nz": [1, 1] }, { "size": 2, "px": [8, 4], "py": [7, 4], "pz": [1, 2], "nx": [4, 3], "ny": [5, 7], "nz": [2, -1] }, { "size": 2, "px": [12, 4], "py": [15, 4], "pz": [0, -1], "nx": [11, 8], "ny": [14, 19], "nz": [0, 0] }, { "size": 2, "px": [18, 13], "py": [13, 20], "pz": [0, 0], "nx": [13, 4], "ny": [18, 2], "nz": [0, -1] }, { "size": 2, "px": [12, 4], "py": [6, 3], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [21, 5, 11, 5, 10], "py": [1, 1, 3, 0, 0], "pz": [0, 2, 1, 2, 1], "nx": [7, 14, 15, 4, 8], "ny": [3, 6, 11, 3, 4], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [10, 6], "py": [15, 10], "pz": [0, -1], "nx": [21, 22], "ny": [14, 12], "nz": [0, 0] }, { "size": 2, "px": [18, 0], "py": [20, 0], "pz": [0, -1], "nx": [2, 3], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [12, 6, 13, 11, 7], "py": [1, 1, 1, 2, 1], "pz": [0, 1, 0, 0, 1], "nx": [7, 6, 8, 5, 5], "ny": [4, 15, 4, 16, 16], "nz": [1, 0, 1, 0, -1] }, { "size": 3, "px": [22, 21, 21], "py": [14, 15, 17], "pz": [0, 0, 0], "nx": [5, 9, 4], "ny": [0, 5, 0], "nz": [2, -1, -1] }, { "size": 2, "px": [10, 2], "py": [14, 1], "pz": [0, -1], "nx": [23, 11], "ny": [16, 8], "nz": [0, 1] }, { "size": 4, "px": [21, 21, 0, 18], "py": [14, 15, 5, 4], "pz": [0, 0, -1, -1], "nx": [8, 8, 9, 4], "ny": [7, 8, 10, 5], "nz": [1, 1, 1, 2] }, { "size": 2, "px": [15, 5], "py": [18, 1], "pz": [0, -1], "nx": [23, 23], "ny": [16, 18], "nz": [0, 0] }, { "size": 2, "px": [15, 14], "py": [1, 1], "pz": [0, 0], "nx": [4, 4], "ny": [2, 3], "nz": [2, -1] }, { "size": 2, "px": [2, 6], "py": [6, 5], "pz": [1, -1], "nx": [14, 11], "ny": [1, 1], "nz": [0, 0] }, { "size": 2, "px": [3, 17], "py": [2, 8], "pz": [2, 0], "nx": [8, 3], "ny": [4, 9], "nz": [1, -1] }, { "size": 2, "px": [17, 8], "py": [13, 10], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [0, 0], "py": [8, 3], "pz": [0, 1], "nx": [1, 11], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [6, 8], "py": [5, 0], "pz": [1, -1], "nx": [0, 0], "ny": [3, 1], "nz": [1, 2] }, { "size": 2, "px": [0, 0], "py": [5, 3], "pz": [1, 2], "nx": [1, 18], "ny": [5, 7], "nz": [1, -1] }, { "size": 2, "px": [7, 3], "py": [6, 6], "pz": [0, 1], "nx": [7, 12], "ny": [5, 20], "nz": [0, -1] }, { "size": 2, "px": [8, 1], "py": [0, 5], "pz": [0, -1], "nx": [4, 2], "ny": [9, 3], "nz": [1, 2] }, { "size": 2, "px": [0, 0], "py": [10, 11], "pz": [0, 0], "nx": [0, 5], "ny": [5, 9], "nz": [0, -1] }, { "size": 2, "px": [8, 1], "py": [23, 4], "pz": [0, 2], "nx": [0, 0], "ny": [13, 2], "nz": [0, -1] }, { "size": 2, "px": [4, 1], "py": [6, 4], "pz": [0, -1], "nx": [4, 4], "ny": [4, 5], "nz": [2, 2] }, { "size": 2, "px": [7, 6], "py": [6, 5], "pz": [1, 1], "nx": [3, 9], "ny": [4, 16], "nz": [1, -1] }, { "size": 2, "px": [5, 3], "py": [9, 13], "pz": [0, -1], "nx": [4, 10], "ny": [3, 7], "nz": [1, 0] }, { "size": 5, "px": [13, 9, 6, 10, 10], "py": [2, 2, 1, 2, 2], "pz": [0, 0, 1, 0, -1], "nx": [7, 5, 6, 5, 6], "ny": [0, 2, 2, 1, 1], "nz": [0, 0, 0, 0, 0] }], "alpha": [-1.119615e+00, 1.119615e+00, -8.169953e-01, 8.169953e-01, -5.291213e-01, 5.291213e-01, -4.904488e-01, 4.904488e-01, -4.930982e-01, 4.930982e-01, -4.106179e-01, 4.106179e-01, -4.246842e-01, 4.246842e-01, -3.802383e-01, 3.802383e-01, -3.364358e-01, 3.364358e-01, -3.214186e-01, 3.214186e-01, -3.210798e-01, 3.210798e-01, -2.993167e-01, 2.993167e-01, -3.426336e-01, 3.426336e-01, -3.199184e-01, 3.199184e-01, -3.061071e-01, 3.061071e-01, -2.758972e-01, 2.758972e-01, -3.075590e-01, 3.075590e-01, -3.009565e-01, 3.009565e-01, -2.015739e-01, 2.015739e-01, -2.603266e-01, 2.603266e-01, -2.772993e-01, 2.772993e-01, -2.184913e-01, 2.184913e-01, -2.306681e-01, 2.306681e-01, -1.983223e-01, 1.983223e-01, -2.194760e-01, 2.194760e-01, -2.528421e-01, 2.528421e-01, -2.436416e-01, 2.436416e-01, -3.032886e-01, 3.032886e-01, -2.556071e-01, 2.556071e-01, -2.562170e-01, 2.562170e-01, -1.930298e-01, 1.930298e-01, -2.735898e-01, 2.735898e-01, -1.814703e-01, 1.814703e-01, -2.054824e-01, 2.054824e-01, -1.986146e-01, 1.986146e-01, -1.769226e-01, 1.769226e-01, -1.775257e-01, 1.775257e-01, -2.167927e-01, 2.167927e-01, -1.823633e-01, 1.823633e-01, -1.584280e-01, 1.584280e-01, -1.778321e-01, 1.778321e-01, -1.826777e-01, 1.826777e-01, -1.979903e-01, 1.979903e-01, -1.898326e-01, 1.898326e-01, -1.835506e-01, 1.835506e-01, -1.967860e-01, 1.967860e-01, -1.871528e-01, 1.871528e-01, -1.772414e-01, 1.772414e-01, -1.985514e-01, 1.985514e-01, -2.144078e-01, 2.144078e-01, -2.742303e-01, 2.742303e-01, -2.240550e-01, 2.240550e-01, -2.132534e-01, 2.132534e-01, -1.552127e-01, 1.552127e-01, -1.568276e-01, 1.568276e-01, -1.630086e-01, 1.630086e-01, -1.458232e-01, 1.458232e-01, -1.559541e-01, 1.559541e-01, -1.720131e-01, 1.720131e-01, -1.708434e-01, 1.708434e-01, -1.624431e-01, 1.624431e-01, -1.814161e-01, 1.814161e-01, -1.552639e-01, 1.552639e-01, -1.242354e-01, 1.242354e-01, -1.552139e-01, 1.552139e-01, -1.694359e-01, 1.694359e-01, -1.801481e-01, 1.801481e-01, -1.387182e-01, 1.387182e-01, -1.409679e-01, 1.409679e-01, -1.486724e-01, 1.486724e-01, -1.779553e-01, 1.779553e-01, -1.524595e-01, 1.524595e-01, -1.788086e-01, 1.788086e-01, -1.671479e-01, 1.671479e-01, -1.376197e-01, 1.376197e-01, -1.511808e-01, 1.511808e-01, -1.524632e-01, 1.524632e-01, -1.198986e-01, 1.198986e-01, -1.382641e-01, 1.382641e-01, -1.148901e-01, 1.148901e-01, -1.131803e-01, 1.131803e-01, -1.273508e-01, 1.273508e-01, -1.405125e-01, 1.405125e-01, -1.322132e-01, 1.322132e-01, -1.386966e-01, 1.386966e-01, -1.275621e-01, 1.275621e-01, -1.180573e-01, 1.180573e-01, -1.238803e-01, 1.238803e-01, -1.428389e-01, 1.428389e-01, -1.694437e-01, 1.694437e-01, -1.290855e-01, 1.290855e-01, -1.520260e-01, 1.520260e-01, -1.398282e-01, 1.398282e-01, -1.890736e-01, 1.890736e-01, -2.280428e-01, 2.280428e-01, -1.325099e-01, 1.325099e-01, -1.342873e-01, 1.342873e-01, -1.463841e-01, 1.463841e-01, -1.983567e-01, 1.983567e-01, -1.585711e-01, 1.585711e-01, -1.260154e-01, 1.260154e-01, -1.426774e-01, 1.426774e-01, -1.554278e-01, 1.554278e-01, -1.361201e-01, 1.361201e-01, -1.181856e-01, 1.181856e-01, -1.255941e-01, 1.255941e-01, -1.113275e-01, 1.113275e-01, -1.506576e-01, 1.506576e-01, -1.202859e-01, 1.202859e-01, -2.159751e-01, 2.159751e-01, -1.443150e-01, 1.443150e-01, -1.379194e-01, 1.379194e-01, -1.805758e-01, 1.805758e-01, -1.465612e-01, 1.465612e-01, -1.328856e-01, 1.328856e-01, -1.532173e-01, 1.532173e-01, -1.590635e-01, 1.590635e-01, -1.462229e-01, 1.462229e-01, -1.350012e-01, 1.350012e-01, -1.195634e-01, 1.195634e-01, -1.173221e-01, 1.173221e-01, -1.192867e-01, 1.192867e-01, -1.595013e-01, 1.595013e-01, -1.209751e-01, 1.209751e-01, -1.571290e-01, 1.571290e-01, -1.527274e-01, 1.527274e-01, -1.373708e-01, 1.373708e-01, -1.318313e-01, 1.318313e-01, -1.273391e-01, 1.273391e-01, -1.271365e-01, 1.271365e-01, -1.528693e-01, 1.528693e-01, -1.590476e-01, 1.590476e-01, -1.581911e-01, 1.581911e-01, -1.183023e-01, 1.183023e-01, -1.559822e-01, 1.559822e-01, -1.214999e-01, 1.214999e-01, -1.283378e-01, 1.283378e-01, -1.542583e-01, 1.542583e-01, -1.336377e-01, 1.336377e-01, -1.800416e-01, 1.800416e-01, -1.710931e-01, 1.710931e-01, -1.621737e-01, 1.621737e-01, -1.239002e-01, 1.239002e-01, -1.432928e-01, 1.432928e-01, -1.392447e-01, 1.392447e-01, -1.383938e-01, 1.383938e-01, -1.357633e-01, 1.357633e-01, -1.175842e-01, 1.175842e-01, -1.085318e-01, 1.085318e-01, -1.148885e-01, 1.148885e-01, -1.320396e-01, 1.320396e-01, -1.351204e-01, 1.351204e-01, -1.581518e-01, 1.581518e-01, -1.459574e-01, 1.459574e-01, -1.180068e-01, 1.180068e-01, -1.464196e-01, 1.464196e-01, -1.179543e-01, 1.179543e-01, -1.004204e-01, 1.004204e-01, -1.294660e-01, 1.294660e-01, -1.534244e-01, 1.534244e-01, -1.378970e-01, 1.378970e-01, -1.226545e-01, 1.226545e-01, -1.281182e-01, 1.281182e-01, -1.201471e-01, 1.201471e-01, -1.448701e-01, 1.448701e-01, -1.290980e-01, 1.290980e-01, -1.388764e-01, 1.388764e-01, -9.605773e-02, 9.605773e-02, -1.411021e-01, 1.411021e-01, -1.295693e-01, 1.295693e-01, -1.371739e-01, 1.371739e-01, -1.167579e-01, 1.167579e-01, -1.400486e-01, 1.400486e-01, -1.214224e-01, 1.214224e-01, -1.287835e-01, 1.287835e-01, -1.197646e-01, 1.197646e-01, -1.192358e-01, 1.192358e-01, -1.218651e-01, 1.218651e-01, -1.564816e-01, 1.564816e-01, -1.172391e-01, 1.172391e-01, -1.342268e-01, 1.342268e-01, -1.492471e-01, 1.492471e-01, -1.157299e-01, 1.157299e-01, -1.046703e-01, 1.046703e-01, -1.255571e-01, 1.255571e-01, -1.100135e-01, 1.100135e-01, -1.501592e-01, 1.501592e-01, -1.155712e-01, 1.155712e-01, -1.145563e-01, 1.145563e-01, -1.013425e-01, 1.013425e-01, -1.145783e-01, 1.145783e-01, -1.328031e-01, 1.328031e-01, -1.077413e-01, 1.077413e-01, -1.064996e-01, 1.064996e-01, -1.191170e-01, 1.191170e-01, -1.213217e-01, 1.213217e-01, -1.260969e-01, 1.260969e-01, -1.156494e-01, 1.156494e-01, -1.268126e-01, 1.268126e-01, -1.070999e-01, 1.070999e-01, -1.112365e-01, 1.112365e-01, -1.243916e-01, 1.243916e-01, -1.283152e-01, 1.283152e-01, -1.166925e-01, 1.166925e-01, -8.997633e-02, 8.997633e-02, -1.583840e-01, 1.583840e-01, -1.211178e-01, 1.211178e-01, -1.090830e-01, 1.090830e-01, -1.030818e-01, 1.030818e-01, -1.440600e-01, 1.440600e-01, -1.458713e-01, 1.458713e-01, -1.559082e-01, 1.559082e-01, -1.058868e-01, 1.058868e-01, -1.010130e-01, 1.010130e-01, -1.642301e-01, 1.642301e-01, -1.236850e-01, 1.236850e-01, -1.467589e-01, 1.467589e-01, -1.109359e-01, 1.109359e-01, -1.673655e-01, 1.673655e-01, -1.239984e-01, 1.239984e-01, -1.039509e-01, 1.039509e-01, -1.089378e-01, 1.089378e-01, -1.545085e-01, 1.545085e-01, -1.200862e-01, 1.200862e-01, -1.105608e-01, 1.105608e-01, -1.235262e-01, 1.235262e-01, -8.496153e-02, 8.496153e-02, -1.181372e-01, 1.181372e-01, -1.139467e-01, 1.139467e-01, -1.189317e-01, 1.189317e-01, -1.266519e-01, 1.266519e-01, -9.470736e-02, 9.470736e-02, -1.336735e-01, 1.336735e-01, -8.726601e-02, 8.726601e-02, -1.304782e-01, 1.304782e-01, -1.186529e-01, 1.186529e-01, -1.355944e-01, 1.355944e-01, -9.568801e-02, 9.568801e-02, -1.282618e-01, 1.282618e-01, -1.625632e-01, 1.625632e-01, -1.167652e-01, 1.167652e-01, -1.001301e-01, 1.001301e-01, -1.292419e-01, 1.292419e-01, -1.904213e-01, 1.904213e-01, -1.511542e-01, 1.511542e-01, -9.814394e-02, 9.814394e-02, -1.171564e-01, 1.171564e-01, -9.806486e-02, 9.806486e-02, -9.217615e-02, 9.217615e-02, -8.505645e-02, 8.505645e-02, -1.573637e-01, 1.573637e-01, -1.419174e-01, 1.419174e-01, -1.298601e-01, 1.298601e-01, -1.120613e-01, 1.120613e-01, -1.158363e-01, 1.158363e-01, -1.090957e-01, 1.090957e-01, -1.204516e-01, 1.204516e-01, -1.139852e-01, 1.139852e-01, -9.642479e-02, 9.642479e-02, -1.410872e-01, 1.410872e-01, -1.142779e-01, 1.142779e-01, -1.043991e-01, 1.043991e-01, -9.736463e-02, 9.736463e-02, -1.451046e-01, 1.451046e-01, -1.205668e-01, 1.205668e-01, -9.881445e-02, 9.881445e-02, -1.612822e-01, 1.612822e-01, -1.175681e-01, 1.175681e-01, -1.522528e-01, 1.522528e-01, -1.617520e-01, 1.617520e-01, -1.582938e-01, 1.582938e-01, -1.208202e-01, 1.208202e-01, -1.016003e-01, 1.016003e-01, -1.232059e-01, 1.232059e-01, -9.583025e-02, 9.583025e-02, -1.013990e-01, 1.013990e-01, -1.178752e-01, 1.178752e-01, -1.215972e-01, 1.215972e-01, -1.294932e-01, 1.294932e-01, -1.158270e-01, 1.158270e-01, -1.008645e-01, 1.008645e-01, -9.699190e-02, 9.699190e-02, -1.022144e-01, 1.022144e-01, -9.878768e-02, 9.878768e-02, -1.339052e-01, 1.339052e-01, -9.279961e-02, 9.279961e-02, -1.047606e-01, 1.047606e-01, -1.141163e-01, 1.141163e-01, -1.267600e-01, 1.267600e-01, -1.252763e-01, 1.252763e-01, -9.775003e-02, 9.775003e-02, -9.169116e-02, 9.169116e-02, -1.006496e-01, 1.006496e-01, -9.493293e-02, 9.493293e-02, -1.213694e-01, 1.213694e-01, -1.109243e-01, 1.109243e-01, -1.115973e-01, 1.115973e-01, -7.979327e-02, 7.979327e-02, -9.220953e-02, 9.220953e-02, -1.028913e-01, 1.028913e-01, -1.253510e-01, 1.253510e-01] }, { "count": 391, "threshold": -4.665692e+00, "feature": [{ "size": 5, "px": [14, 9, 11, 17, 12], "py": [2, 3, 9, 13, 3], "pz": [0, 0, 0, 0, 0], "nx": [21, 8, 7, 20, 13], "ny": [16, 10, 7, 7, 9], "nz": [0, 1, 1, 0, 0] }, { "size": 5, "px": [12, 10, 6, 11, 13], "py": [9, 3, 13, 3, 4], "pz": [0, 0, 0, 0, 0], "nx": [10, 4, 5, 10, 2], "ny": [9, 10, 8, 8, 2], "nz": [0, 1, 1, 0, 2] }, { "size": 5, "px": [6, 9, 7, 8, 8], "py": [3, 3, 3, 3, 3], "pz": [0, 0, 0, 0, -1], "nx": [0, 0, 0, 4, 9], "ny": [4, 2, 3, 10, 8], "nz": [0, 0, 0, 1, 0] }, { "size": 5, "px": [6, 2, 16, 6, 8], "py": [16, 2, 11, 4, 11], "pz": [0, 2, 0, 1, 0], "nx": [3, 8, 4, 1, 1], "ny": [4, 4, 4, 5, 13], "nz": [1, 1, -1, -1, -1] }, { "size": 3, "px": [16, 13, 9], "py": [23, 18, 10], "pz": [0, 0, 1], "nx": [14, 15, 8], "ny": [21, 22, 3], "nz": [0, -1, -1] }, { "size": 5, "px": [9, 16, 19, 17, 17], "py": [1, 2, 3, 2, 2], "pz": [1, 0, 0, 0, -1], "nx": [23, 23, 23, 23, 23], "ny": [6, 2, 1, 3, 5], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [12, 12, 12, 12, 12], "py": [10, 11, 12, 13, 13], "pz": [0, 0, 0, 0, -1], "nx": [4, 8, 14, 4, 6], "ny": [2, 4, 7, 4, 8], "nz": [2, 1, 0, 1, 1] }, { "size": 5, "px": [1, 2, 3, 6, 4], "py": [6, 10, 12, 23, 13], "pz": [1, 1, 0, 0, 0], "nx": [2, 0, 0, 1, 1], "ny": [23, 5, 10, 21, 21], "nz": [0, 2, 1, 0, -1] }, { "size": 5, "px": [12, 16, 12, 4, 12], "py": [6, 17, 7, 2, 8], "pz": [0, 0, 0, 2, 0], "nx": [8, 8, 12, 0, 6], "ny": [4, 4, 16, 0, 8], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [9, 2], "py": [18, 4], "pz": [0, -1], "nx": [4, 9], "ny": [10, 16], "nz": [1, 0] }, { "size": 5, "px": [9, 9, 2, 0, 12], "py": [6, 6, 21, 4, 8], "pz": [1, -1, -1, -1, -1], "nx": [8, 4, 9, 7, 7], "ny": [10, 2, 4, 5, 8], "nz": [1, 2, 1, 1, 1] }, { "size": 5, "px": [10, 10, 10, 18, 19], "py": [10, 8, 7, 14, 14], "pz": [1, 1, 1, 0, 0], "nx": [21, 23, 22, 22, 11], "ny": [23, 19, 21, 22, 10], "nz": [0, 0, 0, 0, -1] }, { "size": 5, "px": [12, 3, 15, 4, 19], "py": [14, 0, 5, 5, 14], "pz": [0, -1, -1, -1, -1], "nx": [12, 17, 15, 3, 8], "ny": [18, 18, 14, 2, 10], "nz": [0, 0, 0, 2, 0] }, { "size": 5, "px": [8, 11, 3, 11, 4], "py": [23, 7, 9, 8, 8], "pz": [0, 0, 1, 0, 1], "nx": [8, 0, 10, 0, 8], "ny": [8, 2, 8, 4, 10], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [10, 11, 12, 8, 4], "py": [3, 0, 0, 1, 1], "pz": [0, 0, 0, 0, 1], "nx": [2, 3, 4, 3, 3], "ny": [14, 5, 0, 1, 2], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [3, 11], "py": [7, 0], "pz": [1, -1], "nx": [5, 2], "ny": [9, 5], "nz": [1, 2] }, { "size": 5, "px": [7, 1, 0, 10, 1], "py": [0, 0, 2, 12, 6], "pz": [0, 2, 2, 0, 1], "nx": [4, 6, 2, 8, 8], "ny": [4, 11, 2, 4, 4], "nz": [1, 1, 2, 1, -1] }, { "size": 2, "px": [4, 15], "py": [4, 12], "pz": [2, 0], "nx": [4, 6], "ny": [5, 11], "nz": [2, -1] }, { "size": 5, "px": [9, 4, 16, 14, 14], "py": [8, 4, 23, 18, 18], "pz": [1, 2, 0, 0, -1], "nx": [0, 2, 1, 1, 0], "ny": [2, 0, 3, 2, 3], "nz": [1, 0, 0, 0, 1] }, { "size": 5, "px": [17, 7, 7, 18, 19], "py": [7, 11, 8, 7, 7], "pz": [0, 1, 1, 0, 0], "nx": [17, 5, 8, 2, 0], "ny": [8, 0, 7, 5, 3], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [5, 14], "py": [12, 3], "pz": [0, -1], "nx": [4, 3], "ny": [5, 4], "nz": [1, 1] }, { "size": 5, "px": [10, 8, 16, 11, 11], "py": [5, 6, 12, 4, 4], "pz": [0, 1, 0, 0, -1], "nx": [14, 13, 5, 9, 5], "ny": [13, 10, 1, 4, 2], "nz": [0, 0, 2, 1, 2] }, { "size": 5, "px": [15, 14, 16, 8, 8], "py": [2, 2, 2, 0, 0], "pz": [0, 0, 0, 1, -1], "nx": [9, 18, 19, 18, 17], "ny": [0, 0, 2, 1, 0], "nz": [1, 0, 0, 0, 0] }, { "size": 2, "px": [17, 15], "py": [12, 11], "pz": [0, 0], "nx": [14, 4], "ny": [9, 15], "nz": [0, -1] }, { "size": 3, "px": [5, 11, 11], "py": [3, 4, 5], "pz": [2, 1, 1], "nx": [14, 3, 18], "ny": [6, 5, 0], "nz": [0, 1, -1] }, { "size": 5, "px": [16, 14, 17, 15, 9], "py": [2, 2, 2, 2, 1], "pz": [0, 0, 0, 0, 1], "nx": [21, 20, 11, 21, 21], "ny": [2, 0, 7, 3, 3], "nz": [0, 0, 1, 0, -1] }, { "size": 5, "px": [2, 1, 1, 1, 5], "py": [12, 9, 7, 3, 6], "pz": [0, 0, 1, 1, 1], "nx": [4, 8, 3, 4, 17], "ny": [4, 4, 0, 8, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [8, 4], "py": [6, 3], "pz": [1, 2], "nx": [9, 2], "ny": [4, 17], "nz": [1, -1] }, { "size": 2, "px": [8, 5], "py": [16, 9], "pz": [0, 1], "nx": [10, 17], "ny": [16, 8], "nz": [0, -1] }, { "size": 4, "px": [11, 5, 9, 15], "py": [14, 9, 11, 5], "pz": [0, -1, -1, -1], "nx": [10, 1, 9, 4], "ny": [9, 2, 13, 7], "nz": [0, 2, 0, 1] }, { "size": 5, "px": [2, 5, 10, 7, 10], "py": [7, 12, 2, 13, 3], "pz": [1, -1, -1, -1, -1], "nx": [5, 2, 3, 3, 2], "ny": [23, 15, 17, 16, 14], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [11, 7], "py": [8, 10], "pz": [0, -1], "nx": [7, 14], "ny": [5, 8], "nz": [1, 0] }, { "size": 2, "px": [9, 16], "py": [7, 23], "pz": [1, 0], "nx": [4, 4], "ny": [2, 1], "nz": [2, -1] }, { "size": 5, "px": [16, 14, 18, 4, 17], "py": [0, 0, 4, 0, 1], "pz": [0, 0, 0, 2, 0], "nx": [8, 8, 16, 9, 9], "ny": [5, 4, 11, 7, 7], "nz": [1, 1, 0, 0, -1] }, { "size": 5, "px": [12, 13, 7, 8, 4], "py": [9, 12, 6, 11, 5], "pz": [0, 0, 1, 1, 2], "nx": [23, 23, 16, 9, 9], "ny": [0, 1, 11, 7, 7], "nz": [0, -1, -1, -1, -1] }, { "size": 3, "px": [6, 7, 2], "py": [21, 23, 4], "pz": [0, 0, 2], "nx": [4, 1, 16], "ny": [10, 5, 11], "nz": [1, -1, -1] }, { "size": 2, "px": [2, 2], "py": [3, 4], "pz": [2, 2], "nx": [3, 1], "ny": [4, 5], "nz": [1, -1] }, { "size": 5, "px": [1, 2, 1, 0, 1], "py": [7, 13, 12, 4, 13], "pz": [0, 0, 0, 2, 0], "nx": [18, 9, 9, 19, 19], "ny": [23, 5, 11, 19, 19], "nz": [0, 1, 1, 0, -1] }, { "size": 3, "px": [4, 10, 12], "py": [6, 2, 5], "pz": [1, -1, -1], "nx": [10, 0, 0], "ny": [12, 1, 3], "nz": [0, 2, 2] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 0], "ny": [4, 3], "nz": [1, -1] }, { "size": 5, "px": [19, 17, 10, 14, 18], "py": [2, 1, 7, 0, 1], "pz": [0, 0, 1, 0, 0], "nx": [3, 3, 3, 7, 5], "ny": [9, 10, 7, 23, 18], "nz": [1, 1, 1, 0, 0] }, { "size": 2, "px": [10, 10], "py": [8, 7], "pz": [1, 1], "nx": [14, 4], "ny": [15, 6], "nz": [0, -1] }, { "size": 2, "px": [7, 15], "py": [1, 3], "pz": [1, 0], "nx": [16, 19], "ny": [1, 3], "nz": [0, -1] }, { "size": 5, "px": [11, 11, 1, 2, 11], "py": [11, 12, 1, 13, 12], "pz": [0, 0, -1, -1, -1], "nx": [12, 17, 8, 16, 8], "ny": [7, 12, 11, 16, 6], "nz": [0, 0, 0, 0, 1] }, { "size": 5, "px": [13, 11, 10, 12, 5], "py": [0, 0, 0, 0, 0], "pz": [0, 0, 0, 0, 1], "nx": [8, 4, 3, 4, 4], "ny": [4, 5, 2, 4, 4], "nz": [1, 1, 2, 1, -1] }, { "size": 5, "px": [6, 1, 3, 2, 3], "py": [13, 3, 3, 4, 10], "pz": [0, 2, 1, 1, 1], "nx": [0, 1, 0, 0, 0], "ny": [2, 0, 5, 4, 4], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [15, 1], "py": [4, 3], "pz": [0, -1], "nx": [16, 15], "ny": [2, 2], "nz": [0, 0] }, { "size": 2, "px": [3, 7], "py": [7, 13], "pz": [1, 0], "nx": [3, 0], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [14, 15], "py": [18, 14], "pz": [0, -1], "nx": [4, 14], "ny": [4, 16], "nz": [1, 0] }, { "size": 2, "px": [4, 6], "py": [3, 4], "pz": [2, 1], "nx": [9, 5], "ny": [14, 2], "nz": [0, -1] }, { "size": 2, "px": [16, 6], "py": [1, 5], "pz": [0, -1], "nx": [4, 9], "ny": [0, 4], "nz": [2, 1] }, { "size": 2, "px": [9, 0], "py": [4, 2], "pz": [0, -1], "nx": [5, 3], "ny": [1, 0], "nz": [1, 2] }, { "size": 5, "px": [1, 1, 1, 0, 0], "py": [16, 15, 17, 6, 9], "pz": [0, 0, 0, 1, 0], "nx": [9, 5, 4, 9, 8], "ny": [7, 3, 3, 6, 7], "nz": [0, 1, 1, 0, -1] }, { "size": 2, "px": [9, 1], "py": [8, 15], "pz": [1, -1], "nx": [9, 8], "ny": [9, 4], "nz": [1, 1] }, { "size": 2, "px": [20, 19], "py": [19, 22], "pz": [0, 0], "nx": [7, 0], "ny": [3, 0], "nz": [1, -1] }, { "size": 5, "px": [8, 4, 2, 5, 5], "py": [12, 6, 3, 5, 5], "pz": [0, 1, 2, 1, -1], "nx": [22, 21, 20, 21, 22], "ny": [17, 20, 22, 19, 16], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [6, 12], "py": [2, 6], "pz": [1, 0], "nx": [8, 3], "ny": [3, 2], "nz": [1, -1] }, { "size": 2, "px": [11, 11], "py": [9, 4], "pz": [1, 1], "nx": [12, 4], "ny": [17, 5], "nz": [0, -1] }, { "size": 3, "px": [0, 1, 0], "py": [5, 13, 3], "pz": [2, 0, 2], "nx": [0, 4, 11], "ny": [23, 5, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [10, 5], "py": [6, 3], "pz": [0, 1], "nx": [4, 4], "ny": [3, 0], "nz": [1, -1] }, { "size": 2, "px": [6, 5], "py": [7, 3], "pz": [0, -1], "nx": [0, 1], "ny": [4, 10], "nz": [2, 1] }, { "size": 5, "px": [12, 13, 12, 12, 12], "py": [12, 13, 11, 10, 10], "pz": [0, 0, 0, 0, -1], "nx": [10, 8, 8, 16, 15], "ny": [7, 4, 10, 11, 10], "nz": [0, 1, 0, 0, 0] }, { "size": 2, "px": [4, 8], "py": [3, 6], "pz": [2, 1], "nx": [4, 2], "ny": [5, 5], "nz": [2, -1] }, { "size": 2, "px": [9, 17], "py": [17, 7], "pz": [0, -1], "nx": [5, 2], "ny": [9, 4], "nz": [1, 2] }, { "size": 2, "px": [4, 4], "py": [3, 5], "pz": [2, 2], "nx": [12, 8], "ny": [16, 2], "nz": [0, -1] }, { "size": 2, "px": [1, 1], "py": [2, 0], "pz": [1, 1], "nx": [0, 4], "ny": [0, 1], "nz": [2, -1] }, { "size": 2, "px": [11, 1], "py": [5, 0], "pz": [0, -1], "nx": [2, 3], "ny": [2, 4], "nz": [2, 1] }, { "size": 4, "px": [0, 6, 4, 22], "py": [23, 2, 4, 12], "pz": [0, -1, -1, -1], "nx": [7, 6, 8, 5], "ny": [1, 1, 2, 1], "nz": [1, 1, 1, 1] }, { "size": 2, "px": [4, 10], "py": [0, 9], "pz": [1, -1], "nx": [2, 4], "ny": [3, 10], "nz": [2, 1] }, { "size": 2, "px": [11, 8], "py": [15, 13], "pz": [0, -1], "nx": [23, 11], "ny": [13, 5], "nz": [0, 1] }, { "size": 2, "px": [18, 4], "py": [5, 4], "pz": [0, -1], "nx": [18, 20], "ny": [4, 7], "nz": [0, 0] }, { "size": 5, "px": [21, 20, 20, 10, 20], "py": [17, 22, 19, 10, 21], "pz": [0, 0, 0, 1, 0], "nx": [5, 5, 3, 14, 7], "ny": [9, 9, 0, 8, 4], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [3, 7, 13, 7, 3], "py": [6, 12, 3, 0, 3], "pz": [1, -1, -1, -1, -1], "nx": [1, 5, 0, 0, 2], "ny": [16, 6, 13, 5, 4], "nz": [0, 1, 0, 1, 0] }, { "size": 2, "px": [7, 4], "py": [6, 3], "pz": [1, 2], "nx": [9, 5], "ny": [4, 6], "nz": [1, -1] }, { "size": 3, "px": [14, 9, 13], "py": [19, 22, 8], "pz": [0, -1, -1], "nx": [13, 4, 4], "ny": [17, 2, 5], "nz": [0, 2, 2] }, { "size": 2, "px": [16, 4], "py": [9, 3], "pz": [0, 2], "nx": [7, 4], "ny": [4, 5], "nz": [1, -1] }, { "size": 4, "px": [10, 2, 4, 2], "py": [23, 4, 8, 3], "pz": [0, 2, 1, 2], "nx": [14, 0, 4, 11], "ny": [19, 3, 5, 3], "nz": [0, -1, -1, -1] }, { "size": 5, "px": [9, 10, 8, 7, 11], "py": [2, 2, 2, 2, 2], "pz": [0, 0, 0, 0, 0], "nx": [6, 5, 3, 4, 4], "ny": [0, 1, 0, 2, 2], "nz": [0, 0, 1, 0, -1] }, { "size": 2, "px": [6, 4], "py": [13, 6], "pz": [0, -1], "nx": [15, 4], "ny": [8, 4], "nz": [0, 1] }, { "size": 2, "px": [0, 8], "py": [1, 2], "pz": [2, -1], "nx": [5, 4], "ny": [2, 2], "nz": [1, 1] }, { "size": 5, "px": [16, 13, 14, 15, 15], "py": [1, 0, 0, 0, 0], "pz": [0, 0, 0, 0, -1], "nx": [4, 9, 4, 18, 8], "ny": [5, 9, 4, 18, 11], "nz": [2, 1, 2, 0, 1] }, { "size": 2, "px": [5, 6], "py": [2, 6], "pz": [2, 1], "nx": [22, 9], "ny": [23, 9], "nz": [0, -1] }, { "size": 2, "px": [19, 19], "py": [5, 5], "pz": [0, -1], "nx": [21, 22], "ny": [2, 4], "nz": [0, 0] }, { "size": 2, "px": [2, 5], "py": [8, 6], "pz": [0, 1], "nx": [3, 4], "ny": [4, 9], "nz": [1, -1] }, { "size": 2, "px": [18, 14], "py": [13, 17], "pz": [0, 0], "nx": [14, 4], "ny": [16, 3], "nz": [0, -1] }, { "size": 2, "px": [6, 6], "py": [6, 3], "pz": [1, -1], "nx": [1, 0], "ny": [2, 2], "nz": [1, 2] }, { "size": 2, "px": [23, 21], "py": [21, 14], "pz": [0, -1], "nx": [7, 5], "ny": [0, 0], "nz": [0, 1] }, { "size": 2, "px": [15, 10], "py": [23, 7], "pz": [0, -1], "nx": [9, 4], "ny": [4, 5], "nz": [1, 2] }, { "size": 2, "px": [4, 18], "py": [3, 8], "pz": [2, 0], "nx": [8, 4], "ny": [4, 5], "nz": [1, -1] }, { "size": 2, "px": [13, 7], "py": [2, 11], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 5, "px": [2, 3, 5, 6, 1], "py": [7, 14, 2, 2, 4], "pz": [1, 0, 0, 0, 2], "nx": [8, 4, 4, 7, 7], "ny": [7, 5, 4, 9, 9], "nz": [1, 2, 2, 1, -1] }, { "size": 2, "px": [5, 3], "py": [6, 3], "pz": [1, -1], "nx": [1, 2], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [7, 20, 4, 10, 10], "py": [9, 16, 4, 10, 8], "pz": [1, 0, 2, 1, 1], "nx": [4, 2, 3, 5, 3], "ny": [11, 5, 6, 12, 5], "nz": [0, 1, 1, 0, -1] }, { "size": 2, "px": [6, 11], "py": [4, 18], "pz": [1, -1], "nx": [8, 6], "ny": [4, 9], "nz": [1, 1] }, { "size": 2, "px": [2, 8], "py": [5, 23], "pz": [2, 0], "nx": [9, 4], "ny": [0, 2], "nz": [1, -1] }, { "size": 5, "px": [3, 1, 2, 2, 2], "py": [12, 6, 12, 11, 11], "pz": [0, 1, 0, 0, -1], "nx": [0, 0, 0, 0, 0], "ny": [13, 12, 11, 14, 7], "nz": [0, 0, 0, 0, 1] }, { "size": 2, "px": [3, 6], "py": [1, 2], "pz": [2, 1], "nx": [8, 4], "ny": [4, 14], "nz": [1, -1] }, { "size": 5, "px": [11, 23, 23, 22, 22], "py": [8, 12, 6, 13, 14], "pz": [1, 0, 0, 0, 0], "nx": [13, 8, 7, 6, 6], "ny": [6, 3, 3, 9, 9], "nz": [0, 1, 1, 0, -1] }, { "size": 4, "px": [9, 23, 23, 22], "py": [7, 12, 6, 13], "pz": [1, -1, -1, -1], "nx": [11, 23, 23, 23], "ny": [6, 13, 17, 10], "nz": [1, 0, 0, 0] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [19, 5, 9, 16, 10], "pz": [0, 2, 1, 0, 1], "nx": [5, 2, 1, 2, 2], "ny": [18, 10, 5, 9, 9], "nz": [0, 1, 2, 1, -1] }, { "size": 2, "px": [11, 5], "py": [10, 4], "pz": [1, 2], "nx": [23, 14], "ny": [23, 3], "nz": [0, -1] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 1], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [8, 10], "py": [4, 8], "pz": [0, -1], "nx": [8, 8], "ny": [2, 3], "nz": [0, 0] }, { "size": 3, "px": [7, 10, 11], "py": [1, 6, 13], "pz": [0, -1, -1], "nx": [4, 4, 2], "ny": [3, 8, 2], "nz": [1, 1, 2] }, { "size": 2, "px": [8, 4], "py": [8, 2], "pz": [1, 2], "nx": [10, 5], "ny": [10, 0], "nz": [0, -1] }, { "size": 2, "px": [7, 16], "py": [20, 21], "pz": [0, -1], "nx": [2, 4], "ny": [5, 10], "nz": [2, 1] }, { "size": 2, "px": [3, 10], "py": [7, 8], "pz": [1, -1], "nx": [7, 4], "ny": [20, 7], "nz": [0, 1] }, { "size": 5, "px": [11, 11, 11, 11, 11], "py": [10, 12, 13, 11, 11], "pz": [0, 0, 0, 0, -1], "nx": [11, 12, 16, 3, 8], "ny": [6, 6, 10, 1, 8], "nz": [0, 0, 0, 2, 0] }, { "size": 2, "px": [12, 6], "py": [4, 2], "pz": [0, 1], "nx": [7, 7], "ny": [8, 1], "nz": [0, -1] }, { "size": 5, "px": [23, 23, 23, 23, 23], "py": [22, 20, 21, 19, 19], "pz": [0, 0, 0, 0, -1], "nx": [4, 6, 3, 4, 3], "ny": [19, 23, 15, 20, 16], "nz": [0, 0, 0, 0, 0] }, { "size": 3, "px": [8, 4, 14], "py": [12, 3, 8], "pz": [0, -1, -1], "nx": [4, 2, 10], "ny": [10, 3, 13], "nz": [1, 2, 0] }, { "size": 2, "px": [11, 18], "py": [13, 23], "pz": [0, -1], "nx": [5, 5], "ny": [1, 2], "nz": [2, 2] }, { "size": 3, "px": [11, 2, 10], "py": [17, 4, 17], "pz": [0, 2, 0], "nx": [11, 0, 22], "ny": [15, 2, 4], "nz": [0, -1, -1] }, { "size": 3, "px": [11, 3, 0], "py": [15, 4, 8], "pz": [0, -1, -1], "nx": [14, 11, 4], "ny": [9, 17, 7], "nz": [0, 0, 1] }, { "size": 2, "px": [17, 16], "py": [2, 1], "pz": [0, 0], "nx": [9, 11], "ny": [4, 6], "nz": [1, -1] }, { "size": 2, "px": [3, 4], "py": [21, 23], "pz": [0, 0], "nx": [4, 0], "ny": [3, 3], "nz": [1, -1] }, { "size": 2, "px": [18, 2], "py": [20, 0], "pz": [0, -1], "nx": [4, 9], "ny": [5, 10], "nz": [2, 1] }, { "size": 2, "px": [9, 1], "py": [19, 3], "pz": [0, -1], "nx": [0, 0], "ny": [9, 21], "nz": [1, 0] }, { "size": 2, "px": [19, 19], "py": [21, 22], "pz": [0, 0], "nx": [19, 0], "ny": [23, 0], "nz": [0, -1] }, { "size": 4, "px": [11, 2, 3, 2], "py": [6, 6, 9, 4], "pz": [0, -1, -1, -1], "nx": [4, 9, 19, 19], "ny": [5, 10, 17, 18], "nz": [2, 1, 0, 0] }, { "size": 2, "px": [2, 4], "py": [4, 8], "pz": [2, 1], "nx": [4, 9], "ny": [10, 10], "nz": [1, -1] }, { "size": 2, "px": [23, 22], "py": [8, 12], "pz": [0, -1], "nx": [7, 4], "ny": [11, 2], "nz": [0, 2] }, { "size": 2, "px": [12, 1], "py": [5, 2], "pz": [0, -1], "nx": [9, 11], "ny": [2, 1], "nz": [0, 0] }, { "size": 2, "px": [4, 4], "py": [2, 2], "pz": [0, -1], "nx": [3, 2], "ny": [1, 2], "nz": [0, 0] }, { "size": 2, "px": [17, 9], "py": [13, 7], "pz": [0, 1], "nx": [9, 5], "ny": [4, 0], "nz": [1, -1] }, { "size": 4, "px": [0, 0, 9, 13], "py": [3, 3, 7, 3], "pz": [2, -1, -1, -1], "nx": [2, 4, 4, 11], "ny": [1, 2, 8, 5], "nz": [2, 1, 1, 0] }, { "size": 5, "px": [3, 6, 5, 6, 6], "py": [0, 0, 2, 1, 1], "pz": [1, 0, 0, 0, -1], "nx": [2, 2, 2, 1, 1], "ny": [21, 19, 20, 16, 17], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [13, 3], "py": [22, 10], "pz": [0, -1], "nx": [7, 4], "ny": [10, 5], "nz": [1, 2] }, { "size": 2, "px": [3, 2], "py": [7, 3], "pz": [1, 2], "nx": [8, 4], "ny": [4, 5], "nz": [1, -1] }, { "size": 5, "px": [17, 8, 15, 7, 15], "py": [13, 6, 16, 5, 12], "pz": [0, 1, 0, 1, 0], "nx": [5, 4, 6, 3, 4], "ny": [1, 2, 1, 0, 3], "nz": [0, 0, 0, 1, -1] }, { "size": 5, "px": [12, 9, 11, 12, 10], "py": [0, 1, 2, 2, 0], "pz": [0, 0, 0, 0, 0], "nx": [8, 16, 7, 4, 4], "ny": [9, 23, 9, 3, 2], "nz": [1, 0, 1, 2, -1] }, { "size": 2, "px": [4, 11], "py": [1, 4], "pz": [2, -1], "nx": [8, 7], "ny": [4, 4], "nz": [0, 0] }, { "size": 4, "px": [7, 4, 5, 8], "py": [13, 2, 1, 3], "pz": [0, -1, -1, -1], "nx": [9, 4, 9, 9], "ny": [9, 5, 10, 11], "nz": [0, 1, 0, 0] }, { "size": 2, "px": [10, 11], "py": [10, 11], "pz": [0, -1], "nx": [2, 6], "ny": [2, 2], "nz": [2, 1] }, { "size": 2, "px": [21, 3], "py": [11, 2], "pz": [0, -1], "nx": [22, 22], "ny": [20, 18], "nz": [0, 0] }, { "size": 2, "px": [7, 6], "py": [1, 2], "pz": [0, 0], "nx": [5, 10], "ny": [1, 0], "nz": [0, -1] }, { "size": 2, "px": [21, 3], "py": [18, 1], "pz": [0, -1], "nx": [16, 15], "ny": [4, 4], "nz": [0, 0] }, { "size": 2, "px": [12, 7], "py": [4, 1], "pz": [0, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [13, 11], "py": [23, 17], "pz": [0, 0], "nx": [11, 21], "ny": [16, 0], "nz": [0, -1] }, { "size": 2, "px": [1, 2], "py": [0, 6], "pz": [1, -1], "nx": [16, 16], "ny": [9, 11], "nz": [0, 0] }, { "size": 2, "px": [12, 13], "py": [20, 20], "pz": [0, 0], "nx": [11, 3], "ny": [21, 7], "nz": [0, -1] }, { "size": 3, "px": [19, 20, 9], "py": [21, 18, 11], "pz": [0, 0, 1], "nx": [17, 4, 11], "ny": [19, 2, 0], "nz": [0, -1, -1] }, { "size": 2, "px": [12, 5], "py": [5, 2], "pz": [0, 1], "nx": [7, 9], "ny": [7, 8], "nz": [0, -1] }, { "size": 5, "px": [8, 4, 4, 8, 4], "py": [4, 4, 5, 10, 3], "pz": [1, 1, 2, 0, 2], "nx": [11, 22, 11, 23, 23], "ny": [0, 0, 1, 3, 3], "nz": [1, 0, 1, 0, -1] }, { "size": 2, "px": [8, 14], "py": [10, 23], "pz": [1, 0], "nx": [7, 2], "ny": [10, 9], "nz": [1, -1] }, { "size": 2, "px": [5, 14], "py": [6, 23], "pz": [1, -1], "nx": [1, 2], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [11, 2], "py": [19, 3], "pz": [0, -1], "nx": [10, 12], "ny": [18, 18], "nz": [0, 0] }, { "size": 2, "px": [12, 3], "py": [4, 1], "pz": [0, 2], "nx": [6, 6], "ny": [11, 11], "nz": [1, -1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [18, 10, 20, 19, 19], "pz": [0, 1, 0, 0, -1], "nx": [11, 10, 14, 12, 13], "ny": [2, 2, 2, 2, 2], "nz": [0, 0, 0, 0, 0] }, { "size": 3, "px": [12, 2, 9], "py": [14, 5, 10], "pz": [0, -1, -1], "nx": [11, 10, 5], "ny": [10, 13, 5], "nz": [0, 0, 1] }, { "size": 2, "px": [2, 3], "py": [3, 7], "pz": [2, 1], "nx": [3, 10], "ny": [4, 13], "nz": [1, -1] }, { "size": 2, "px": [9, 3], "py": [21, 7], "pz": [0, -1], "nx": [10, 21], "ny": [7, 15], "nz": [1, 0] }, { "size": 2, "px": [21, 10], "py": [16, 8], "pz": [0, 1], "nx": [8, 2], "ny": [10, 8], "nz": [1, -1] }, { "size": 2, "px": [8, 8], "py": [6, 7], "pz": [1, -1], "nx": [12, 11], "ny": [11, 7], "nz": [0, 1] }, { "size": 2, "px": [3, 11], "py": [4, 20], "pz": [2, 0], "nx": [11, 10], "ny": [19, 1], "nz": [0, -1] }, { "size": 2, "px": [17, 5], "py": [13, 3], "pz": [0, -1], "nx": [7, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [7, 1], "py": [23, 3], "pz": [0, 2], "nx": [14, 6], "ny": [12, 9], "nz": [0, -1] }, { "size": 2, "px": [12, 5], "py": [11, 2], "pz": [0, -1], "nx": [11, 7], "ny": [3, 1], "nz": [0, 1] }, { "size": 2, "px": [9, 6], "py": [2, 17], "pz": [0, -1], "nx": [4, 6], "ny": [4, 12], "nz": [1, 0] }, { "size": 2, "px": [14, 19], "py": [5, 6], "pz": [0, -1], "nx": [9, 3], "ny": [9, 1], "nz": [0, 2] }, { "size": 5, "px": [12, 13, 13, 13, 12], "py": [9, 11, 12, 13, 10], "pz": [0, 0, 0, 0, 0], "nx": [2, 4, 4, 4, 4], "ny": [7, 18, 17, 14, 14], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [10, 10], "py": [6, 6], "pz": [1, -1], "nx": [20, 18], "ny": [18, 23], "nz": [0, 0] }, { "size": 2, "px": [5, 6], "py": [4, 14], "pz": [1, -1], "nx": [9, 4], "ny": [2, 1], "nz": [1, 2] }, { "size": 2, "px": [11, 9], "py": [4, 18], "pz": [0, -1], "nx": [4, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [15, 0], "py": [18, 4], "pz": [0, -1], "nx": [3, 4], "ny": [5, 4], "nz": [2, 2] }, { "size": 4, "px": [7, 3, 6, 6], "py": [8, 4, 6, 5], "pz": [1, 2, 1, 1], "nx": [10, 4, 13, 0], "ny": [10, 4, 9, 22], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [10, 8], "py": [18, 11], "pz": [0, -1], "nx": [5, 4], "ny": [8, 10], "nz": [1, 1] }, { "size": 4, "px": [17, 2, 10, 2], "py": [14, 1, 10, 3], "pz": [0, -1, -1, -1], "nx": [8, 8, 17, 8], "ny": [4, 5, 12, 6], "nz": [1, 1, 0, 1] }, { "size": 5, "px": [9, 11, 9, 4, 10], "py": [1, 1, 0, 0, 1], "pz": [0, 0, 0, 1, 0], "nx": [8, 4, 7, 15, 15], "ny": [7, 2, 4, 17, 17], "nz": [1, 2, 1, 0, -1] }, { "size": 2, "px": [4, 3], "py": [11, 8], "pz": [0, -1], "nx": [2, 2], "ny": [1, 2], "nz": [2, 2] }, { "size": 2, "px": [11, 3], "py": [13, 8], "pz": [0, -1], "nx": [1, 1], "ny": [5, 2], "nz": [1, 2] }, { "size": 2, "px": [6, 2], "py": [8, 3], "pz": [0, 2], "nx": [3, 1], "ny": [5, 2], "nz": [1, -1] }, { "size": 5, "px": [10, 5, 7, 8, 6], "py": [9, 7, 7, 7, 7], "pz": [0, 0, 0, 0, 0], "nx": [7, 3, 0, 2, 15], "ny": [8, 0, 1, 18, 17], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [17, 8], "py": [12, 6], "pz": [0, 1], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 5, "px": [3, 11, 8, 10, 12], "py": [0, 2, 10, 2, 3], "pz": [2, 0, 0, 0, 0], "nx": [3, 2, 10, 2, 2], "ny": [6, 4, 11, 3, 3], "nz": [0, 1, 0, 1, -1] }, { "size": 2, "px": [3, 6], "py": [2, 4], "pz": [2, 1], "nx": [8, 19], "ny": [4, 16], "nz": [1, -1] }, { "size": 2, "px": [2, 2], "py": [1, 1], "pz": [2, -1], "nx": [7, 17], "ny": [1, 2], "nz": [1, 0] }, { "size": 5, "px": [16, 15, 14, 13, 7], "py": [0, 0, 0, 0, 0], "pz": [0, 0, 0, 0, -1], "nx": [6, 4, 8, 3, 11], "ny": [3, 4, 4, 1, 6], "nz": [1, 1, 1, 2, 0] }, { "size": 2, "px": [11, 1], "py": [8, 5], "pz": [0, -1], "nx": [13, 4], "ny": [10, 2], "nz": [0, 2] }, { "size": 2, "px": [4, 9], "py": [0, 2], "pz": [2, 1], "nx": [4, 11], "ny": [0, 2], "nz": [0, -1] }, { "size": 2, "px": [15, 15], "py": [2, 2], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [8, 17], "py": [9, 22], "pz": [1, 0], "nx": [8, 20], "ny": [10, 2], "nz": [1, -1] }, { "size": 2, "px": [10, 10], "py": [14, 22], "pz": [0, -1], "nx": [3, 11], "ny": [3, 3], "nz": [1, 0] }, { "size": 2, "px": [4, 2], "py": [1, 0], "pz": [1, 2], "nx": [5, 8], "ny": [3, 9], "nz": [0, -1] }, { "size": 2, "px": [2, 3], "py": [4, 8], "pz": [2, 1], "nx": [9, 5], "ny": [15, 19], "nz": [0, -1] }, { "size": 2, "px": [5, 2], "py": [1, 1], "pz": [0, 1], "nx": [10, 10], "ny": [6, 6], "nz": [0, -1] }, { "size": 2, "px": [17, 6], "py": [10, 2], "pz": [0, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 3, "px": [13, 7, 3], "py": [5, 2, 6], "pz": [0, 1, -1], "nx": [17, 16, 17], "ny": [1, 1, 2], "nz": [0, 0, 0] }, { "size": 2, "px": [11, 10], "py": [3, 3], "pz": [0, 0], "nx": [8, 4], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [4, 8], "py": [0, 8], "pz": [2, -1], "nx": [3, 4], "ny": [0, 0], "nz": [1, 1] }, { "size": 5, "px": [9, 2, 4, 1, 2], "py": [13, 3, 9, 2, 5], "pz": [0, 2, 1, 2, 2], "nx": [9, 5, 10, 4, 10], "ny": [5, 1, 3, 0, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [6, 12], "py": [5, 9], "pz": [1, 0], "nx": [0, 2], "ny": [23, 9], "nz": [0, -1] }, { "size": 2, "px": [22, 11], "py": [21, 8], "pz": [0, 1], "nx": [10, 0], "ny": [17, 2], "nz": [0, -1] }, { "size": 2, "px": [3, 1], "py": [22, 9], "pz": [0, 1], "nx": [22, 5], "ny": [11, 2], "nz": [0, 2] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [5, 6], "ny": [10, 9], "nz": [1, -1] }, { "size": 4, "px": [7, 3, 17, 7], "py": [8, 2, 10, 11], "pz": [0, 2, 0, 1], "nx": [6, 10, 5, 23], "ny": [9, 21, 1, 23], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [8, 3], "py": [7, 2], "pz": [1, 2], "nx": [8, 9], "ny": [4, 9], "nz": [1, -1] }, { "size": 2, "px": [9, 5], "py": [14, 6], "pz": [0, 1], "nx": [8, 8], "ny": [13, 13], "nz": [0, -1] }, { "size": 3, "px": [11, 6, 8], "py": [20, 3, 20], "pz": [0, -1, -1], "nx": [5, 3, 12], "ny": [9, 5, 18], "nz": [1, 2, 0] }, { "size": 2, "px": [3, 9], "py": [1, 3], "pz": [1, 0], "nx": [2, 8], "ny": [5, 8], "nz": [0, -1] }, { "size": 2, "px": [15, 9], "py": [21, 3], "pz": [0, -1], "nx": [3, 4], "ny": [5, 5], "nz": [2, 2] }, { "size": 2, "px": [2, 9], "py": [7, 11], "pz": [1, -1], "nx": [2, 2], "ny": [8, 9], "nz": [1, 1] }, { "size": 4, "px": [3, 4, 3, 1], "py": [14, 21, 19, 6], "pz": [0, 0, 0, 1], "nx": [10, 16, 4, 5], "ny": [8, 1, 7, 6], "nz": [0, -1, -1, -1] }, { "size": 4, "px": [10, 4, 3, 1], "py": [5, 21, 19, 6], "pz": [1, -1, -1, -1], "nx": [21, 10, 5, 11], "ny": [4, 2, 3, 4], "nz": [0, 1, 2, 1] }, { "size": 2, "px": [4, 17], "py": [3, 8], "pz": [2, 0], "nx": [17, 2], "ny": [9, 22], "nz": [0, -1] }, { "size": 2, "px": [17, 12], "py": [14, 20], "pz": [0, -1], "nx": [7, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [10, 12], "py": [9, 20], "pz": [0, -1], "nx": [11, 23], "ny": [8, 18], "nz": [1, 0] }, { "size": 2, "px": [5, 11], "py": [4, 7], "pz": [2, 1], "nx": [8, 15], "ny": [7, 5], "nz": [1, -1] }, { "size": 2, "px": [11, 15], "py": [13, 8], "pz": [0, -1], "nx": [11, 11], "ny": [6, 7], "nz": [1, 1] }, { "size": 2, "px": [6, 15], "py": [14, 8], "pz": [0, -1], "nx": [4, 4], "ny": [12, 13], "nz": [0, 0] }, { "size": 2, "px": [5, 5], "py": [0, 1], "pz": [2, 2], "nx": [15, 4], "ny": [5, 5], "nz": [0, -1] }, { "size": 2, "px": [16, 17], "py": [2, 2], "pz": [0, 0], "nx": [20, 8], "ny": [3, 7], "nz": [0, -1] }, { "size": 3, "px": [6, 3, 2], "py": [10, 6, 1], "pz": [0, -1, -1], "nx": [4, 3, 2], "ny": [3, 4, 2], "nz": [1, 1, 2] }, { "size": 2, "px": [10, 6], "py": [4, 6], "pz": [0, -1], "nx": [6, 13], "ny": [0, 1], "nz": [1, 0] }, { "size": 2, "px": [10, 10], "py": [8, 7], "pz": [1, 1], "nx": [8, 2], "ny": [7, 2], "nz": [1, -1] }, { "size": 2, "px": [7, 1], "py": [12, 4], "pz": [0, -1], "nx": [3, 4], "ny": [5, 5], "nz": [1, 1] }, { "size": 2, "px": [11, 15], "py": [15, 14], "pz": [0, -1], "nx": [3, 11], "ny": [4, 13], "nz": [1, 0] }, { "size": 5, "px": [13, 9, 11, 14, 12], "py": [0, 2, 0, 0, 2], "pz": [0, 0, 0, 0, 0], "nx": [5, 4, 4, 3, 4], "ny": [4, 4, 18, 7, 17], "nz": [1, 1, 0, 1, 0] }, { "size": 3, "px": [13, 12, 11], "py": [22, 22, 22], "pz": [0, 0, 0], "nx": [11, 12, 13], "ny": [20, 20, 20], "nz": [0, 0, 0] }, { "size": 2, "px": [6, 13], "py": [2, 4], "pz": [1, 0], "nx": [7, 6], "ny": [8, 9], "nz": [0, -1] }, { "size": 2, "px": [0, 0], "py": [23, 4], "pz": [0, -1], "nx": [5, 9], "ny": [1, 1], "nz": [1, 0] }, { "size": 2, "px": [14, 14], "py": [19, 19], "pz": [0, -1], "nx": [11, 11], "ny": [10, 9], "nz": [1, 1] }, { "size": 2, "px": [23, 23], "py": [11, 9], "pz": [0, 0], "nx": [23, 23], "ny": [0, 11], "nz": [0, -1] }, { "size": 2, "px": [23, 3], "py": [23, 5], "pz": [0, -1], "nx": [4, 1], "ny": [23, 10], "nz": [0, 1] }, { "size": 2, "px": [9, 1], "py": [7, 4], "pz": [1, -1], "nx": [19, 10], "ny": [20, 9], "nz": [0, 1] }, { "size": 2, "px": [16, 1], "py": [9, 4], "pz": [0, -1], "nx": [7, 8], "ny": [3, 3], "nz": [1, 1] }, { "size": 2, "px": [7, 6], "py": [13, 13], "pz": [0, 0], "nx": [4, 5], "ny": [4, 11], "nz": [1, -1] }, { "size": 5, "px": [19, 20, 20, 10, 10], "py": [0, 0, 2, 0, 1], "pz": [0, 0, 0, 1, 1], "nx": [7, 7, 15, 4, 4], "ny": [4, 13, 7, 4, 4], "nz": [1, 0, 0, 1, -1] }, { "size": 2, "px": [12, 23], "py": [6, 5], "pz": [0, -1], "nx": [18, 18], "ny": [17, 16], "nz": [0, 0] }, { "size": 2, "px": [6, 3], "py": [9, 2], "pz": [1, 2], "nx": [14, 18], "ny": [9, 1], "nz": [0, -1] }, { "size": 2, "px": [9, 13], "py": [16, 5], "pz": [0, -1], "nx": [5, 4], "ny": [7, 9], "nz": [1, 1] }, { "size": 2, "px": [10, 10], "py": [8, 10], "pz": [1, 1], "nx": [4, 1], "ny": [5, 3], "nz": [2, -1] }, { "size": 2, "px": [12, 11], "py": [13, 4], "pz": [0, -1], "nx": [0, 0], "ny": [14, 15], "nz": [0, 0] }, { "size": 2, "px": [2, 1], "py": [20, 17], "pz": [0, 0], "nx": [12, 12], "ny": [22, 2], "nz": [0, -1] }, { "size": 2, "px": [2, 3], "py": [6, 7], "pz": [1, -1], "nx": [21, 21], "ny": [13, 12], "nz": [0, 0] }, { "size": 2, "px": [3, 10], "py": [4, 23], "pz": [2, 0], "nx": [10, 2], "ny": [21, 5], "nz": [0, -1] }, { "size": 2, "px": [6, 12], "py": [3, 6], "pz": [1, 0], "nx": [11, 0], "ny": [17, 1], "nz": [0, -1] }, { "size": 2, "px": [11, 4], "py": [21, 9], "pz": [0, -1], "nx": [2, 3], "ny": [18, 22], "nz": [0, 0] }, { "size": 2, "px": [13, 5], "py": [18, 9], "pz": [0, -1], "nx": [6, 7], "ny": [8, 9], "nz": [1, 1] }, { "size": 2, "px": [21, 4], "py": [16, 3], "pz": [0, -1], "nx": [23, 23], "ny": [16, 15], "nz": [0, 0] }, { "size": 2, "px": [2, 0], "py": [7, 4], "pz": [1, -1], "nx": [3, 8], "ny": [7, 4], "nz": [1, 1] }, { "size": 2, "px": [15, 16], "py": [11, 12], "pz": [0, 0], "nx": [8, 5], "ny": [4, 5], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [7, 5], "pz": [0, 0], "nx": [17, 17], "ny": [11, 10], "nz": [0, -1] }, { "size": 5, "px": [8, 13, 12, 3, 3], "py": [6, 23, 23, 3, 3], "pz": [1, 0, 0, 2, -1], "nx": [0, 1, 0, 0, 0], "ny": [2, 13, 4, 5, 6], "nz": [2, 0, 1, 1, 1] }, { "size": 2, "px": [0, 1], "py": [7, 8], "pz": [1, -1], "nx": [0, 0], "ny": [1, 0], "nz": [2, 2] }, { "size": 2, "px": [2, 12], "py": [1, 7], "pz": [1, -1], "nx": [0, 0], "ny": [12, 14], "nz": [0, 0] }, { "size": 2, "px": [5, 1], "py": [7, 4], "pz": [1, 2], "nx": [8, 0], "ny": [15, 14], "nz": [0, -1] }, { "size": 2, "px": [7, 4], "py": [14, 8], "pz": [0, -1], "nx": [2, 4], "ny": [1, 4], "nz": [2, 1] }, { "size": 2, "px": [5, 3], "py": [3, 1], "pz": [2, -1], "nx": [9, 9], "ny": [5, 6], "nz": [1, 1] }, { "size": 2, "px": [4, 5], "py": [2, 3], "pz": [1, -1], "nx": [11, 12], "ny": [23, 23], "nz": [0, 0] }, { "size": 2, "px": [10, 5], "py": [7, 0], "pz": [1, -1], "nx": [22, 22], "ny": [19, 18], "nz": [0, 0] }, { "size": 3, "px": [10, 2, 9], "py": [20, 9, 4], "pz": [0, -1, -1], "nx": [1, 10, 11], "ny": [2, 11, 9], "nz": [2, 0, 0] }, { "size": 2, "px": [4, 8], "py": [3, 6], "pz": [2, 1], "nx": [9, 3], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [17, 6], "py": [7, 16], "pz": [0, -1], "nx": [17, 17], "ny": [9, 6], "nz": [0, 0] }, { "size": 3, "px": [8, 1, 9], "py": [6, 3, 4], "pz": [1, -1, -1], "nx": [2, 9, 2], "ny": [5, 13, 3], "nz": [2, 0, 2] }, { "size": 4, "px": [10, 10, 9, 2], "py": [12, 11, 2, 10], "pz": [0, 0, -1, -1], "nx": [6, 11, 3, 13], "ny": [2, 4, 1, 4], "nz": [1, 0, 2, 0] }, { "size": 2, "px": [3, 3], "py": [7, 1], "pz": [1, -1], "nx": [4, 3], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [0, 0], "py": [4, 8], "pz": [2, 1], "nx": [4, 4], "ny": [15, 5], "nz": [0, -1] }, { "size": 2, "px": [5, 0], "py": [4, 8], "pz": [1, -1], "nx": [13, 13], "ny": [9, 10], "nz": [0, 0] }, { "size": 2, "px": [6, 3], "py": [2, 1], "pz": [1, 2], "nx": [8, 17], "ny": [4, 12], "nz": [1, -1] }, { "size": 2, "px": [15, 16], "py": [11, 6], "pz": [0, 0], "nx": [16, 17], "ny": [5, 12], "nz": [0, -1] }, { "size": 2, "px": [13, 11], "py": [9, 7], "pz": [0, -1], "nx": [0, 1], "ny": [9, 20], "nz": [1, 0] }, { "size": 3, "px": [16, 11, 20], "py": [4, 7, 23], "pz": [0, -1, -1], "nx": [8, 9, 4], "ny": [4, 6, 4], "nz": [1, 1, 2] }, { "size": 2, "px": [1, 1], "py": [18, 17], "pz": [0, 0], "nx": [9, 6], "ny": [7, 11], "nz": [0, -1] }, { "size": 3, "px": [4, 4, 19], "py": [3, 2, 9], "pz": [2, 2, 0], "nx": [2, 14, 11], "ny": [5, 3, 9], "nz": [1, -1, -1] }, { "size": 2, "px": [11, 19], "py": [13, 9], "pz": [0, -1], "nx": [11, 11], "ny": [4, 5], "nz": [1, 1] }, { "size": 2, "px": [13, 7], "py": [19, 2], "pz": [0, -1], "nx": [3, 5], "ny": [6, 12], "nz": [1, 0] }, { "size": 4, "px": [9, 4, 4, 2], "py": [13, 9, 8, 4], "pz": [0, 1, 1, 2], "nx": [13, 0, 0, 14], "ny": [18, 11, 6, 1], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [11, 15], "py": [8, 10], "pz": [0, 0], "nx": [14, 11], "ny": [9, 2], "nz": [0, -1] }, { "size": 2, "px": [3, 2], "py": [8, 5], "pz": [1, 2], "nx": [4, 4], "ny": [10, 10], "nz": [1, -1] }, { "size": 4, "px": [4, 6, 16, 14], "py": [1, 1, 1, 7], "pz": [2, 1, 0, 0], "nx": [10, 1, 1, 2], "ny": [8, 5, 10, 3], "nz": [0, -1, -1, -1] }, { "size": 4, "px": [2, 3, 1, 2], "py": [3, 1, 0, 2], "pz": [0, 0, 1, 0], "nx": [0, 0, 0, 0], "ny": [1, 1, 2, 0], "nz": [0, 1, 0, 1] }, { "size": 2, "px": [8, 8], "py": [6, 7], "pz": [1, 1], "nx": [8, 0], "ny": [4, 1], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [3, 0], "pz": [0, 1], "nx": [2, 2], "ny": [1, 16], "nz": [1, -1] }, { "size": 2, "px": [6, 6], "py": [19, 18], "pz": [0, 0], "nx": [2, 10], "ny": [5, 8], "nz": [2, -1] }, { "size": 2, "px": [8, 5], "py": [21, 11], "pz": [0, -1], "nx": [3, 2], "ny": [11, 5], "nz": [1, 2] }, { "size": 2, "px": [4, 9], "py": [4, 7], "pz": [2, 1], "nx": [8, 7], "ny": [10, 4], "nz": [1, -1] }, { "size": 5, "px": [4, 18, 19, 16, 19], "py": [3, 12, 12, 23, 13], "pz": [2, 0, 0, 0, 0], "nx": [2, 8, 3, 2, 2], "ny": [4, 23, 10, 5, 5], "nz": [2, 0, 1, 2, -1] }, { "size": 2, "px": [4, 8], "py": [6, 11], "pz": [1, 0], "nx": [8, 3], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [3, 12], "py": [4, 13], "pz": [2, 0], "nx": [10, 5], "ny": [15, 21], "nz": [0, -1] }, { "size": 2, "px": [2, 9], "py": [4, 23], "pz": [2, 0], "nx": [19, 4], "ny": [9, 3], "nz": [0, 2] }, { "size": 2, "px": [3, 6], "py": [8, 15], "pz": [1, 0], "nx": [6, 1], "ny": [18, 5], "nz": [0, -1] }, { "size": 2, "px": [9, 0], "py": [20, 3], "pz": [0, -1], "nx": [2, 10], "ny": [5, 17], "nz": [2, 0] }, { "size": 3, "px": [10, 6, 3], "py": [2, 7, 3], "pz": [0, -1, -1], "nx": [5, 4, 2], "ny": [9, 7, 2], "nz": [1, 1, 2] }, { "size": 2, "px": [14, 6], "py": [12, 7], "pz": [0, -1], "nx": [2, 10], "ny": [0, 1], "nz": [2, 0] }, { "size": 3, "px": [10, 5, 1], "py": [15, 5, 4], "pz": [0, -1, -1], "nx": [9, 4, 18], "ny": [2, 0, 4], "nz": [1, 2, 0] }, { "size": 2, "px": [17, 2], "py": [12, 6], "pz": [0, -1], "nx": [8, 16], "ny": [4, 11], "nz": [1, 0] }, { "size": 3, "px": [7, 13, 4], "py": [0, 0, 1], "pz": [1, 0, -1], "nx": [18, 4, 4], "ny": [13, 2, 3], "nz": [0, 2, 2] }, { "size": 2, "px": [1, 11], "py": [10, 6], "pz": [0, -1], "nx": [0, 1], "ny": [15, 17], "nz": [0, 0] }, { "size": 3, "px": [9, 12, 8], "py": [8, 17, 11], "pz": [1, 0, 1], "nx": [12, 0, 20], "ny": [16, 9, 13], "nz": [0, -1, -1] }, { "size": 2, "px": [11, 4], "py": [5, 8], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [16, 3], "py": [9, 8], "pz": [0, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [6, 3], "py": [11, 5], "pz": [1, 2], "nx": [11, 5], "ny": [21, 5], "nz": [0, -1] }, { "size": 2, "px": [11, 13], "py": [1, 1], "pz": [0, 0], "nx": [4, 4], "ny": [5, 5], "nz": [1, -1] }, { "size": 2, "px": [14, 4], "py": [4, 3], "pz": [0, -1], "nx": [12, 10], "ny": [2, 2], "nz": [0, 0] }, { "size": 2, "px": [3, 6], "py": [2, 4], "pz": [2, 1], "nx": [9, 7], "ny": [9, 7], "nz": [0, -1] }, { "size": 3, "px": [5, 6, 6], "py": [4, 4, 4], "pz": [1, -1, -1], "nx": [13, 8, 7], "ny": [8, 3, 4], "nz": [0, 1, 1] }, { "size": 2, "px": [5, 5], "py": [2, 11], "pz": [1, 1], "nx": [10, 11], "ny": [22, 22], "nz": [0, 0] }, { "size": 2, "px": [16, 9], "py": [13, 7], "pz": [0, 1], "nx": [8, 14], "ny": [4, 12], "nz": [1, -1] }, { "size": 2, "px": [13, 5], "py": [13, 3], "pz": [0, 2], "nx": [16, 22], "ny": [13, 6], "nz": [0, -1] }, { "size": 4, "px": [4, 4, 3, 4], "py": [4, 3, 4, 5], "pz": [2, 2, 2, 2], "nx": [21, 5, 17, 7], "ny": [0, 2, 5, 23], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [4, 16], "py": [0, 1], "pz": [2, 0], "nx": [15, 1], "ny": [23, 10], "nz": [0, -1] }, { "size": 2, "px": [4, 6], "py": [11, 2], "pz": [0, -1], "nx": [15, 6], "ny": [2, 1], "nz": [0, 1] }, { "size": 2, "px": [6, 3], "py": [2, 1], "pz": [1, 2], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 3, "px": [13, 14, 5], "py": [9, 15, 2], "pz": [0, -1, -1], "nx": [11, 1, 11], "ny": [10, 3, 11], "nz": [0, 1, 0] }, { "size": 2, "px": [5, 1], "py": [6, 2], "pz": [1, -1], "nx": [1, 1], "ny": [2, 5], "nz": [2, 1] }, { "size": 2, "px": [11, 5], "py": [1, 0], "pz": [1, 2], "nx": [10, 4], "ny": [2, 3], "nz": [1, -1] }, { "size": 2, "px": [11, 11], "py": [8, 9], "pz": [1, 1], "nx": [23, 4], "ny": [23, 2], "nz": [0, -1] }, { "size": 2, "px": [5, 2], "py": [10, 2], "pz": [0, -1], "nx": [18, 10], "ny": [0, 1], "nz": [0, 1] }, { "size": 2, "px": [20, 4], "py": [7, 3], "pz": [0, 2], "nx": [8, 4], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [10, 4], "py": [5, 4], "pz": [1, -1], "nx": [11, 11], "ny": [5, 6], "nz": [1, 1] }, { "size": 3, "px": [14, 15, 16], "py": [0, 0, 1], "pz": [0, 0, 0], "nx": [8, 5, 15], "ny": [7, 2, 10], "nz": [1, -1, -1] }, { "size": 2, "px": [2, 2], "py": [1, 1], "pz": [2, -1], "nx": [17, 18], "ny": [2, 2], "nz": [0, 0] }, { "size": 2, "px": [13, 8], "py": [15, 7], "pz": [0, -1], "nx": [9, 4], "ny": [5, 2], "nz": [0, 1] }, { "size": 2, "px": [4, 0], "py": [6, 17], "pz": [1, -1], "nx": [3, 2], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [14, 8], "py": [17, 9], "pz": [0, -1], "nx": [7, 6], "ny": [8, 8], "nz": [1, 1] }, { "size": 2, "px": [10, 4], "py": [7, 1], "pz": [1, -1], "nx": [15, 6], "ny": [14, 4], "nz": [0, 1] }, { "size": 2, "px": [3, 12], "py": [8, 19], "pz": [1, 0], "nx": [13, 10], "ny": [17, 9], "nz": [0, -1] }, { "size": 2, "px": [7, 12], "py": [2, 4], "pz": [1, 0], "nx": [6, 11], "ny": [3, 2], "nz": [0, -1] }, { "size": 4, "px": [2, 1, 6, 1], "py": [10, 3, 23, 8], "pz": [1, 2, 0, 1], "nx": [17, 10, 23, 0], "ny": [9, 2, 20, 3], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [9, 9], "py": [2, 8], "pz": [0, -1], "nx": [2, 2], "ny": [4, 2], "nz": [2, 2] }, { "size": 2, "px": [3, 16], "py": [1, 6], "pz": [2, 0], "nx": [8, 4], "ny": [2, 5], "nz": [1, -1] }, { "size": 2, "px": [3, 6], "py": [1, 2], "pz": [2, 1], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [5, 6], "py": [3, 0], "pz": [2, -1], "nx": [9, 5], "ny": [2, 1], "nz": [0, 1] }, { "size": 2, "px": [3, 16], "py": [5, 23], "pz": [1, -1], "nx": [0, 0], "ny": [6, 3], "nz": [1, 2] }, { "size": 4, "px": [0, 0, 0, 0], "py": [3, 2, 12, 5], "pz": [2, 2, 0, 1], "nx": [2, 3, 2, 13], "ny": [5, 5, 2, 19], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [11, 11], "py": [10, 11], "pz": [0, 0], "nx": [5, 5], "ny": [1, 1], "nz": [2, -1] }, { "size": 2, "px": [5, 2], "py": [0, 4], "pz": [2, -1], "nx": [2, 2], "ny": [10, 8], "nz": [1, 1] }, { "size": 4, "px": [16, 2, 8, 4], "py": [14, 0, 11, 5], "pz": [0, -1, -1, -1], "nx": [18, 14, 7, 7], "ny": [13, 14, 8, 6], "nz": [0, 0, 1, 1] }, { "size": 2, "px": [8, 9], "py": [2, 2], "pz": [0, 0], "nx": [5, 14], "ny": [4, 14], "nz": [1, -1] }, { "size": 2, "px": [3, 5], "py": [11, 20], "pz": [1, 0], "nx": [11, 4], "ny": [0, 2], "nz": [0, -1] }, { "size": 2, "px": [2, 2], "py": [3, 4], "pz": [2, 2], "nx": [3, 4], "ny": [4, 2], "nz": [1, -1] }, { "size": 3, "px": [10, 4, 3], "py": [5, 5, 3], "pz": [0, -1, -1], "nx": [11, 3, 10], "ny": [2, 0, 2], "nz": [0, 2, 0] }, { "size": 2, "px": [15, 15], "py": [1, 1], "pz": [0, -1], "nx": [7, 4], "ny": [5, 2], "nz": [1, 2] }, { "size": 4, "px": [9, 5, 2, 6], "py": [22, 8, 4, 19], "pz": [0, 1, 2, 0], "nx": [9, 5, 0, 3], "ny": [20, 5, 22, 4], "nz": [0, -1, -1, -1] }, { "size": 3, "px": [1, 4, 10], "py": [3, 9, 12], "pz": [2, 1, 0], "nx": [0, 10, 0], "ny": [0, 5, 0], "nz": [0, -1, -1] }, { "size": 2, "px": [1, 6], "py": [0, 7], "pz": [0, -1], "nx": [20, 19], "ny": [14, 14], "nz": [0, 0] }, { "size": 2, "px": [13, 4], "py": [14, 15], "pz": [0, -1], "nx": [2, 1], "ny": [5, 7], "nz": [0, 0] }, { "size": 2, "px": [17, 7], "py": [9, 11], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [17, 9], "py": [12, 6], "pz": [0, 1], "nx": [15, 10], "ny": [9, 8], "nz": [0, -1] }, { "size": 2, "px": [0, 0], "py": [0, 1], "pz": [2, 2], "nx": [9, 7], "ny": [6, 17], "nz": [1, -1] }, { "size": 3, "px": [3, 3, 15], "py": [3, 4, 6], "pz": [2, 1, 0], "nx": [0, 2, 22], "ny": [5, 8, 9], "nz": [0, -1, -1] }, { "size": 4, "px": [15, 15, 15, 1], "py": [12, 6, 6, 1], "pz": [0, -1, -1, -1], "nx": [4, 7, 13, 4], "ny": [4, 7, 12, 2], "nz": [2, 1, 0, 2] }, { "size": 2, "px": [3, 15], "py": [12, 6], "pz": [0, -1], "nx": [9, 1], "ny": [14, 2], "nz": [0, 2] }, { "size": 2, "px": [12, 12], "py": [11, 12], "pz": [0, 0], "nx": [9, 5], "ny": [4, 4], "nz": [1, -1] }, { "size": 3, "px": [23, 6, 7], "py": [23, 3, 4], "pz": [0, -1, -1], "nx": [19, 16, 17], "ny": [17, 14, 15], "nz": [0, 0, 0] }, { "size": 2, "px": [9, 5], "py": [2, 7], "pz": [1, -1], "nx": [11, 23], "ny": [10, 18], "nz": [1, 0] }, { "size": 3, "px": [0, 0, 0], "py": [4, 9, 2], "pz": [1, 0, 2], "nx": [2, 0, 0], "ny": [9, 2, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [12, 0], "py": [11, 9], "pz": [0, -1], "nx": [1, 0], "ny": [18, 5], "nz": [0, 2] }, { "size": 2, "px": [5, 4], "py": [10, 6], "pz": [0, 1], "nx": [10, 6], "ny": [10, 18], "nz": [0, -1] }, { "size": 2, "px": [13, 12], "py": [13, 13], "pz": [0, -1], "nx": [5, 11], "ny": [1, 3], "nz": [2, 1] }, { "size": 2, "px": [10, 19], "py": [5, 22], "pz": [1, -1], "nx": [4, 12], "ny": [1, 5], "nz": [2, 0] }, { "size": 2, "px": [8, 6], "py": [0, 0], "pz": [0, 0], "nx": [3, 12], "ny": [0, 3], "nz": [0, -1] }, { "size": 2, "px": [9, 6], "py": [7, 0], "pz": [1, -1], "nx": [12, 12], "ny": [10, 11], "nz": [0, 0] }, { "size": 4, "px": [3, 1, 3, 2], "py": [20, 9, 21, 19], "pz": [0, 1, 0, 0], "nx": [20, 20, 5, 12], "ny": [10, 15, 2, 10], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 1], "ny": [4, 6], "nz": [1, -1] }, { "size": 3, "px": [5, 11, 11], "py": [1, 3, 4], "pz": [2, 1, 1], "nx": [3, 3, 7], "ny": [5, 5, 0], "nz": [1, -1, -1] }, { "size": 3, "px": [8, 6, 7], "py": [10, 5, 6], "pz": [1, 1, 1], "nx": [23, 3, 7], "ny": [0, 5, 0], "nz": [0, -1, -1] }, { "size": 2, "px": [2, 7], "py": [2, 14], "pz": [1, -1], "nx": [7, 3], "ny": [12, 4], "nz": [0, 1] }, { "size": 2, "px": [5, 3], "py": [6, 3], "pz": [1, 2], "nx": [13, 3], "ny": [12, 4], "nz": [0, -1] }, { "size": 2, "px": [11, 18], "py": [11, 4], "pz": [0, -1], "nx": [23, 11], "ny": [19, 10], "nz": [0, 1] }, { "size": 2, "px": [7, 2], "py": [12, 3], "pz": [0, -1], "nx": [8, 4], "ny": [11, 5], "nz": [0, 1] }, { "size": 2, "px": [11, 11], "py": [0, 11], "pz": [1, -1], "nx": [3, 3], "ny": [19, 18], "nz": [0, 0] }, { "size": 2, "px": [11, 1], "py": [11, 11], "pz": [1, -1], "nx": [13, 15], "ny": [6, 5], "nz": [0, 0] }, { "size": 2, "px": [8, 8], "py": [9, 9], "pz": [0, -1], "nx": [5, 11], "ny": [1, 3], "nz": [2, 1] }, { "size": 4, "px": [6, 4, 8, 3], "py": [6, 2, 4, 3], "pz": [0, 2, 1, 2], "nx": [7, 0, 15, 8], "ny": [8, 8, 16, 7], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [4, 3], "py": [22, 20], "pz": [0, 0], "nx": [2, 8], "ny": [5, 4], "nz": [2, -1] }, { "size": 2, "px": [12, 6], "py": [11, 0], "pz": [0, -1], "nx": [0, 0], "ny": [3, 1], "nz": [1, 2] }, { "size": 2, "px": [0, 0], "py": [12, 7], "pz": [0, 1], "nx": [3, 1], "ny": [23, 9], "nz": [0, -1] }, { "size": 2, "px": [7, 0], "py": [11, 5], "pz": [1, -1], "nx": [0, 0], "ny": [2, 3], "nz": [2, 2] }, { "size": 2, "px": [8, 8], "py": [10, 10], "pz": [0, -1], "nx": [4, 3], "ny": [5, 4], "nz": [2, 2] }, { "size": 2, "px": [13, 3], "py": [2, 4], "pz": [0, -1], "nx": [4, 3], "ny": [3, 5], "nz": [2, 2] }, { "size": 2, "px": [1, 1], "py": [23, 22], "pz": [0, 0], "nx": [9, 0], "ny": [7, 3], "nz": [0, -1] }, { "size": 2, "px": [1, 0], "py": [16, 15], "pz": [0, 0], "nx": [0, 14], "ny": [23, 12], "nz": [0, -1] }, { "size": 2, "px": [13, 8], "py": [22, 0], "pz": [0, -1], "nx": [5, 3], "ny": [0, 1], "nz": [1, 1] }, { "size": 2, "px": [13, 13], "py": [7, 7], "pz": [0, -1], "nx": [3, 2], "ny": [17, 10], "nz": [0, 1] }, { "size": 2, "px": [20, 20], "py": [15, 16], "pz": [0, 0], "nx": [7, 3], "ny": [9, 17], "nz": [1, -1] }, { "size": 5, "px": [10, 12, 11, 13, 11], "py": [2, 2, 1, 2, 2], "pz": [0, 0, 0, 0, 0], "nx": [10, 18, 21, 21, 19], "ny": [3, 1, 13, 11, 2], "nz": [1, 0, 0, 0, 0] }, { "size": 2, "px": [16, 3], "py": [6, 1], "pz": [0, 2], "nx": [15, 18], "ny": [8, 1], "nz": [0, -1] }, { "size": 2, "px": [19, 3], "py": [8, 1], "pz": [0, -1], "nx": [9, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [10, 3], "py": [15, 18], "pz": [0, -1], "nx": [3, 3], "ny": [0, 1], "nz": [2, 2] }, { "size": 2, "px": [3, 3], "py": [2, 3], "pz": [2, 2], "nx": [7, 3], "ny": [11, 1], "nz": [1, -1] }, { "size": 2, "px": [11, 10], "py": [17, 9], "pz": [0, -1], "nx": [11, 10], "ny": [15, 15], "nz": [0, 0] }, { "size": 2, "px": [5, 10], "py": [2, 4], "pz": [1, 0], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [9, 10], "py": [3, 4], "pz": [0, -1], "nx": [9, 10], "ny": [2, 1], "nz": [0, 0] }, { "size": 2, "px": [23, 11], "py": [13, 10], "pz": [0, 1], "nx": [14, 7], "ny": [5, 14], "nz": [0, -1] }, { "size": 2, "px": [4, 4], "py": [5, 4], "pz": [2, 2], "nx": [9, 8], "ny": [3, 3], "nz": [1, -1] }, { "size": 3, "px": [12, 4, 15], "py": [5, 4, 7], "pz": [0, -1, -1], "nx": [3, 4, 2], "ny": [7, 11, 5], "nz": [1, 1, 2] }, { "size": 2, "px": [11, 4], "py": [15, 4], "pz": [0, -1], "nx": [5, 9], "ny": [7, 15], "nz": [1, 0] }, { "size": 2, "px": [9, 7], "py": [0, 1], "pz": [1, -1], "nx": [11, 11], "ny": [8, 7], "nz": [1, 1] }, { "size": 5, "px": [1, 1, 1, 1, 1], "py": [11, 12, 10, 9, 9], "pz": [0, 0, 0, 0, -1], "nx": [4, 5, 8, 16, 11], "ny": [4, 3, 8, 8, 6], "nz": [1, 1, 0, 0, 0] }], "alpha": [-1.059083e+00, 1.059083e+00, -7.846122e-01, 7.846122e-01, -4.451160e-01, 4.451160e-01, -4.483277e-01, 4.483277e-01, -3.905999e-01, 3.905999e-01, -3.789250e-01, 3.789250e-01, -3.874610e-01, 3.874610e-01, -3.110541e-01, 3.110541e-01, -3.565056e-01, 3.565056e-01, -3.812617e-01, 3.812617e-01, -3.325142e-01, 3.325142e-01, -2.787282e-01, 2.787282e-01, -3.238869e-01, 3.238869e-01, -2.993499e-01, 2.993499e-01, -2.807737e-01, 2.807737e-01, -2.855285e-01, 2.855285e-01, -2.277550e-01, 2.277550e-01, -2.031261e-01, 2.031261e-01, -2.071574e-01, 2.071574e-01, -2.534142e-01, 2.534142e-01, -2.266871e-01, 2.266871e-01, -2.229078e-01, 2.229078e-01, -2.716325e-01, 2.716325e-01, -3.046938e-01, 3.046938e-01, -2.271601e-01, 2.271601e-01, -1.987651e-01, 1.987651e-01, -1.953664e-01, 1.953664e-01, -2.178737e-01, 2.178737e-01, -2.285148e-01, 2.285148e-01, -1.891073e-01, 1.891073e-01, -2.926469e-01, 2.926469e-01, -2.094783e-01, 2.094783e-01, -1.478037e-01, 1.478037e-01, -1.707579e-01, 1.707579e-01, -1.464390e-01, 1.464390e-01, -2.462321e-01, 2.462321e-01, -2.319978e-01, 2.319978e-01, -1.781651e-01, 1.781651e-01, -1.471349e-01, 1.471349e-01, -1.953006e-01, 1.953006e-01, -2.145108e-01, 2.145108e-01, -1.567881e-01, 1.567881e-01, -2.024617e-01, 2.024617e-01, -1.883198e-01, 1.883198e-01, -1.996976e-01, 1.996976e-01, -1.292330e-01, 1.292330e-01, -2.142242e-01, 2.142242e-01, -2.473748e-01, 2.473748e-01, -1.880902e-01, 1.880902e-01, -1.874572e-01, 1.874572e-01, -1.495984e-01, 1.495984e-01, -1.608525e-01, 1.608525e-01, -1.698402e-01, 1.698402e-01, -1.898871e-01, 1.898871e-01, -1.350238e-01, 1.350238e-01, -1.727032e-01, 1.727032e-01, -1.593352e-01, 1.593352e-01, -1.476968e-01, 1.476968e-01, -1.428431e-01, 1.428431e-01, -1.766261e-01, 1.766261e-01, -1.453226e-01, 1.453226e-01, -1.929885e-01, 1.929885e-01, -1.337582e-01, 1.337582e-01, -1.629078e-01, 1.629078e-01, -9.973085e-02, 9.973085e-02, -1.172760e-01, 1.172760e-01, -1.399242e-01, 1.399242e-01, -1.613189e-01, 1.613189e-01, -1.145695e-01, 1.145695e-01, -1.191093e-01, 1.191093e-01, -1.225900e-01, 1.225900e-01, -1.641114e-01, 1.641114e-01, -1.419878e-01, 1.419878e-01, -2.183465e-01, 2.183465e-01, -1.566968e-01, 1.566968e-01, -1.288216e-01, 1.288216e-01, -1.422831e-01, 1.422831e-01, -2.000107e-01, 2.000107e-01, -1.817265e-01, 1.817265e-01, -1.793796e-01, 1.793796e-01, -1.428926e-01, 1.428926e-01, -1.182032e-01, 1.182032e-01, -1.150421e-01, 1.150421e-01, -1.336584e-01, 1.336584e-01, -1.656178e-01, 1.656178e-01, -1.386549e-01, 1.386549e-01, -1.387461e-01, 1.387461e-01, -1.313023e-01, 1.313023e-01, -1.360391e-01, 1.360391e-01, -1.305505e-01, 1.305505e-01, -1.323399e-01, 1.323399e-01, -1.502891e-01, 1.502891e-01, -1.488859e-01, 1.488859e-01, -1.126628e-01, 1.126628e-01, -1.233623e-01, 1.233623e-01, -1.702106e-01, 1.702106e-01, -1.629639e-01, 1.629639e-01, -1.337706e-01, 1.337706e-01, -1.290384e-01, 1.290384e-01, -1.165519e-01, 1.165519e-01, -1.412778e-01, 1.412778e-01, -1.470204e-01, 1.470204e-01, -2.213780e-01, 2.213780e-01, -1.472619e-01, 1.472619e-01, -1.357071e-01, 1.357071e-01, -1.416513e-01, 1.416513e-01, -1.050208e-01, 1.050208e-01, -1.480033e-01, 1.480033e-01, -1.899871e-01, 1.899871e-01, -1.466249e-01, 1.466249e-01, -1.076952e-01, 1.076952e-01, -1.035096e-01, 1.035096e-01, -1.566970e-01, 1.566970e-01, -1.364115e-01, 1.364115e-01, -1.512889e-01, 1.512889e-01, -1.252851e-01, 1.252851e-01, -1.206300e-01, 1.206300e-01, -1.059134e-01, 1.059134e-01, -1.140398e-01, 1.140398e-01, -1.359912e-01, 1.359912e-01, -1.231201e-01, 1.231201e-01, -1.231867e-01, 1.231867e-01, -9.789923e-02, 9.789923e-02, -1.590213e-01, 1.590213e-01, -1.002206e-01, 1.002206e-01, -1.518339e-01, 1.518339e-01, -1.055203e-01, 1.055203e-01, -1.012579e-01, 1.012579e-01, -1.094956e-01, 1.094956e-01, -1.429592e-01, 1.429592e-01, -1.108838e-01, 1.108838e-01, -1.116475e-01, 1.116475e-01, -1.735371e-01, 1.735371e-01, -1.067758e-01, 1.067758e-01, -1.290406e-01, 1.290406e-01, -1.156822e-01, 1.156822e-01, -9.668217e-02, 9.668217e-02, -1.170053e-01, 1.170053e-01, -1.252092e-01, 1.252092e-01, -1.135158e-01, 1.135158e-01, -1.105896e-01, 1.105896e-01, -1.038175e-01, 1.038175e-01, -1.210459e-01, 1.210459e-01, -1.078878e-01, 1.078878e-01, -1.050808e-01, 1.050808e-01, -1.428227e-01, 1.428227e-01, -1.664600e-01, 1.664600e-01, -1.013508e-01, 1.013508e-01, -1.206930e-01, 1.206930e-01, -1.088972e-01, 1.088972e-01, -1.381026e-01, 1.381026e-01, -1.109115e-01, 1.109115e-01, -7.921549e-02, 7.921549e-02, -1.057832e-01, 1.057832e-01, -9.385827e-02, 9.385827e-02, -1.486035e-01, 1.486035e-01, -1.247401e-01, 1.247401e-01, -9.451327e-02, 9.451327e-02, -1.272805e-01, 1.272805e-01, -9.616206e-02, 9.616206e-02, -9.051084e-02, 9.051084e-02, -1.138458e-01, 1.138458e-01, -1.047581e-01, 1.047581e-01, -1.382394e-01, 1.382394e-01, -1.122203e-01, 1.122203e-01, -1.052936e-01, 1.052936e-01, -1.239318e-01, 1.239318e-01, -1.241439e-01, 1.241439e-01, -1.259012e-01, 1.259012e-01, -1.211701e-01, 1.211701e-01, -1.344131e-01, 1.344131e-01, -1.127778e-01, 1.127778e-01, -1.609745e-01, 1.609745e-01, -1.901382e-01, 1.901382e-01, -1.618962e-01, 1.618962e-01, -1.230398e-01, 1.230398e-01, -1.319311e-01, 1.319311e-01, -1.431410e-01, 1.431410e-01, -1.143306e-01, 1.143306e-01, -9.390938e-02, 9.390938e-02, -1.154161e-01, 1.154161e-01, -1.141205e-01, 1.141205e-01, -1.098048e-01, 1.098048e-01, -8.870072e-02, 8.870072e-02, -1.122444e-01, 1.122444e-01, -1.114147e-01, 1.114147e-01, -1.185710e-01, 1.185710e-01, -1.107775e-01, 1.107775e-01, -1.259167e-01, 1.259167e-01, -1.105176e-01, 1.105176e-01, -1.020691e-01, 1.020691e-01, -9.607863e-02, 9.607863e-02, -9.573700e-02, 9.573700e-02, -1.054349e-01, 1.054349e-01, -1.137856e-01, 1.137856e-01, -1.192043e-01, 1.192043e-01, -1.113264e-01, 1.113264e-01, -1.093137e-01, 1.093137e-01, -1.010919e-01, 1.010919e-01, -9.625901e-02, 9.625901e-02, -9.338459e-02, 9.338459e-02, -1.142944e-01, 1.142944e-01, -1.038877e-01, 1.038877e-01, -9.772862e-02, 9.772862e-02, -1.375298e-01, 1.375298e-01, -1.394776e-01, 1.394776e-01, -9.454765e-02, 9.454765e-02, -1.203246e-01, 1.203246e-01, -8.684943e-02, 8.684943e-02, -1.135622e-01, 1.135622e-01, -1.058181e-01, 1.058181e-01, -1.082152e-01, 1.082152e-01, -1.411355e-01, 1.411355e-01, -9.978846e-02, 9.978846e-02, -1.057874e-01, 1.057874e-01, -1.415366e-01, 1.415366e-01, -9.981014e-02, 9.981014e-02, -9.261151e-02, 9.261151e-02, -1.737173e-01, 1.737173e-01, -1.580335e-01, 1.580335e-01, -9.594668e-02, 9.594668e-02, -9.336013e-02, 9.336013e-02, -1.102373e-01, 1.102373e-01, -8.546557e-02, 8.546557e-02, -9.945057e-02, 9.945057e-02, -1.146358e-01, 1.146358e-01, -1.324734e-01, 1.324734e-01, -1.422296e-01, 1.422296e-01, -9.937990e-02, 9.937990e-02, -8.381049e-02, 8.381049e-02, -1.270714e-01, 1.270714e-01, -1.091738e-01, 1.091738e-01, -1.314881e-01, 1.314881e-01, -1.085159e-01, 1.085159e-01, -9.247554e-02, 9.247554e-02, -8.121645e-02, 8.121645e-02, -1.059589e-01, 1.059589e-01, -8.307793e-02, 8.307793e-02, -1.033103e-01, 1.033103e-01, -1.056706e-01, 1.056706e-01, -1.032803e-01, 1.032803e-01, -1.266840e-01, 1.266840e-01, -9.341601e-02, 9.341601e-02, -7.683570e-02, 7.683570e-02, -1.030530e-01, 1.030530e-01, -1.051872e-01, 1.051872e-01, -9.114946e-02, 9.114946e-02, -1.329341e-01, 1.329341e-01, -9.270830e-02, 9.270830e-02, -1.141750e-01, 1.141750e-01, -9.889318e-02, 9.889318e-02, -8.856485e-02, 8.856485e-02, -1.054210e-01, 1.054210e-01, -1.092704e-01, 1.092704e-01, -8.729085e-02, 8.729085e-02, -1.141057e-01, 1.141057e-01, -1.530774e-01, 1.530774e-01, -8.129720e-02, 8.129720e-02, -1.143335e-01, 1.143335e-01, -1.175777e-01, 1.175777e-01, -1.371729e-01, 1.371729e-01, -1.394356e-01, 1.394356e-01, -1.016308e-01, 1.016308e-01, -1.125547e-01, 1.125547e-01, -9.672600e-02, 9.672600e-02, -1.036631e-01, 1.036631e-01, -8.702514e-02, 8.702514e-02, -1.264807e-01, 1.264807e-01, -1.465688e-01, 1.465688e-01, -8.781464e-02, 8.781464e-02, -8.552605e-02, 8.552605e-02, -1.145072e-01, 1.145072e-01, -1.378489e-01, 1.378489e-01, -1.013312e-01, 1.013312e-01, -1.020083e-01, 1.020083e-01, -1.015816e-01, 1.015816e-01, -8.407101e-02, 8.407101e-02, -8.296485e-02, 8.296485e-02, -8.033655e-02, 8.033655e-02, -9.003615e-02, 9.003615e-02, -7.504954e-02, 7.504954e-02, -1.224941e-01, 1.224941e-01, -9.347814e-02, 9.347814e-02, -9.555575e-02, 9.555575e-02, -9.810025e-02, 9.810025e-02, -1.237068e-01, 1.237068e-01, -1.283586e-01, 1.283586e-01, -1.082763e-01, 1.082763e-01, -1.018145e-01, 1.018145e-01, -1.175161e-01, 1.175161e-01, -1.252279e-01, 1.252279e-01, -1.370559e-01, 1.370559e-01, -9.941339e-02, 9.941339e-02, -8.506938e-02, 8.506938e-02, -1.260902e-01, 1.260902e-01, -1.014152e-01, 1.014152e-01, -9.728694e-02, 9.728694e-02, -9.374910e-02, 9.374910e-02, -9.587429e-02, 9.587429e-02, -9.516036e-02, 9.516036e-02, -7.375173e-02, 7.375173e-02, -9.332487e-02, 9.332487e-02, -9.020733e-02, 9.020733e-02, -1.133381e-01, 1.133381e-01, -1.542180e-01, 1.542180e-01, -9.692168e-02, 9.692168e-02, -7.960904e-02, 7.960904e-02, -8.947089e-02, 8.947089e-02, -7.830286e-02, 7.830286e-02, -9.900050e-02, 9.900050e-02, -1.041293e-01, 1.041293e-01, -9.572501e-02, 9.572501e-02, -8.230575e-02, 8.230575e-02, -9.194901e-02, 9.194901e-02, -1.076971e-01, 1.076971e-01, -1.027782e-01, 1.027782e-01, -1.028538e-01, 1.028538e-01, -1.013992e-01, 1.013992e-01, -9.087585e-02, 9.087585e-02, -1.100706e-01, 1.100706e-01, -1.094934e-01, 1.094934e-01, -1.107879e-01, 1.107879e-01, -1.026915e-01, 1.026915e-01, -1.017572e-01, 1.017572e-01, -7.984776e-02, 7.984776e-02, -9.015413e-02, 9.015413e-02, -1.299870e-01, 1.299870e-01, -9.164982e-02, 9.164982e-02, -1.062788e-01, 1.062788e-01, -1.160203e-01, 1.160203e-01, -8.858603e-02, 8.858603e-02, -9.762964e-02, 9.762964e-02, -1.070694e-01, 1.070694e-01, -9.549046e-02, 9.549046e-02, -1.533034e-01, 1.533034e-01, -8.663316e-02, 8.663316e-02, -9.303018e-02, 9.303018e-02, -9.853582e-02, 9.853582e-02, -9.733371e-02, 9.733371e-02, -1.048555e-01, 1.048555e-01, -9.056041e-02, 9.056041e-02, -7.552283e-02, 7.552283e-02, -8.780631e-02, 8.780631e-02, -1.123953e-01, 1.123953e-01, -1.452948e-01, 1.452948e-01, -1.156423e-01, 1.156423e-01, -8.701142e-02, 8.701142e-02, -9.713334e-02, 9.713334e-02, -9.970888e-02, 9.970888e-02, -8.614129e-02, 8.614129e-02, -7.459861e-02, 7.459861e-02, -9.253517e-02, 9.253517e-02, -9.570092e-02, 9.570092e-02, -9.485535e-02, 9.485535e-02, -1.148365e-01, 1.148365e-01, -1.063193e-01, 1.063193e-01, -9.986686e-02, 9.986686e-02, -7.523412e-02, 7.523412e-02, -1.005881e-01, 1.005881e-01, -8.249716e-02, 8.249716e-02, -1.055866e-01, 1.055866e-01, -1.343050e-01, 1.343050e-01, -1.371056e-01, 1.371056e-01, -9.604689e-02, 9.604689e-02, -1.224268e-01, 1.224268e-01, -9.211478e-02, 9.211478e-02, -1.108371e-01, 1.108371e-01, -1.100547e-01, 1.100547e-01, -8.938970e-02, 8.938970e-02, -8.655951e-02, 8.655951e-02, -7.085816e-02, 7.085816e-02, -8.101028e-02, 8.101028e-02, -8.338046e-02, 8.338046e-02, -8.309588e-02, 8.309588e-02, -9.090584e-02, 9.090584e-02, -8.124564e-02, 8.124564e-02, -9.367843e-02, 9.367843e-02, -1.011747e-01, 1.011747e-01, -9.885045e-02, 9.885045e-02, -8.944266e-02, 8.944266e-02, -8.453859e-02, 8.453859e-02, -8.308847e-02, 8.308847e-02, -1.367280e-01, 1.367280e-01, -1.295144e-01, 1.295144e-01, -1.063965e-01, 1.063965e-01, -7.752328e-02, 7.752328e-02, -9.681524e-02, 9.681524e-02, -7.862345e-02, 7.862345e-02, -8.767746e-02, 8.767746e-02, -9.198041e-02, 9.198041e-02, -9.686489e-02, 9.686489e-02] }, { "count": 564, "threshold": -4.517456e+00, "feature": [{ "size": 5, "px": [15, 9, 8, 12, 11], "py": [3, 6, 3, 0, 8], "pz": [0, 1, 0, 0, 0], "nx": [6, 14, 9, 22, 23], "ny": [8, 7, 8, 17, 3], "nz": [1, 0, 0, 0, 0] }, { "size": 5, "px": [12, 13, 11, 14, 12], "py": [9, 4, 4, 4, 5], "pz": [0, 0, 0, 0, 0], "nx": [4, 6, 10, 4, 15], "ny": [3, 8, 7, 10, 9], "nz": [1, 1, 0, 1, 0] }, { "size": 5, "px": [7, 5, 6, 8, 8], "py": [2, 13, 2, 1, 1], "pz": [0, 0, 0, 0, -1], "nx": [3, 0, 4, 1, 0], "ny": [4, 3, 10, 3, 13], "nz": [1, 1, 1, 0, 0] }, { "size": 5, "px": [11, 2, 2, 11, 16], "py": [9, 4, 2, 7, 11], "pz": [0, 2, 2, 0, 0], "nx": [8, 4, 1, 14, 0], "ny": [4, 4, 16, 5, 13], "nz": [1, 1, -1, -1, -1] }, { "size": 2, "px": [14, 14], "py": [18, 18], "pz": [0, -1], "nx": [8, 13], "ny": [10, 16], "nz": [1, 0] }, { "size": 5, "px": [15, 17, 16, 8, 18], "py": [1, 2, 1, 0, 2], "pz": [0, 0, 0, 1, 0], "nx": [21, 22, 22, 22, 22], "ny": [1, 5, 3, 4, 2], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [15, 4], "py": [23, 3], "pz": [0, 2], "nx": [7, 3], "ny": [10, 6], "nz": [1, -1] }, { "size": 5, "px": [3, 6, 4, 3, 11], "py": [10, 11, 8, 3, 8], "pz": [1, 0, 1, 1, 0], "nx": [3, 5, 6, 3, 0], "ny": [4, 9, 9, 9, 0], "nz": [1, -1, -1, -1, -1] }, { "size": 3, "px": [11, 11, 2], "py": [11, 13, 16], "pz": [0, 0, -1], "nx": [10, 10, 9], "ny": [10, 11, 14], "nz": [0, 0, 0] }, { "size": 2, "px": [8, 4], "py": [12, 6], "pz": [0, 1], "nx": [4, 5], "ny": [11, 11], "nz": [1, -1] }, { "size": 5, "px": [10, 11, 13, 3, 12], "py": [3, 4, 3, 0, 1], "pz": [0, 0, 0, 2, 0], "nx": [14, 18, 20, 19, 15], "ny": [13, 1, 15, 2, 18], "nz": [0, 0, 0, 0, 0] }, { "size": 5, "px": [20, 14, 10, 12, 12], "py": [12, 12, 4, 10, 11], "pz": [0, 0, 1, 0, 0], "nx": [9, 2, 9, 9, 9], "ny": [4, 12, 5, 9, 14], "nz": [1, -1, -1, -1, -1] }, { "size": 5, "px": [3, 3, 3, 4, 2], "py": [15, 16, 14, 21, 12], "pz": [0, 0, 0, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [20, 10, 5, 21, 21], "nz": [0, 1, 2, 0, -1] }, { "size": 2, "px": [18, 8], "py": [16, 7], "pz": [0, 1], "nx": [14, 0], "ny": [8, 10], "nz": [0, -1] }, { "size": 4, "px": [12, 4, 16, 1], "py": [14, 3, 8, 3], "pz": [0, -1, -1, -1], "nx": [14, 10, 20, 13], "ny": [13, 5, 16, 9], "nz": [0, 1, 0, 0] }, { "size": 5, "px": [3, 8, 2, 3, 3], "py": [7, 2, 1, 2, 4], "pz": [1, -1, -1, -1, -1], "nx": [1, 9, 2, 1, 1], "ny": [3, 14, 9, 7, 2], "nz": [1, 0, 1, 1, 1] }, { "size": 5, "px": [4, 1, 3, 2, 3], "py": [2, 1, 2, 4, 3], "pz": [0, 1, 0, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [3, 1, 2, 0, 0], "nz": [0, 1, 0, 2, -1] }, { "size": 4, "px": [4, 8, 7, 9], "py": [6, 11, 11, 10], "pz": [1, 0, 0, 0], "nx": [3, 10, 2, 20], "ny": [4, 4, 4, 8], "nz": [1, -1, -1, -1] }, { "size": 2, "px": [1, 8], "py": [3, 11], "pz": [2, -1], "nx": [8, 2], "ny": [15, 5], "nz": [0, 2] }, { "size": 2, "px": [17, 0], "py": [13, 10], "pz": [0, -1], "nx": [14, 14], "ny": [11, 10], "nz": [0, 0] }, { "size": 5, "px": [22, 22, 22, 5, 22], "py": [16, 18, 17, 2, 15], "pz": [0, 0, 0, 2, 0], "nx": [8, 4, 15, 6, 6], "ny": [4, 2, 7, 11, 11], "nz": [1, 2, 0, 1, -1] }, { "size": 5, "px": [16, 9, 8, 17, 15], "py": [12, 6, 6, 22, 12], "pz": [0, 1, 1, 0, 0], "nx": [11, 23, 23, 23, 22], "ny": [11, 23, 22, 21, 23], "nz": [1, 0, 0, 0, -1] }, { "size": 5, "px": [5, 2, 4, 4, 9], "py": [22, 3, 15, 20, 18], "pz": [0, 2, 0, 0, 0], "nx": [9, 4, 23, 7, 22], "ny": [8, 4, 22, 19, 23], "nz": [0, -1, -1, -1, -1] }, { "size": 5, "px": [8, 6, 9, 7, 3], "py": [3, 3, 3, 3, 1], "pz": [0, 0, 0, 0, 1], "nx": [5, 5, 4, 4, 4], "ny": [0, 1, 1, 2, 0], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [2, 3], "py": [3, 3], "pz": [2, 2], "nx": [3, 6], "ny": [4, 6], "nz": [1, -1] }, { "size": 5, "px": [1, 1, 0, 1, 0], "py": [17, 15, 6, 16, 10], "pz": [0, 0, 1, 0, 0], "nx": [4, 4, 7, 4, 8], "ny": [2, 5, 9, 4, 4], "nz": [2, 2, 1, 2, -1] }, { "size": 5, "px": [12, 12, 12, 13, 13], "py": [10, 9, 11, 13, 13], "pz": [0, 0, 0, 0, -1], "nx": [4, 3, 3, 5, 3], "ny": [21, 18, 17, 23, 16], "nz": [0, 0, 0, 0, 0] }, { "size": 4, "px": [5, 6, 5, 9], "py": [13, 7, 9, 23], "pz": [0, 0, 1, 0], "nx": [6, 15, 7, 5], "ny": [9, 20, 7, 23], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [6, 3], "py": [4, 2], "pz": [1, 2], "nx": [8, 23], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [9, 7], "py": [18, 0], "pz": [0, 0], "nx": [5, 7], "ny": [8, 10], "nz": [1, 1] }, { "size": 2, "px": [4, 6], "py": [11, 16], "pz": [1, 0], "nx": [10, 9], "ny": [16, 7], "nz": [0, -1] }, { "size": 4, "px": [11, 11, 11, 11], "py": [11, 10, 12, 13], "pz": [0, 0, 0, 0], "nx": [13, 13, 13, 9], "ny": [11, 9, 10, 4], "nz": [0, 0, 0, 1] }, { "size": 4, "px": [12, 6, 7, 6], "py": [7, 11, 8, 4], "pz": [0, 1, 1, 1], "nx": [10, 0, 19, 7], "ny": [21, 3, 12, 11], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [4, 4], "py": [3, 4], "pz": [2, 2], "nx": [9, 1], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [19, 19], "py": [21, 20], "pz": [0, 0], "nx": [7, 7], "ny": [3, 13], "nz": [1, -1] }, { "size": 5, "px": [12, 9, 13, 11, 5], "py": [0, 2, 2, 0, 0], "pz": [0, 0, 0, 0, 1], "nx": [6, 4, 5, 5, 5], "ny": [1, 3, 5, 2, 6], "nz": [0, 0, 1, 0, 1] }, { "size": 5, "px": [4, 3, 2, 5, 7], "py": [11, 3, 3, 7, 17], "pz": [1, 2, 2, 0, 0], "nx": [23, 5, 11, 5, 5], "ny": [0, 4, 10, 2, 6], "nz": [0, -1, -1, -1, -1] }, { "size": 2, "px": [20, 17], "py": [12, 3], "pz": [0, -1], "nx": [20, 19], "ny": [21, 23], "nz": [0, 0] }, { "size": 2, "px": [2, 1], "py": [12, 8], "pz": [0, 0], "nx": [2, 8], "ny": [2, 16], "nz": [2, -1] }, { "size": 2, "px": [16, 5], "py": [4, 5], "pz": [0, -1], "nx": [7, 8], "ny": [9, 1], "nz": [1, 1] }, { "size": 2, "px": [2, 2], "py": [0, 1], "pz": [1, 1], "nx": [1, 8], "ny": [5, 1], "nz": [0, -1] }, { "size": 2, "px": [1, 1], "py": [12, 10], "pz": [0, 1], "nx": [2, 20], "ny": [23, 9], "nz": [0, -1] }, { "size": 4, "px": [11, 0, 0, 2], "py": [14, 3, 9, 22], "pz": [0, -1, -1, -1], "nx": [13, 14, 7, 3], "ny": [6, 7, 11, 1], "nz": [0, 0, 0, 2] }, { "size": 2, "px": [14, 0], "py": [2, 3], "pz": [0, -1], "nx": [4, 4], "ny": [4, 3], "nz": [2, 2] }, { "size": 2, "px": [23, 11], "py": [18, 11], "pz": [0, 1], "nx": [3, 2], "ny": [1, 21], "nz": [1, -1] }, { "size": 2, "px": [9, 9], "py": [17, 14], "pz": [0, -1], "nx": [4, 5], "ny": [10, 8], "nz": [1, 1] }, { "size": 2, "px": [9, 18], "py": [7, 14], "pz": [1, 0], "nx": [18, 9], "ny": [17, 8], "nz": [0, -1] }, { "size": 2, "px": [2, 8], "py": [4, 22], "pz": [2, 0], "nx": [4, 3], "ny": [10, 1], "nz": [1, -1] }, { "size": 2, "px": [5, 22], "py": [4, 9], "pz": [2, -1], "nx": [11, 23], "ny": [8, 14], "nz": [1, 0] }, { "size": 3, "px": [23, 5, 5], "py": [8, 2, 1], "pz": [0, 2, 2], "nx": [10, 10, 2], "ny": [4, 4, 2], "nz": [1, -1, -1] }, { "size": 2, "px": [11, 11], "py": [14, 23], "pz": [0, -1], "nx": [3, 11], "ny": [4, 13], "nz": [1, 0] }, { "size": 2, "px": [3, 2], "py": [7, 0], "pz": [1, -1], "nx": [4, 3], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [12, 1], "py": [19, 13], "pz": [0, -1], "nx": [9, 12], "ny": [10, 18], "nz": [1, 0] }, { "size": 2, "px": [10, 10], "py": [11, 10], "pz": [1, 1], "nx": [4, 1], "ny": [5, 11], "nz": [2, -1] }, { "size": 5, "px": [9, 12, 4, 8, 8], "py": [3, 5, 2, 9, 8], "pz": [1, 0, 2, 1, 1], "nx": [23, 23, 23, 23, 23], "ny": [3, 4, 6, 5, 5], "nz": [0, 0, 0, 0, -1] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 9], "ny": [4, 6], "nz": [1, -1] }, { "size": 5, "px": [13, 13, 13, 7, 7], "py": [11, 10, 9, 6, 6], "pz": [0, 0, 0, 1, -1], "nx": [5, 5, 15, 5, 2], "ny": [5, 15, 9, 9, 1], "nz": [0, 0, 0, 1, 2] }, { "size": 2, "px": [19, 7], "py": [21, 7], "pz": [0, 1], "nx": [14, 10], "ny": [15, 4], "nz": [0, -1] }, { "size": 2, "px": [5, 5], "py": [3, 4], "pz": [2, 2], "nx": [21, 0], "ny": [23, 5], "nz": [0, -1] }, { "size": 2, "px": [2, 0], "py": [0, 0], "pz": [1, -1], "nx": [3, 2], "ny": [1, 2], "nz": [0, 0] }, { "size": 2, "px": [9, 0], "py": [4, 0], "pz": [0, -1], "nx": [5, 12], "ny": [0, 1], "nz": [1, 0] }, { "size": 5, "px": [14, 16, 12, 15, 13], "py": [0, 1, 0, 0, 0], "pz": [0, 0, 0, 0, 0], "nx": [4, 8, 8, 4, 9], "ny": [2, 3, 4, 1, 3], "nz": [2, 1, 1, 2, -1] }, { "size": 3, "px": [4, 17, 2], "py": [11, 14, 1], "pz": [1, -1, -1], "nx": [9, 8, 17], "ny": [1, 4, 0], "nz": [1, 1, 0] }, { "size": 2, "px": [18, 9], "py": [17, 7], "pz": [0, 1], "nx": [8, 4], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [3, 0], "pz": [1, 2], "nx": [10, 11], "ny": [6, 5], "nz": [1, -1] }, { "size": 5, "px": [21, 21, 21, 21, 20], "py": [17, 16, 19, 18, 21], "pz": [0, 0, 0, 0, 0], "nx": [0, 0, 0, 0, 0], "ny": [4, 9, 11, 6, 6], "nz": [1, 0, 0, 1, -1] }, { "size": 2, "px": [12, 0], "py": [7, 1], "pz": [0, -1], "nx": [8, 11], "ny": [4, 17], "nz": [1, 0] }, { "size": 4, "px": [13, 0, 0, 0], "py": [15, 0, 0, 0], "pz": [0, -1, -1, -1], "nx": [3, 7, 4, 6], "ny": [2, 7, 5, 9], "nz": [2, 1, 2, 1] }, { "size": 2, "px": [2, 9], "py": [3, 12], "pz": [2, 0], "nx": [2, 0], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [10, 3], "py": [6, 1], "pz": [1, -1], "nx": [20, 21], "ny": [19, 14], "nz": [0, 0] }, { "size": 5, "px": [5, 22, 22, 11, 22], "py": [1, 4, 3, 3, 2], "pz": [2, 0, 0, 1, -1], "nx": [7, 13, 14, 8, 15], "ny": [3, 6, 6, 3, 7], "nz": [1, 0, 0, 1, 0] }, { "size": 2, "px": [12, 19], "py": [5, 15], "pz": [0, -1], "nx": [16, 4], "ny": [8, 2], "nz": [0, 2] }, { "size": 2, "px": [1, 0], "py": [11, 9], "pz": [1, 1], "nx": [5, 0], "ny": [3, 3], "nz": [1, -1] }, { "size": 4, "px": [8, 3, 4, 2], "py": [6, 7, 5, 3], "pz": [1, -1, -1, -1], "nx": [13, 14, 11, 11], "ny": [11, 13, 3, 5], "nz": [0, 0, 1, 1] }, { "size": 2, "px": [11, 11], "py": [5, 6], "pz": [0, 0], "nx": [8, 4], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [5, 9], "py": [6, 17], "pz": [1, 0], "nx": [9, 4], "ny": [15, 11], "nz": [0, -1] }, { "size": 3, "px": [6, 3, 6], "py": [6, 3, 5], "pz": [1, 2, 1], "nx": [11, 10, 4], "ny": [8, 11, 5], "nz": [0, 0, -1] }, { "size": 2, "px": [8, 16], "py": [0, 1], "pz": [1, -1], "nx": [19, 17], "ny": [1, 0], "nz": [0, 0] }, { "size": 2, "px": [21, 20], "py": [4, 1], "pz": [0, 0], "nx": [11, 5], "ny": [0, 0], "nz": [1, 2] }, { "size": 2, "px": [8, 4], "py": [6, 3], "pz": [1, 2], "nx": [8, 9], "ny": [4, 10], "nz": [1, -1] }, { "size": 2, "px": [10, 1], "py": [0, 0], "pz": [1, -1], "nx": [13, 12], "ny": [6, 5], "nz": [0, 0] }, { "size": 2, "px": [5, 4], "py": [3, 11], "pz": [1, -1], "nx": [3, 17], "ny": [1, 3], "nz": [2, 0] }, { "size": 2, "px": [12, 13], "py": [4, 4], "pz": [0, 0], "nx": [3, 3], "ny": [1, 1], "nz": [2, -1] }, { "size": 2, "px": [3, 18], "py": [2, 7], "pz": [2, 0], "nx": [8, 1], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [16, 6], "py": [8, 2], "pz": [0, 1], "nx": [8, 9], "ny": [4, 19], "nz": [1, -1] }, { "size": 3, "px": [12, 3, 14], "py": [13, 3, 15], "pz": [0, -1, -1], "nx": [0, 1, 0], "ny": [16, 18, 15], "nz": [0, 0, 0] }, { "size": 2, "px": [3, 1], "py": [3, 4], "pz": [2, -1], "nx": [7, 14], "ny": [10, 14], "nz": [1, 0] }, { "size": 2, "px": [9, 16], "py": [6, 10], "pz": [1, 0], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [7, 11], "py": [4, 4], "pz": [0, 0], "nx": [7, 23], "ny": [3, 11], "nz": [0, -1] }, { "size": 5, "px": [2, 4, 3, 4, 4], "py": [1, 2, 0, 1, 1], "pz": [1, 0, 1, 0, -1], "nx": [11, 9, 4, 9, 5], "ny": [6, 5, 3, 6, 3], "nz": [0, 0, 1, 0, 1] }, { "size": 2, "px": [6, 0], "py": [14, 1], "pz": [0, -1], "nx": [2, 5], "ny": [2, 9], "nz": [2, 1] }, { "size": 2, "px": [6, 7], "py": [7, 12], "pz": [0, 0], "nx": [3, 22], "ny": [3, 16], "nz": [1, -1] }, { "size": 2, "px": [10, 4], "py": [1, 1], "pz": [0, 1], "nx": [2, 6], "ny": [2, 21], "nz": [2, -1] }, { "size": 2, "px": [13, 1], "py": [11, 6], "pz": [0, -1], "nx": [12, 6], "ny": [5, 2], "nz": [0, 1] }, { "size": 5, "px": [10, 5, 11, 10, 10], "py": [4, 3, 4, 6, 5], "pz": [0, 1, 0, 0, 0], "nx": [4, 7, 13, 8, 4], "ny": [2, 8, 9, 4, 4], "nz": [2, 1, 0, 1, -1] }, { "size": 4, "px": [7, 8, 7, 8], "py": [11, 3, 4, 7], "pz": [1, 1, 1, 1], "nx": [0, 7, 3, 8], "ny": [0, 12, 2, 4], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [0, 0], "py": [4, 7], "pz": [2, 1], "nx": [10, 1], "ny": [7, 0], "nz": [0, -1] }, { "size": 2, "px": [11, 5], "py": [19, 5], "pz": [0, -1], "nx": [11, 5], "ny": [17, 10], "nz": [0, 1] }, { "size": 2, "px": [11, 12], "py": [4, 4], "pz": [0, 0], "nx": [7, 5], "ny": [8, 3], "nz": [0, -1] }, { "size": 3, "px": [4, 8, 4], "py": [2, 9, 4], "pz": [2, 1, 2], "nx": [3, 19, 3], "ny": [1, 16, 5], "nz": [1, -1, -1] }, { "size": 2, "px": [3, 7], "py": [0, 1], "pz": [1, 0], "nx": [2, 3], "ny": [15, 2], "nz": [0, -1] }, { "size": 2, "px": [0, 4], "py": [2, 0], "pz": [2, -1], "nx": [9, 16], "ny": [5, 11], "nz": [1, 0] }, { "size": 2, "px": [14, 15], "py": [23, 16], "pz": [0, 0], "nx": [13, 3], "ny": [15, 1], "nz": [0, -1] }, { "size": 2, "px": [4, 3], "py": [0, 1], "pz": [1, -1], "nx": [3, 7], "ny": [0, 0], "nz": [1, 0] }, { "size": 2, "px": [7, 6], "py": [12, 12], "pz": [0, 0], "nx": [4, 8], "ny": [5, 4], "nz": [1, -1] }, { "size": 5, "px": [4, 1, 2, 4, 5], "py": [1, 0, 0, 0, 6], "pz": [0, 2, 1, 0, 1], "nx": [4, 8, 7, 8, 6], "ny": [4, 10, 11, 4, 4], "nz": [1, 0, 0, 1, 1] }, { "size": 2, "px": [12, 12], "py": [15, 8], "pz": [0, -1], "nx": [7, 15], "ny": [16, 14], "nz": [0, 0] }, { "size": 2, "px": [4, 8], "py": [3, 6], "pz": [2, 1], "nx": [4, 6], "ny": [2, 8], "nz": [2, -1] }, { "size": 2, "px": [14, 4], "py": [19, 23], "pz": [0, -1], "nx": [7, 14], "ny": [11, 18], "nz": [1, 0] }, { "size": 2, "px": [4, 2], "py": [7, 4], "pz": [1, 2], "nx": [2, 22], "ny": [5, 19], "nz": [2, -1] }, { "size": 2, "px": [8, 15], "py": [7, 17], "pz": [1, 0], "nx": [14, 4], "ny": [15, 5], "nz": [0, 2] }, { "size": 2, "px": [10, 11], "py": [9, 8], "pz": [1, -1], "nx": [23, 5], "ny": [19, 4], "nz": [0, 2] }, { "size": 2, "px": [11, 1], "py": [7, 9], "pz": [0, -1], "nx": [4, 4], "ny": [4, 5], "nz": [1, 1] }, { "size": 2, "px": [14, 7], "py": [6, 9], "pz": [0, 0], "nx": [4, 11], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [5, 4], "py": [0, 5], "pz": [0, -1], "nx": [2, 2], "ny": [0, 4], "nz": [1, 0] }, { "size": 2, "px": [10, 22], "py": [5, 20], "pz": [0, -1], "nx": [3, 4], "ny": [1, 2], "nz": [2, 2] }, { "size": 3, "px": [23, 11, 11], "py": [17, 9, 8], "pz": [0, 1, 1], "nx": [13, 8, 8], "ny": [5, 3, 3], "nz": [0, 1, -1] }, { "size": 2, "px": [18, 9], "py": [0, 21], "pz": [0, -1], "nx": [10, 10], "ny": [2, 1], "nz": [1, 1] }, { "size": 5, "px": [11, 10, 11, 11, 11], "py": [11, 13, 10, 12, 12], "pz": [0, 0, 0, 0, -1], "nx": [11, 13, 12, 3, 8], "ny": [5, 5, 5, 1, 10], "nz": [0, 0, 0, 2, 0] }, { "size": 2, "px": [7, 8], "py": [11, 11], "pz": [0, 0], "nx": [9, 16], "ny": [9, 19], "nz": [0, -1] }, { "size": 2, "px": [9, 18], "py": [23, 7], "pz": [0, -1], "nx": [21, 21], "ny": [7, 13], "nz": [0, 0] }, { "size": 2, "px": [8, 8], "py": [7, 8], "pz": [1, 1], "nx": [5, 21], "ny": [9, 13], "nz": [1, -1] }, { "size": 2, "px": [17, 8], "py": [22, 8], "pz": [0, -1], "nx": [4, 8], "ny": [5, 10], "nz": [2, 1] }, { "size": 5, "px": [2, 5, 8, 8, 4], "py": [3, 9, 13, 23, 7], "pz": [2, 1, 0, 0, 1], "nx": [9, 17, 18, 19, 20], "ny": [0, 0, 0, 2, 3], "nz": [1, 0, 0, 0, 0] }, { "size": 3, "px": [16, 15, 2], "py": [3, 3, 13], "pz": [0, 0, -1], "nx": [4, 8, 4], "ny": [3, 6, 2], "nz": [2, 1, 2] }, { "size": 2, "px": [4, 7], "py": [3, 7], "pz": [2, 1], "nx": [15, 1], "ny": [15, 0], "nz": [0, -1] }, { "size": 2, "px": [3, 6], "py": [2, 3], "pz": [2, 1], "nx": [3, 18], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [2, 4], "py": [2, 4], "pz": [2, 1], "nx": [3, 0], "ny": [5, 0], "nz": [1, -1] }, { "size": 2, "px": [10, 0], "py": [10, 0], "pz": [0, -1], "nx": [9, 4], "ny": [2, 0], "nz": [1, 2] }, { "size": 2, "px": [2, 0], "py": [8, 3], "pz": [1, -1], "nx": [4, 8], "ny": [4, 14], "nz": [1, 0] }, { "size": 2, "px": [13, 18], "py": [14, 14], "pz": [0, -1], "nx": [1, 1], "ny": [15, 13], "nz": [0, 0] }, { "size": 3, "px": [3, 2, 2], "py": [17, 10, 15], "pz": [0, 1, 0], "nx": [13, 2, 7], "ny": [19, 11, 0], "nz": [0, -1, -1] }, { "size": 2, "px": [4, 17], "py": [0, 2], "pz": [2, 0], "nx": [8, 5], "ny": [11, 3], "nz": [1, -1] }, { "size": 2, "px": [15, 21], "py": [5, 4], "pz": [0, -1], "nx": [15, 10], "ny": [3, 0], "nz": [0, 1] }, { "size": 2, "px": [7, 3], "py": [13, 8], "pz": [0, -1], "nx": [8, 4], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [7, 22], "py": [3, 4], "pz": [1, -1], "nx": [4, 2], "ny": [2, 3], "nz": [1, 1] }, { "size": 4, "px": [6, 2, 6, 5], "py": [21, 10, 22, 20], "pz": [0, 1, 0, 0], "nx": [2, 3, 4, 4], "ny": [11, 21, 23, 23], "nz": [1, 0, 0, -1] }, { "size": 2, "px": [7, 2], "py": [6, 8], "pz": [1, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 4, "px": [11, 11, 5, 11], "py": [6, 5, 2, 4], "pz": [1, 1, 2, 1], "nx": [13, 7, 8, 3], "ny": [7, 3, 5, 2], "nz": [0, 1, -1, -1] }, { "size": 2, "px": [3, 3], "py": [7, 8], "pz": [1, 0], "nx": [3, 11], "ny": [4, 2], "nz": [1, -1] }, { "size": 3, "px": [16, 1, 5], "py": [3, 3, 11], "pz": [0, -1, -1], "nx": [16, 4, 8], "ny": [2, 0, 1], "nz": [0, 2, 1] }, { "size": 2, "px": [10, 0], "py": [8, 1], "pz": [0, -1], "nx": [19, 18], "ny": [20, 23], "nz": [0, 0] }, { "size": 2, "px": [17, 4], "py": [10, 4], "pz": [0, -1], "nx": [4, 14], "ny": [2, 9], "nz": [2, 0] }, { "size": 5, "px": [11, 12, 9, 10, 11], "py": [2, 3, 2, 2, 3], "pz": [0, 0, 0, 0, 0], "nx": [6, 4, 2, 2, 2], "ny": [18, 9, 3, 2, 2], "nz": [0, 1, 2, 2, -1] }, { "size": 2, "px": [0, 1], "py": [6, 16], "pz": [1, 0], "nx": [8, 16], "ny": [5, 16], "nz": [0, -1] }, { "size": 2, "px": [3, 3], "py": [2, 3], "pz": [2, 2], "nx": [8, 17], "ny": [4, 9], "nz": [1, -1] }, { "size": 3, "px": [2, 5, 2], "py": [5, 6, 4], "pz": [1, -1, -1], "nx": [0, 0, 0], "ny": [3, 5, 6], "nz": [2, 1, 1] }, { "size": 5, "px": [0, 0, 0, 0, 0], "py": [6, 15, 16, 13, 14], "pz": [1, 0, 0, 0, 0], "nx": [4, 5, 8, 6, 8], "ny": [4, 16, 8, 15, 4], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [3, 5], "ny": [4, 16], "nz": [1, -1] }, { "size": 5, "px": [21, 19, 21, 21, 21], "py": [17, 23, 18, 19, 20], "pz": [0, 0, 0, 0, 0], "nx": [5, 2, 3, 6, 6], "ny": [12, 5, 5, 12, 12], "nz": [0, 1, 1, 0, -1] }, { "size": 2, "px": [5, 2], "py": [11, 1], "pz": [1, -1], "nx": [5, 11], "ny": [3, 5], "nz": [2, 1] }, { "size": 2, "px": [10, 5], "py": [5, 3], "pz": [0, 1], "nx": [6, 15], "ny": [11, 5], "nz": [1, -1] }, { "size": 2, "px": [6, 2], "py": [4, 2], "pz": [1, -1], "nx": [4, 3], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [10, 6], "py": [20, 6], "pz": [0, -1], "nx": [5, 10], "ny": [11, 17], "nz": [1, 0] }, { "size": 4, "px": [8, 4, 7, 11], "py": [7, 4, 5, 8], "pz": [1, 2, 1, 0], "nx": [13, 10, 5, 21], "ny": [9, 3, 5, 4], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [7, 13], "py": [10, 7], "pz": [0, 0], "nx": [10, 8], "ny": [9, 18], "nz": [0, -1] }, { "size": 2, "px": [3, 3], "py": [1, 0], "pz": [2, 2], "nx": [8, 5], "ny": [4, 2], "nz": [1, -1] }, { "size": 5, "px": [5, 2, 5, 8, 4], "py": [8, 4, 14, 23, 7], "pz": [1, 2, 0, 0, 1], "nx": [18, 4, 16, 17, 17], "ny": [1, 0, 0, 1, 1], "nz": [0, 2, 0, 0, -1] }, { "size": 2, "px": [6, 2], "py": [2, 4], "pz": [1, -1], "nx": [8, 8], "ny": [4, 3], "nz": [1, 1] }, { "size": 2, "px": [6, 1], "py": [8, 15], "pz": [0, -1], "nx": [8, 3], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [10, 1], "py": [7, 2], "pz": [1, -1], "nx": [6, 6], "ny": [9, 4], "nz": [1, 1] }, { "size": 2, "px": [4, 1], "py": [6, 2], "pz": [1, -1], "nx": [1, 10], "ny": [16, 12], "nz": [0, 0] }, { "size": 2, "px": [8, 4], "py": [7, 2], "pz": [1, -1], "nx": [8, 9], "ny": [8, 10], "nz": [1, 1] }, { "size": 5, "px": [4, 8, 7, 6, 6], "py": [0, 0, 0, 1, 1], "pz": [1, 0, 0, 0, -1], "nx": [11, 5, 8, 4, 10], "ny": [5, 3, 4, 4, 5], "nz": [0, 1, 1, 1, 0] }, { "size": 2, "px": [5, 6], "py": [8, 5], "pz": [0, 0], "nx": [6, 6], "ny": [8, 3], "nz": [0, -1] }, { "size": 2, "px": [18, 5], "py": [19, 5], "pz": [0, -1], "nx": [4, 21], "ny": [5, 19], "nz": [2, 0] }, { "size": 2, "px": [9, 5], "py": [13, 6], "pz": [0, 1], "nx": [2, 2], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [10, 4], "py": [17, 6], "pz": [0, 1], "nx": [10, 2], "ny": [15, 4], "nz": [0, -1] }, { "size": 3, "px": [13, 13, 19], "py": [11, 12, 8], "pz": [0, 0, -1], "nx": [12, 3, 8], "ny": [4, 1, 4], "nz": [0, 2, 1] }, { "size": 3, "px": [11, 7, 4], "py": [5, 2, 1], "pz": [0, -1, -1], "nx": [9, 2, 4], "ny": [11, 3, 6], "nz": [0, 2, 1] }, { "size": 2, "px": [10, 7], "py": [15, 2], "pz": [0, -1], "nx": [4, 4], "ny": [0, 1], "nz": [2, 2] }, { "size": 5, "px": [8, 9, 16, 18, 18], "py": [0, 1, 1, 1, 1], "pz": [1, 1, 0, 0, -1], "nx": [5, 5, 6, 4, 4], "ny": [21, 20, 23, 17, 18], "nz": [0, 0, 0, 0, 0] }, { "size": 2, "px": [6, 7], "py": [1, 1], "pz": [1, 1], "nx": [20, 19], "ny": [2, 1], "nz": [0, 0] }, { "size": 2, "px": [2, 2], "py": [10, 11], "pz": [1, 1], "nx": [3, 3], "ny": [10, 10], "nz": [1, -1] }, { "size": 2, "px": [9, 5], "py": [23, 1], "pz": [0, -1], "nx": [4, 3], "ny": [10, 4], "nz": [1, 1] }, { "size": 2, "px": [1, 10], "py": [4, 7], "pz": [2, -1], "nx": [4, 3], "ny": [23, 21], "nz": [0, 0] }, { "size": 2, "px": [10, 21], "py": [11, 18], "pz": [1, 0], "nx": [10, 4], "ny": [18, 1], "nz": [0, -1] }, { "size": 2, "px": [11, 23], "py": [11, 15], "pz": [0, -1], "nx": [11, 11], "ny": [7, 9], "nz": [1, 1] }, { "size": 2, "px": [10, 1], "py": [7, 7], "pz": [1, -1], "nx": [15, 4], "ny": [14, 4], "nz": [0, 2] }, { "size": 2, "px": [1, 2], "py": [9, 20], "pz": [1, 0], "nx": [21, 3], "ny": [12, 20], "nz": [0, -1] }, { "size": 2, "px": [7, 4], "py": [0, 0], "pz": [1, 2], "nx": [4, 2], "ny": [0, 19], "nz": [0, -1] }, { "size": 2, "px": [2, 4], "py": [3, 6], "pz": [2, 1], "nx": [3, 0], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [5, 1], "py": [5, 0], "pz": [1, -1], "nx": [12, 10], "ny": [11, 4], "nz": [0, 1] }, { "size": 2, "px": [11, 12], "py": [11, 14], "pz": [1, -1], "nx": [18, 16], "ny": [21, 15], "nz": [0, 0] }, { "size": 2, "px": [3, 18], "py": [1, 5], "pz": [2, -1], "nx": [4, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [9, 10], "py": [18, 7], "pz": [0, -1], "nx": [3, 6], "ny": [0, 0], "nz": [2, 1] }, { "size": 2, "px": [19, 2], "py": [1, 4], "pz": [0, -1], "nx": [22, 22], "ny": [13, 15], "nz": [0, 0] }, { "size": 3, "px": [13, 15, 20], "py": [14, 21, 10], "pz": [0, -1, -1], "nx": [15, 7, 7], "ny": [13, 6, 8], "nz": [0, 1, 1] }, { "size": 2, "px": [9, 9], "py": [6, 7], "pz": [1, 1], "nx": [8, 7], "ny": [4, 8], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [5, 3], "pz": [1, 2], "nx": [5, 10], "ny": [2, 9], "nz": [1, -1] }, { "size": 2, "px": [14, 11], "py": [7, 16], "pz": [0, -1], "nx": [1, 0], "ny": [17, 4], "nz": [0, 2] }, { "size": 2, "px": [14, 18], "py": [17, 18], "pz": [0, -1], "nx": [8, 14], "ny": [10, 16], "nz": [1, 0] }, { "size": 2, "px": [6, 11], "py": [13, 11], "pz": [0, -1], "nx": [8, 9], "ny": [12, 9], "nz": [0, 0] }, { "size": 2, "px": [8, 9], "py": [2, 2], "pz": [0, 0], "nx": [3, 3], "ny": [2, 2], "nz": [2, -1] }, { "size": 3, "px": [21, 21, 21], "py": [14, 16, 15], "pz": [0, 0, 0], "nx": [14, 12, 0], "ny": [5, 12, 6], "nz": [0, -1, -1] }, { "size": 2, "px": [4, 21], "py": [6, 15], "pz": [1, -1], "nx": [5, 1], "ny": [6, 5], "nz": [1, 1] }, { "size": 2, "px": [6, 3], "py": [2, 1], "pz": [1, 2], "nx": [8, 0], "ny": [4, 20], "nz": [1, -1] }, { "size": 2, "px": [13, 2], "py": [9, 1], "pz": [0, -1], "nx": [3, 5], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [16, 1], "py": [5, 4], "pz": [0, -1], "nx": [17, 8], "ny": [3, 2], "nz": [0, 1] }, { "size": 2, "px": [9, 2], "py": [7, 1], "pz": [1, -1], "nx": [20, 20], "ny": [17, 16], "nz": [0, 0] }, { "size": 2, "px": [5, 7], "py": [3, 6], "pz": [2, -1], "nx": [9, 9], "ny": [6, 5], "nz": [1, 1] }, { "size": 2, "px": [11, 17], "py": [4, 1], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [15, 2], "py": [11, 0], "pz": [0, -1], "nx": [5, 14], "ny": [1, 12], "nz": [2, 0] }, { "size": 2, "px": [22, 19], "py": [3, 0], "pz": [0, -1], "nx": [9, 4], "ny": [6, 4], "nz": [1, 1] }, { "size": 2, "px": [1, 22], "py": [3, 21], "pz": [0, -1], "nx": [0, 0], "ny": [1, 0], "nz": [2, 2] }, { "size": 2, "px": [11, 11], "py": [11, 12], "pz": [0, 0], "nx": [1, 2], "ny": [1, 4], "nz": [2, -1] }, { "size": 2, "px": [18, 3], "py": [8, 1], "pz": [0, 2], "nx": [13, 1], "ny": [8, 5], "nz": [0, -1] }, { "size": 2, "px": [13, 6], "py": [21, 3], "pz": [0, -1], "nx": [11, 11], "ny": [6, 5], "nz": [1, 1] }, { "size": 2, "px": [15, 14], "py": [4, 4], "pz": [0, 0], "nx": [17, 1], "ny": [12, 5], "nz": [0, -1] }, { "size": 2, "px": [11, 3], "py": [12, 1], "pz": [0, -1], "nx": [1, 2], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [3, 2], "py": [7, 3], "pz": [0, 1], "nx": [16, 2], "ny": [3, 5], "nz": [0, -1] }, { "size": 2, "px": [10, 5], "py": [7, 20], "pz": [1, -1], "nx": [9, 8], "ny": [4, 6], "nz": [1, 1] }, { "size": 2, "px": [19, 2], "py": [10, 2], "pz": [0, -1], "nx": [9, 4], "ny": [3, 1], "nz": [1, 2] }, { "size": 2, "px": [14, 9], "py": [0, 23], "pz": [0, -1], "nx": [4, 4], "ny": [3, 2], "nz": [2, 2] }, { "size": 2, "px": [6, 9], "py": [4, 10], "pz": [1, 0], "nx": [10, 9], "ny": [9, 0], "nz": [0, -1] }, { "size": 4, "px": [6, 9, 10, 8], "py": [20, 23, 18, 23], "pz": [0, 0, 0, 0], "nx": [9, 22, 1, 2], "ny": [21, 14, 2, 5], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [17, 18], "py": [13, 6], "pz": [0, -1], "nx": [6, 7], "ny": [9, 11], "nz": [1, 1] }, { "size": 5, "px": [18, 19, 20, 19, 20], "py": [15, 19, 16, 20, 17], "pz": [0, 0, 0, 0, 0], "nx": [11, 22, 23, 23, 23], "ny": [10, 22, 20, 19, 19], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [10, 10], "py": [1, 0], "pz": [1, 1], "nx": [21, 11], "ny": [0, 4], "nz": [0, -1] }, { "size": 2, "px": [11, 0], "py": [9, 3], "pz": [0, -1], "nx": [9, 4], "ny": [2, 1], "nz": [1, 2] }, { "size": 2, "px": [14, 23], "py": [2, 18], "pz": [0, -1], "nx": [15, 18], "ny": [1, 2], "nz": [0, 0] }, { "size": 2, "px": [9, 3], "py": [0, 0], "pz": [1, -1], "nx": [3, 12], "ny": [1, 5], "nz": [2, 0] }, { "size": 2, "px": [8, 8], "py": [7, 8], "pz": [1, 1], "nx": [8, 8], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [1, 0], "py": [1, 3], "pz": [2, -1], "nx": [7, 19], "ny": [9, 15], "nz": [1, 0] }, { "size": 3, "px": [16, 6, 4], "py": [21, 5, 4], "pz": [0, -1, -1], "nx": [4, 19, 8], "ny": [5, 21, 11], "nz": [2, 0, 1] }, { "size": 2, "px": [5, 5], "py": [6, 6], "pz": [1, -1], "nx": [10, 10], "ny": [10, 12], "nz": [0, 0] }, { "size": 2, "px": [6, 11], "py": [2, 5], "pz": [1, 0], "nx": [3, 4], "ny": [4, 7], "nz": [1, -1] }, { "size": 3, "px": [8, 6, 2], "py": [4, 10, 2], "pz": [1, 1, 2], "nx": [2, 18, 5], "ny": [0, 11, 5], "nz": [0, -1, -1] }, { "size": 2, "px": [11, 7], "py": [9, 7], "pz": [0, -1], "nx": [12, 3], "ny": [9, 5], "nz": [0, 1] }, { "size": 2, "px": [14, 13], "py": [20, 20], "pz": [0, 0], "nx": [13, 3], "ny": [21, 5], "nz": [0, -1] }, { "size": 2, "px": [13, 7], "py": [5, 3], "pz": [0, -1], "nx": [3, 4], "ny": [1, 4], "nz": [2, 1] }, { "size": 2, "px": [6, 2], "py": [21, 5], "pz": [0, -1], "nx": [2, 3], "ny": [5, 10], "nz": [2, 1] }, { "size": 2, "px": [23, 5], "py": [6, 0], "pz": [0, 2], "nx": [21, 4], "ny": [6, 1], "nz": [0, -1] }, { "size": 2, "px": [9, 9], "py": [7, 6], "pz": [1, 1], "nx": [8, 2], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [22, 11], "py": [20, 9], "pz": [0, 1], "nx": [8, 8], "ny": [10, 10], "nz": [1, -1] }, { "size": 2, "px": [8, 16], "py": [21, 12], "pz": [0, -1], "nx": [2, 7], "ny": [5, 23], "nz": [2, 0] }, { "size": 5, "px": [0, 1, 1, 1, 1], "py": [3, 1, 9, 4, 7], "pz": [2, 2, 1, 1, 1], "nx": [11, 22, 22, 23, 23], "ny": [10, 21, 22, 19, 20], "nz": [1, 0, 0, 0, -1] }, { "size": 2, "px": [17, 5], "py": [12, 4], "pz": [0, -1], "nx": [8, 8], "ny": [4, 5], "nz": [1, 1] }, { "size": 2, "px": [16, 4], "py": [7, 10], "pz": [0, -1], "nx": [9, 15], "ny": [4, 6], "nz": [1, 0] }, { "size": 2, "px": [3, 6], "py": [3, 5], "pz": [2, 1], "nx": [11, 12], "ny": [11, 23], "nz": [0, -1] }, { "size": 2, "px": [5, 2], "py": [14, 7], "pz": [0, 1], "nx": [4, 17], "ny": [18, 16], "nz": [0, -1] }, { "size": 3, "px": [10, 1, 1], "py": [12, 5, 4], "pz": [0, -1, -1], "nx": [7, 11, 5], "ny": [1, 2, 1], "nz": [1, 0, 1] }, { "size": 2, "px": [7, 6], "py": [3, 9], "pz": [0, -1], "nx": [2, 2], "ny": [2, 3], "nz": [2, 2] }, { "size": 2, "px": [13, 6], "py": [22, 9], "pz": [0, -1], "nx": [8, 4], "ny": [4, 3], "nz": [1, 2] }, { "size": 5, "px": [12, 9, 10, 11, 11], "py": [0, 0, 0, 0, 0], "pz": [0, 0, 0, 0, -1], "nx": [16, 5, 10, 4, 8], "ny": [10, 3, 6, 4, 4], "nz": [0, 1, 0, 1, 1] }, { "size": 2, "px": [18, 19], "py": [23, 20], "pz": [0, 0], "nx": [8, 5], "ny": [11, 3], "nz": [1, -1] }, { "size": 2, "px": [8, 3], "py": [7, 2], "pz": [1, 2], "nx": [8, 4], "ny": [4, 3], "nz": [1, -1] }, { "size": 5, "px": [8, 14, 8, 7, 4], "py": [6, 12, 8, 6, 3], "pz": [1, 0, 1, 1, 2], "nx": [2, 6, 6, 7, 7], "ny": [0, 1, 2, 0, 0], "nz": [2, 0, 0, 0, -1] }, { "size": 3, "px": [1, 2, 3], "py": [15, 18, 21], "pz": [0, 0, 0], "nx": [19, 5, 18], "ny": [23, 5, 8], "nz": [0, -1, -1] }, { "size": 2, "px": [6, 2], "py": [6, 1], "pz": [1, -1], "nx": [0, 0], "ny": [12, 4], "nz": [0, 1] }, { "size": 2, "px": [3, 5], "py": [5, 11], "pz": [2, 1], "nx": [14, 5], "ny": [19, 5], "nz": [0, -1] }, { "size": 2, "px": [10, 4], "py": [4, 4], "pz": [1, -1], "nx": [11, 5], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [18, 4], "py": [6, 4], "pz": [0, -1], "nx": [4, 8], "ny": [5, 4], "nz": [1, 1] }, { "size": 2, "px": [6, 12], "py": [2, 4], "pz": [1, 0], "nx": [8, 8], "ny": [3, 4], "nz": [1, -1] }, { "size": 2, "px": [1, 0], "py": [1, 1], "pz": [1, 2], "nx": [7, 2], "ny": [4, 7], "nz": [0, -1] }, { "size": 2, "px": [8, 0], "py": [20, 0], "pz": [0, -1], "nx": [4, 5], "ny": [10, 11], "nz": [1, 1] }, { "size": 2, "px": [6, 14], "py": [5, 2], "pz": [1, -1], "nx": [0, 0], "ny": [0, 2], "nz": [1, 0] }, { "size": 2, "px": [5, 15], "py": [4, 7], "pz": [1, -1], "nx": [4, 7], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [7, 5], "py": [2, 1], "pz": [0, 1], "nx": [3, 1], "ny": [4, 1], "nz": [1, -1] }, { "size": 2, "px": [8, 9], "py": [4, 2], "pz": [0, -1], "nx": [11, 9], "ny": [1, 3], "nz": [0, 0] }, { "size": 2, "px": [6, 3], "py": [2, 4], "pz": [1, -1], "nx": [4, 8], "ny": [4, 4], "nz": [1, 1] }, { "size": 2, "px": [3, 7], "py": [3, 7], "pz": [2, 1], "nx": [6, 8], "ny": [14, 4], "nz": [0, -1] }, { "size": 2, "px": [3, 0], "py": [21, 3], "pz": [0, 2], "nx": [20, 8], "ny": [10, 4], "nz": [0, -1] }, { "size": 2, "px": [6, 3], "py": [5, 8], "pz": [0, -1], "nx": [4, 3], "ny": [4, 2], "nz": [0, 1] }, { "size": 2, "px": [3, 6], "py": [7, 13], "pz": [1, 0], "nx": [3, 2], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [16, 10], "py": [9, 7], "pz": [0, 1], "nx": [7, 9], "ny": [3, 10], "nz": [1, -1] }, { "size": 2, "px": [13, 10], "py": [6, 7], "pz": [0, -1], "nx": [8, 17], "ny": [4, 12], "nz": [1, 0] }, { "size": 2, "px": [5, 10], "py": [4, 10], "pz": [2, 1], "nx": [5, 4], "ny": [9, 2], "nz": [1, -1] }, { "size": 4, "px": [15, 3, 5, 0], "py": [12, 4, 2, 3], "pz": [0, -1, -1, -1], "nx": [13, 7, 5, 7], "ny": [12, 6, 0, 7], "nz": [0, 1, 2, 1] }, { "size": 4, "px": [2, 3, 16, 17], "py": [3, 4, 6, 6], "pz": [2, 1, 0, 0], "nx": [16, 16, 8, 16], "ny": [8, 3, 10, 13], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [16, 8], "py": [1, 4], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [9, 14], "py": [6, 2], "pz": [1, -1], "nx": [8, 8], "ny": [6, 4], "nz": [1, 1] }, { "size": 2, "px": [8, 4], "py": [10, 4], "pz": [1, 2], "nx": [10, 0], "ny": [5, 7], "nz": [1, -1] }, { "size": 2, "px": [9, 10], "py": [4, 4], "pz": [0, 0], "nx": [9, 7], "ny": [3, 5], "nz": [0, -1] }, { "size": 5, "px": [11, 10, 13, 6, 12], "py": [2, 2, 2, 1, 2], "pz": [0, 0, 0, 1, 0], "nx": [4, 18, 18, 13, 13], "ny": [2, 18, 19, 7, 7], "nz": [2, 0, 0, 0, -1] }, { "size": 4, "px": [13, 13, 13, 2], "py": [13, 12, 11, 3], "pz": [0, 0, 0, -1], "nx": [4, 6, 8, 11], "ny": [2, 2, 4, 4], "nz": [2, 1, 1, 0] }, { "size": 2, "px": [4, 7], "py": [6, 13], "pz": [1, 0], "nx": [8, 10], "ny": [4, 22], "nz": [1, -1] }, { "size": 2, "px": [0, 7], "py": [4, 17], "pz": [1, -1], "nx": [0, 1], "ny": [5, 21], "nz": [2, 0] }, { "size": 2, "px": [12, 13], "py": [22, 22], "pz": [0, 0], "nx": [2, 2], "ny": [13, 13], "nz": [0, -1] }, { "size": 3, "px": [4, 4, 3], "py": [22, 23, 19], "pz": [0, 0, 0], "nx": [8, 12, 3], "ny": [22, 15, 2], "nz": [0, -1, -1] }, { "size": 2, "px": [10, 12], "py": [3, 13], "pz": [0, -1], "nx": [15, 2], "ny": [10, 2], "nz": [0, 2] }, { "size": 2, "px": [1, 1], "py": [3, 3], "pz": [2, -1], "nx": [8, 4], "ny": [0, 0], "nz": [1, 2] }, { "size": 2, "px": [6, 12], "py": [6, 18], "pz": [1, 0], "nx": [12, 19], "ny": [17, 16], "nz": [0, -1] }, { "size": 2, "px": [10, 5], "py": [2, 1], "pz": [0, 1], "nx": [5, 4], "ny": [4, 17], "nz": [0, -1] }, { "size": 3, "px": [3, 12, 11], "py": [5, 23, 23], "pz": [2, 0, 0], "nx": [12, 4, 4], "ny": [21, 17, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [12, 0], "py": [21, 5], "pz": [0, -1], "nx": [0, 0], "ny": [7, 9], "nz": [1, 1] }, { "size": 2, "px": [17, 17], "py": [12, 11], "pz": [0, 0], "nx": [8, 11], "ny": [4, 11], "nz": [1, -1] }, { "size": 2, "px": [11, 0], "py": [22, 1], "pz": [0, -1], "nx": [4, 6], "ny": [1, 0], "nz": [1, 1] }, { "size": 2, "px": [11, 11], "py": [9, 5], "pz": [1, 1], "nx": [23, 11], "ny": [23, 20], "nz": [0, -1] }, { "size": 5, "px": [4, 12, 11, 9, 8], "py": [0, 1, 1, 0, 1], "pz": [1, 0, 0, 0, 0], "nx": [4, 17, 8, 7, 7], "ny": [2, 13, 4, 4, 4], "nz": [2, 0, 1, 1, -1] }, { "size": 2, "px": [11, 13], "py": [12, 12], "pz": [0, -1], "nx": [1, 1], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [23, 4], "py": [23, 2], "pz": [0, -1], "nx": [5, 2], "ny": [23, 6], "nz": [0, 1] }, { "size": 3, "px": [8, 16, 0], "py": [5, 15, 6], "pz": [1, -1, -1], "nx": [23, 23, 11], "ny": [18, 17, 8], "nz": [0, 0, 1] }, { "size": 2, "px": [1, 16], "py": [4, 15], "pz": [2, -1], "nx": [2, 2], "ny": [3, 2], "nz": [2, 2] }, { "size": 2, "px": [3, 8], "py": [7, 9], "pz": [1, -1], "nx": [4, 2], "ny": [10, 5], "nz": [1, 2] }, { "size": 3, "px": [22, 1, 9], "py": [23, 2, 3], "pz": [0, -1, -1], "nx": [2, 2, 5], "ny": [5, 4, 19], "nz": [2, 2, 0] }, { "size": 2, "px": [2, 20], "py": [5, 15], "pz": [1, -1], "nx": [2, 1], "ny": [1, 2], "nz": [2, 2] }, { "size": 2, "px": [4, 8], "py": [1, 19], "pz": [1, -1], "nx": [2, 2], "ny": [5, 4], "nz": [2, 2] }, { "size": 2, "px": [9, 10], "py": [21, 0], "pz": [0, -1], "nx": [6, 5], "ny": [1, 1], "nz": [1, 1] }, { "size": 2, "px": [4, 8], "py": [3, 6], "pz": [2, 1], "nx": [9, 2], "ny": [4, 1], "nz": [1, -1] }, { "size": 3, "px": [17, 3, 10], "py": [8, 0, 2], "pz": [0, 2, 0], "nx": [13, 2, 6], "ny": [15, 5, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [9, 6], "py": [20, 21], "pz": [0, -1], "nx": [4, 2], "ny": [10, 5], "nz": [1, 2] }, { "size": 2, "px": [3, 7], "py": [0, 1], "pz": [2, 1], "nx": [7, 20], "ny": [1, 19], "nz": [0, -1] }, { "size": 2, "px": [4, 5], "py": [0, 1], "pz": [1, 0], "nx": [3, 2], "ny": [4, 2], "nz": [0, -1] }, { "size": 2, "px": [2, 7], "py": [4, 19], "pz": [2, 0], "nx": [5, 2], "ny": [10, 2], "nz": [1, -1] }, { "size": 5, "px": [3, 3, 4, 7, 7], "py": [1, 0, 0, 0, 1], "pz": [1, 1, 1, 0, 0], "nx": [5, 4, 10, 8, 8], "ny": [3, 3, 5, 4, 4], "nz": [1, 1, 0, 1, -1] }, { "size": 2, "px": [1, 5], "py": [0, 3], "pz": [1, -1], "nx": [1, 0], "ny": [0, 1], "nz": [0, 1] }, { "size": 2, "px": [10, 0], "py": [5, 5], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [0, 9], "py": [0, 4], "pz": [2, -1], "nx": [13, 10], "ny": [0, 0], "nz": [0, 0] }, { "size": 2, "px": [13, 4], "py": [14, 5], "pz": [0, -1], "nx": [4, 2], "ny": [0, 0], "nz": [0, 1] }, { "size": 2, "px": [17, 4], "py": [13, 3], "pz": [0, -1], "nx": [4, 2], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [1, 0], "py": [6, 2], "pz": [1, -1], "nx": [1, 6], "ny": [2, 12], "nz": [2, 0] }, { "size": 2, "px": [12, 4], "py": [6, 0], "pz": [0, -1], "nx": [3, 3], "ny": [8, 9], "nz": [1, 1] }, { "size": 2, "px": [1, 5], "py": [1, 5], "pz": [1, -1], "nx": [17, 17], "ny": [13, 7], "nz": [0, 0] }, { "size": 2, "px": [7, 3], "py": [12, 6], "pz": [0, 1], "nx": [3, 4], "ny": [4, 11], "nz": [1, -1] }, { "size": 2, "px": [6, 17], "py": [2, 8], "pz": [1, 0], "nx": [3, 3], "ny": [1, 2], "nz": [1, -1] }, { "size": 3, "px": [13, 6, 6], "py": [22, 11, 10], "pz": [0, 1, 1], "nx": [13, 12, 11], "ny": [20, 20, 20], "nz": [0, 0, 0] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [3, 12], "ny": [4, 20], "nz": [1, -1] }, { "size": 2, "px": [5, 2], "py": [1, 1], "pz": [1, -1], "nx": [13, 6], "ny": [0, 0], "nz": [0, 1] }, { "size": 2, "px": [2, 8], "py": [3, 9], "pz": [2, 0], "nx": [8, 16], "ny": [5, 17], "nz": [0, -1] }, { "size": 2, "px": [16, 15], "py": [1, 1], "pz": [0, 0], "nx": [7, 11], "ny": [8, 0], "nz": [1, -1] }, { "size": 2, "px": [11, 18], "py": [21, 23], "pz": [0, -1], "nx": [1, 1], "ny": [4, 3], "nz": [1, 2] }, { "size": 2, "px": [1, 5], "py": [0, 2], "pz": [1, -1], "nx": [15, 11], "ny": [8, 7], "nz": [0, 0] }, { "size": 2, "px": [5, 4], "py": [7, 8], "pz": [1, -1], "nx": [9, 10], "ny": [13, 11], "nz": [0, 0] }, { "size": 2, "px": [7, 4], "py": [10, 4], "pz": [1, 2], "nx": [22, 4], "ny": [0, 2], "nz": [0, -1] }, { "size": 2, "px": [11, 3], "py": [3, 1], "pz": [0, 2], "nx": [8, 0], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [5, 21], "py": [11, 22], "pz": [0, -1], "nx": [10, 11], "ny": [11, 9], "nz": [0, 0] }, { "size": 2, "px": [5, 5], "py": [0, 1], "pz": [2, 2], "nx": [2, 21], "ny": [6, 14], "nz": [0, -1] }, { "size": 3, "px": [10, 10, 1], "py": [11, 0, 5], "pz": [0, -1, -1], "nx": [6, 12, 5], "ny": [2, 5, 2], "nz": [1, 0, 1] }, { "size": 2, "px": [9, 10], "py": [5, 6], "pz": [0, 0], "nx": [12, 19], "ny": [23, 5], "nz": [0, -1] }, { "size": 2, "px": [11, 5], "py": [9, 6], "pz": [0, 1], "nx": [21, 0], "ny": [23, 0], "nz": [0, -1] }, { "size": 2, "px": [13, 12], "py": [19, 15], "pz": [0, 0], "nx": [13, 0], "ny": [17, 0], "nz": [0, -1] }, { "size": 2, "px": [14, 0], "py": [17, 3], "pz": [0, -1], "nx": [7, 16], "ny": [8, 19], "nz": [1, 0] }, { "size": 2, "px": [3, 6], "py": [2, 4], "pz": [2, 1], "nx": [8, 1], "ny": [4, 4], "nz": [1, -1] }, { "size": 2, "px": [13, 10], "py": [23, 20], "pz": [0, -1], "nx": [4, 7], "ny": [5, 10], "nz": [2, 1] }, { "size": 2, "px": [16, 9], "py": [22, 5], "pz": [0, -1], "nx": [4, 2], "ny": [10, 3], "nz": [1, 2] }, { "size": 4, "px": [3, 1, 1, 5], "py": [4, 2, 1, 2], "pz": [0, 2, 2, 1], "nx": [13, 5, 8, 0], "ny": [22, 2, 9, 2], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [9, 9], "py": [0, 0], "pz": [1, -1], "nx": [19, 20], "ny": [1, 2], "nz": [0, 0] }, { "size": 2, "px": [7, 22], "py": [6, 8], "pz": [1, 0], "nx": [4, 4], "ny": [2, 4], "nz": [2, -1] }, { "size": 2, "px": [3, 6], "py": [4, 4], "pz": [2, 1], "nx": [10, 20], "ny": [10, 6], "nz": [0, -1] }, { "size": 2, "px": [6, 12], "py": [6, 15], "pz": [1, -1], "nx": [0, 0], "ny": [2, 5], "nz": [2, 1] }, { "size": 2, "px": [2, 7], "py": [4, 10], "pz": [2, -1], "nx": [3, 6], "ny": [4, 8], "nz": [2, 1] }, { "size": 3, "px": [11, 11, 4], "py": [0, 5, 7], "pz": [1, -1, -1], "nx": [6, 12, 12], "ny": [1, 1, 2], "nz": [1, 0, 0] }, { "size": 2, "px": [11, 17], "py": [4, 18], "pz": [0, -1], "nx": [8, 2], "ny": [10, 2], "nz": [0, 2] }, { "size": 2, "px": [17, 17], "py": [10, 18], "pz": [0, -1], "nx": [8, 8], "ny": [2, 3], "nz": [1, 1] }, { "size": 2, "px": [9, 9], "py": [7, 7], "pz": [1, -1], "nx": [7, 4], "ny": [6, 3], "nz": [1, 2] }, { "size": 2, "px": [18, 21], "py": [0, 0], "pz": [0, -1], "nx": [11, 6], "ny": [5, 3], "nz": [0, 1] }, { "size": 2, "px": [5, 2], "py": [8, 4], "pz": [0, 2], "nx": [5, 8], "ny": [9, 16], "nz": [0, -1] }, { "size": 2, "px": [12, 2], "py": [5, 4], "pz": [0, -1], "nx": [4, 15], "ny": [4, 8], "nz": [1, 0] }, { "size": 2, "px": [1, 1], "py": [4, 6], "pz": [1, 1], "nx": [11, 3], "ny": [7, 9], "nz": [0, -1] }, { "size": 2, "px": [2, 1], "py": [3, 3], "pz": [2, 2], "nx": [2, 2], "ny": [15, 16], "nz": [0, 0] }, { "size": 2, "px": [17, 18], "py": [5, 5], "pz": [0, 0], "nx": [9, 21], "ny": [2, 10], "nz": [1, -1] }, { "size": 2, "px": [6, 3], "py": [14, 7], "pz": [0, 1], "nx": [3, 4], "ny": [4, 5], "nz": [1, -1] }, { "size": 2, "px": [0, 3], "py": [3, 1], "pz": [1, -1], "nx": [19, 10], "ny": [12, 4], "nz": [0, 1] }, { "size": 2, "px": [6, 16], "py": [3, 8], "pz": [1, 0], "nx": [8, 10], "ny": [20, 4], "nz": [0, -1] }, { "size": 3, "px": [5, 5, 2], "py": [21, 8, 4], "pz": [0, 1, 2], "nx": [10, 6, 3], "ny": [15, 2, 1], "nz": [0, -1, -1] }, { "size": 2, "px": [11, 10], "py": [10, 12], "pz": [0, 0], "nx": [11, 11], "ny": [2, 1], "nz": [1, -1] }, { "size": 2, "px": [10, 10], "py": [3, 2], "pz": [1, 1], "nx": [8, 11], "ny": [3, 5], "nz": [1, -1] }, { "size": 2, "px": [13, 3], "py": [5, 8], "pz": [0, -1], "nx": [12, 3], "ny": [3, 1], "nz": [0, 2] }, { "size": 2, "px": [13, 7], "py": [2, 1], "pz": [0, 1], "nx": [5, 5], "ny": [1, 1], "nz": [0, -1] }, { "size": 2, "px": [11, 10], "py": [10, 8], "pz": [0, -1], "nx": [14, 16], "ny": [10, 15], "nz": [0, 0] }, { "size": 2, "px": [2, 10], "py": [7, 8], "pz": [1, -1], "nx": [2, 6], "ny": [5, 6], "nz": [2, 1] }, { "size": 2, "px": [10, 10], "py": [1, 8], "pz": [0, -1], "nx": [2, 2], "ny": [3, 2], "nz": [2, 2] }, { "size": 2, "px": [4, 0], "py": [5, 2], "pz": [1, -1], "nx": [1, 2], "ny": [2, 3], "nz": [2, 1] }, { "size": 2, "px": [1, 12], "py": [1, 9], "pz": [2, -1], "nx": [16, 17], "ny": [3, 3], "nz": [0, 0] }, { "size": 2, "px": [12, 6], "py": [5, 8], "pz": [0, -1], "nx": [3, 4], "ny": [7, 4], "nz": [1, 1] }, { "size": 2, "px": [14, 3], "py": [11, 5], "pz": [0, -1], "nx": [11, 4], "ny": [0, 0], "nz": [0, 1] }, { "size": 2, "px": [6, 10], "py": [6, 6], "pz": [1, -1], "nx": [0, 0], "ny": [1, 0], "nz": [2, 2] }, { "size": 2, "px": [3, 7], "py": [0, 7], "pz": [1, -1], "nx": [15, 13], "ny": [8, 4], "nz": [0, 0] }, { "size": 2, "px": [18, 1], "py": [15, 0], "pz": [0, -1], "nx": [18, 18], "ny": [18, 17], "nz": [0, 0] }, { "size": 2, "px": [5, 2], "py": [4, 4], "pz": [0, -1], "nx": [4, 18], "ny": [4, 15], "nz": [1, 0] }, { "size": 3, "px": [3, 14, 13], "py": [2, 7, 8], "pz": [2, 0, 0], "nx": [10, 0, 2], "ny": [8, 3, 2], "nz": [0, -1, -1] }, { "size": 2, "px": [16, 0], "py": [14, 3], "pz": [0, -1], "nx": [18, 3], "ny": [12, 5], "nz": [0, 2] }, { "size": 2, "px": [5, 3], "py": [8, 3], "pz": [1, 2], "nx": [13, 4], "ny": [10, 4], "nz": [0, -1] }, { "size": 2, "px": [3, 6], "py": [1, 2], "pz": [2, 1], "nx": [8, 1], "ny": [4, 20], "nz": [1, -1] }, { "size": 2, "px": [10, 10], "py": [8, 3], "pz": [1, -1], "nx": [12, 7], "ny": [2, 1], "nz": [0, 1] }, { "size": 2, "px": [17, 3], "py": [9, 2], "pz": [0, 2], "nx": [7, 6], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [12, 1], "py": [2, 1], "pz": [0, -1], "nx": [4, 4], "ny": [2, 3], "nz": [2, 2] }, { "size": 2, "px": [22, 5], "py": [15, 3], "pz": [0, 2], "nx": [16, 17], "ny": [14, 2], "nz": [0, -1] }, { "size": 2, "px": [8, 11], "py": [19, 13], "pz": [0, -1], "nx": [0, 0], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [8, 11], "py": [8, 1], "pz": [1, -1], "nx": [3, 3], "ny": [2, 5], "nz": [1, 2] }, { "size": 3, "px": [3, 8, 0], "py": [7, 7, 5], "pz": [1, -1, -1], "nx": [11, 5, 1], "ny": [11, 7, 5], "nz": [0, 1, 1] }, { "size": 2, "px": [12, 6], "py": [12, 6], "pz": [0, 1], "nx": [9, 0], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [16, 12], "py": [7, 1], "pz": [0, -1], "nx": [16, 7], "ny": [6, 4], "nz": [0, 1] }, { "size": 2, "px": [13, 5], "py": [14, 0], "pz": [0, -1], "nx": [13, 10], "ny": [0, 0], "nz": [0, 0] }, { "size": 5, "px": [11, 12, 13, 12, 7], "py": [0, 1, 0, 0, 0], "pz": [0, 0, 0, 0, 1], "nx": [13, 16, 14, 4, 4], "ny": [18, 23, 18, 5, 5], "nz": [0, 0, 0, 2, -1] }, { "size": 2, "px": [14, 5], "py": [12, 4], "pz": [0, -1], "nx": [7, 7], "ny": [8, 2], "nz": [1, 1] }, { "size": 2, "px": [19, 3], "py": [2, 5], "pz": [0, -1], "nx": [11, 23], "ny": [7, 13], "nz": [1, 0] }, { "size": 2, "px": [0, 0], "py": [19, 20], "pz": [0, 0], "nx": [9, 4], "ny": [5, 2], "nz": [0, -1] }, { "size": 2, "px": [15, 4], "py": [12, 3], "pz": [0, 2], "nx": [9, 5], "ny": [4, 5], "nz": [1, -1] }, { "size": 4, "px": [8, 0, 1, 21], "py": [6, 0, 7, 16], "pz": [1, -1, -1, -1], "nx": [11, 6, 11, 5], "ny": [8, 6, 4, 3], "nz": [1, 1, 1, 2] }, { "size": 2, "px": [11, 11], "py": [7, 5], "pz": [0, -1], "nx": [9, 10], "ny": [6, 7], "nz": [0, 0] }, { "size": 2, "px": [2, 4], "py": [1, 2], "pz": [2, 1], "nx": [16, 6], "ny": [0, 1], "nz": [0, -1] }, { "size": 2, "px": [0, 0], "py": [5, 3], "pz": [1, 2], "nx": [1, 21], "ny": [23, 8], "nz": [0, -1] }, { "size": 2, "px": [10, 0], "py": [7, 0], "pz": [0, -1], "nx": [4, 13], "ny": [4, 10], "nz": [1, 0] }, { "size": 2, "px": [11, 4], "py": [0, 4], "pz": [1, -1], "nx": [4, 2], "ny": [16, 8], "nz": [0, 1] }, { "size": 2, "px": [5, 3], "py": [12, 6], "pz": [0, 1], "nx": [3, 3], "ny": [4, 2], "nz": [1, -1] }, { "size": 2, "px": [10, 0], "py": [19, 11], "pz": [0, -1], "nx": [9, 5], "ny": [21, 9], "nz": [0, 1] }, { "size": 2, "px": [0, 0], "py": [17, 9], "pz": [0, 1], "nx": [0, 5], "ny": [0, 9], "nz": [2, -1] }, { "size": 2, "px": [4, 5], "py": [2, 4], "pz": [0, -1], "nx": [4, 4], "ny": [5, 6], "nz": [1, 1] }, { "size": 2, "px": [8, 4], "py": [1, 0], "pz": [1, 2], "nx": [4, 3], "ny": [3, 6], "nz": [0, -1] }, { "size": 2, "px": [11, 0], "py": [7, 2], "pz": [1, -1], "nx": [5, 5], "ny": [1, 0], "nz": [2, 2] }, { "size": 2, "px": [13, 0], "py": [17, 2], "pz": [0, -1], "nx": [3, 6], "ny": [5, 8], "nz": [2, 1] }, { "size": 2, "px": [2, 1], "py": [0, 5], "pz": [2, -1], "nx": [4, 9], "ny": [2, 7], "nz": [2, 1] }, { "size": 2, "px": [12, 5], "py": [13, 8], "pz": [0, -1], "nx": [23, 11], "ny": [13, 7], "nz": [0, 1] }, { "size": 2, "px": [0, 0], "py": [0, 2], "pz": [1, 0], "nx": [3, 6], "ny": [11, 18], "nz": [0, -1] }, { "size": 2, "px": [4, 3], "py": [6, 5], "pz": [0, -1], "nx": [1, 1], "ny": [1, 3], "nz": [2, 1] }, { "size": 4, "px": [3, 6, 3, 6], "py": [3, 6, 2, 5], "pz": [2, 1, 2, 1], "nx": [0, 4, 1, 1], "ny": [0, 22, 17, 0], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [8, 4], "py": [6, 3], "pz": [1, 2], "nx": [9, 15], "ny": [4, 8], "nz": [1, -1] }, { "size": 2, "px": [8, 18], "py": [7, 8], "pz": [1, 0], "nx": [8, 5], "ny": [4, 0], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [4, 5], "pz": [1, -1], "nx": [5, 6], "ny": [0, 0], "nz": [1, 1] }, { "size": 2, "px": [13, 18], "py": [23, 19], "pz": [0, 0], "nx": [7, 13], "ny": [10, 20], "nz": [1, -1] }, { "size": 2, "px": [10, 6], "py": [2, 0], "pz": [0, 1], "nx": [4, 1], "ny": [5, 1], "nz": [1, -1] }, { "size": 2, "px": [1, 1], "py": [5, 4], "pz": [2, 2], "nx": [0, 20], "ny": [4, 4], "nz": [2, -1] }, { "size": 2, "px": [5, 5], "py": [1, 0], "pz": [2, 2], "nx": [12, 6], "ny": [18, 11], "nz": [0, -1] }, { "size": 5, "px": [2, 1, 3, 1, 5], "py": [3, 3, 7, 4, 9], "pz": [2, 2, 1, 2, 1], "nx": [9, 3, 8, 16, 10], "ny": [5, 3, 10, 6, 7], "nz": [1, -1, -1, -1, -1] }, { "size": 2, "px": [4, 1], "py": [12, 3], "pz": [0, -1], "nx": [10, 1], "ny": [11, 2], "nz": [0, 2] }, { "size": 2, "px": [19, 0], "py": [10, 7], "pz": [0, -1], "nx": [14, 7], "ny": [6, 3], "nz": [0, 1] }, { "size": 2, "px": [7, 4], "py": [2, 1], "pz": [1, 2], "nx": [6, 0], "ny": [2, 18], "nz": [0, -1] }, { "size": 2, "px": [14, 8], "py": [3, 0], "pz": [0, 1], "nx": [17, 1], "ny": [1, 4], "nz": [0, -1] }, { "size": 2, "px": [18, 19], "py": [1, 17], "pz": [0, -1], "nx": [5, 11], "ny": [2, 5], "nz": [2, 1] }, { "size": 5, "px": [12, 12, 12, 6, 12], "py": [10, 11, 12, 6, 9], "pz": [0, 0, 0, 1, 0], "nx": [13, 3, 12, 6, 6], "ny": [4, 1, 4, 2, 2], "nz": [0, 2, 0, 1, -1] }, { "size": 2, "px": [11, 10], "py": [3, 3], "pz": [0, 0], "nx": [4, 9], "ny": [4, 17], "nz": [1, -1] }, { "size": 2, "px": [11, 0], "py": [13, 5], "pz": [0, 2], "nx": [8, 18], "ny": [15, 15], "nz": [0, -1] }, { "size": 2, "px": [3, 4], "py": [6, 5], "pz": [1, 1], "nx": [0, 0], "ny": [9, 4], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [1, 0], "pz": [2, 2], "nx": [2, 15], "ny": [2, 1], "nz": [2, -1] }, { "size": 3, "px": [2, 4, 2], "py": [4, 9, 5], "pz": [2, 1, 2], "nx": [2, 5, 14], "ny": [0, 1, 4], "nz": [0, -1, -1] }, { "size": 2, "px": [11, 12], "py": [20, 20], "pz": [0, 0], "nx": [6, 10], "ny": [9, 19], "nz": [1, -1] }, { "size": 2, "px": [7, 0], "py": [16, 8], "pz": [0, -1], "nx": [2, 3], "ny": [2, 4], "nz": [2, 1] }, { "size": 5, "px": [16, 17, 15, 16, 15], "py": [1, 1, 1, 0, 0], "pz": [0, 0, 0, 0, 0], "nx": [8, 8, 4, 12, 12], "ny": [8, 7, 2, 23, 23], "nz": [1, 1, 2, 0, -1] }, { "size": 2, "px": [2, 4], "py": [6, 12], "pz": [1, -1], "nx": [8, 13], "ny": [1, 1], "nz": [1, 0] }, { "size": 2, "px": [9, 2], "py": [3, 2], "pz": [0, -1], "nx": [3, 4], "ny": [6, 5], "nz": [1, 1] }, { "size": 2, "px": [10, 8], "py": [6, 1], "pz": [1, -1], "nx": [11, 8], "ny": [2, 2], "nz": [0, 0] }, { "size": 2, "px": [9, 3], "py": [7, 0], "pz": [1, -1], "nx": [19, 19], "ny": [18, 16], "nz": [0, 0] }, { "size": 2, "px": [3, 2], "py": [1, 1], "pz": [2, 2], "nx": [22, 11], "ny": [4, 0], "nz": [0, -1] }, { "size": 2, "px": [10, 10], "py": [9, 8], "pz": [1, 1], "nx": [4, 4], "ny": [10, 2], "nz": [1, -1] }, { "size": 2, "px": [0, 1], "py": [0, 5], "pz": [0, -1], "nx": [10, 8], "ny": [2, 2], "nz": [0, 0] }, { "size": 2, "px": [3, 3], "py": [8, 7], "pz": [1, 1], "nx": [8, 2], "ny": [8, 3], "nz": [0, -1] }, { "size": 2, "px": [13, 5], "py": [21, 3], "pz": [0, -1], "nx": [13, 3], "ny": [20, 5], "nz": [0, 2] }, { "size": 2, "px": [12, 5], "py": [11, 2], "pz": [0, -1], "nx": [1, 0], "ny": [19, 9], "nz": [0, 1] }, { "size": 2, "px": [7, 10], "py": [9, 10], "pz": [1, 1], "nx": [8, 4], "ny": [10, 2], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [5, 9], "pz": [2, 1], "nx": [2, 11], "ny": [9, 19], "nz": [1, -1] }, { "size": 2, "px": [3, 5], "py": [1, 2], "pz": [2, 1], "nx": [8, 23], "ny": [4, 9], "nz": [1, -1] }, { "size": 2, "px": [3, 4], "py": [2, 4], "pz": [2, 1], "nx": [5, 9], "ny": [2, 5], "nz": [2, -1] }, { "size": 2, "px": [11, 11], "py": [2, 3], "pz": [1, 1], "nx": [19, 9], "ny": [6, 5], "nz": [0, -1] }, { "size": 2, "px": [9, 4], "py": [5, 10], "pz": [1, -1], "nx": [10, 22], "ny": [0, 16], "nz": [1, 0] }, { "size": 3, "px": [19, 9, 19], "py": [3, 1, 2], "pz": [0, 1, 0], "nx": [6, 3, 6], "ny": [10, 3, 0], "nz": [1, -1, -1] }, { "size": 2, "px": [8, 3], "py": [10, 3], "pz": [1, 2], "nx": [23, 14], "ny": [3, 18], "nz": [0, -1] }, { "size": 2, "px": [11, 11], "py": [19, 0], "pz": [0, -1], "nx": [4, 16], "ny": [4, 11], "nz": [1, 0] }, { "size": 2, "px": [22, 23], "py": [3, 22], "pz": [0, -1], "nx": [9, 3], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [7, 2], "py": [12, 4], "pz": [0, -1], "nx": [8, 4], "ny": [10, 5], "nz": [0, 1] }, { "size": 2, "px": [12, 13], "py": [5, 13], "pz": [0, -1], "nx": [11, 3], "ny": [2, 0], "nz": [0, 2] }, { "size": 2, "px": [3, 17], "py": [0, 16], "pz": [1, -1], "nx": [12, 12], "ny": [5, 6], "nz": [0, 0] }, { "size": 2, "px": [4, 3], "py": [1, 0], "pz": [2, 2], "nx": [4, 3], "ny": [0, 3], "nz": [0, -1] }, { "size": 2, "px": [10, 3], "py": [12, 0], "pz": [0, -1], "nx": [12, 12], "ny": [13, 12], "nz": [0, 0] }, { "size": 2, "px": [13, 4], "py": [11, 14], "pz": [0, -1], "nx": [0, 0], "ny": [4, 6], "nz": [1, 0] }, { "size": 2, "px": [8, 7], "py": [7, 8], "pz": [1, 1], "nx": [3, 0], "ny": [5, 21], "nz": [2, -1] }, { "size": 2, "px": [1, 3], "py": [4, 14], "pz": [2, 0], "nx": [8, 8], "ny": [7, 7], "nz": [1, -1] }, { "size": 2, "px": [13, 11], "py": [20, 7], "pz": [0, -1], "nx": [21, 21], "ny": [20, 18], "nz": [0, 0] }, { "size": 2, "px": [2, 1], "py": [11, 0], "pz": [0, -1], "nx": [2, 2], "ny": [15, 14], "nz": [0, 0] }, { "size": 2, "px": [10, 1], "py": [8, 0], "pz": [1, -1], "nx": [8, 4], "ny": [7, 4], "nz": [1, 2] }, { "size": 2, "px": [17, 6], "py": [13, 1], "pz": [0, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [7, 15], "py": [1, 3], "pz": [1, 0], "nx": [15, 5], "ny": [1, 8], "nz": [0, -1] }, { "size": 2, "px": [16, 1], "py": [20, 10], "pz": [0, -1], "nx": [6, 8], "ny": [11, 10], "nz": [1, 1] }, { "size": 2, "px": [7, 14], "py": [0, 0], "pz": [1, 0], "nx": [7, 8], "ny": [7, 3], "nz": [1, -1] }, { "size": 2, "px": [12, 5], "py": [17, 4], "pz": [0, -1], "nx": [12, 5], "ny": [16, 10], "nz": [0, 1] }, { "size": 2, "px": [13, 3], "py": [15, 0], "pz": [0, -1], "nx": [12, 7], "ny": [17, 8], "nz": [0, 1] }, { "size": 2, "px": [7, 1], "py": [14, 1], "pz": [0, -1], "nx": [4, 6], "ny": [6, 12], "nz": [1, 0] }, { "size": 2, "px": [8, 7], "py": [0, 0], "pz": [0, 0], "nx": [6, 20], "ny": [5, 5], "nz": [0, -1] }, { "size": 2, "px": [10, 2], "py": [22, 5], "pz": [0, -1], "nx": [4, 8], "ny": [4, 9], "nz": [2, 1] }, { "size": 4, "px": [8, 2, 2, 9], "py": [6, 5, 3, 11], "pz": [1, -1, -1, -1], "nx": [2, 7, 4, 3], "ny": [2, 1, 0, 2], "nz": [2, 0, 1, 2] }, { "size": 2, "px": [12, 6], "py": [12, 6], "pz": [0, 1], "nx": [8, 2], "ny": [4, 1], "nz": [1, -1] }, { "size": 2, "px": [13, 11], "py": [19, 8], "pz": [0, -1], "nx": [13, 13], "ny": [20, 17], "nz": [0, 0] }, { "size": 2, "px": [11, 19], "py": [5, 14], "pz": [0, -1], "nx": [3, 4], "ny": [8, 4], "nz": [1, 1] }, { "size": 2, "px": [10, 0], "py": [8, 6], "pz": [1, -1], "nx": [21, 21], "ny": [16, 15], "nz": [0, 0] }, { "size": 2, "px": [1, 12], "py": [7, 6], "pz": [1, -1], "nx": [2, 7], "ny": [5, 14], "nz": [2, 0] }, { "size": 2, "px": [2, 9], "py": [7, 5], "pz": [1, -1], "nx": [2, 5], "ny": [5, 9], "nz": [2, 1] }, { "size": 2, "px": [12, 5], "py": [15, 6], "pz": [0, -1], "nx": [3, 12], "ny": [0, 2], "nz": [2, 0] }, { "size": 2, "px": [23, 22], "py": [23, 1], "pz": [0, -1], "nx": [0, 0], "ny": [2, 3], "nz": [2, 2] }, { "size": 2, "px": [3, 6], "py": [1, 2], "pz": [2, 1], "nx": [8, 0], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [5, 1], "py": [9, 1], "pz": [0, -1], "nx": [4, 2], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [0, 1], "py": [0, 0], "pz": [2, 0], "nx": [2, 3], "ny": [9, 10], "nz": [0, -1] }, { "size": 2, "px": [6, 0], "py": [16, 14], "pz": [0, -1], "nx": [6, 3], "ny": [23, 14], "nz": [0, 0] }, { "size": 2, "px": [3, 3], "py": [2, 3], "pz": [2, 1], "nx": [13, 3], "ny": [19, 14], "nz": [0, -1] }, { "size": 2, "px": [11, 5], "py": [8, 18], "pz": [0, -1], "nx": [4, 7], "ny": [1, 2], "nz": [2, 1] }, { "size": 2, "px": [4, 4], "py": [5, 6], "pz": [1, 1], "nx": [2, 2], "ny": [5, 3], "nz": [2, -1] }, { "size": 2, "px": [7, 3], "py": [13, 7], "pz": [0, 1], "nx": [4, 3], "ny": [4, 1], "nz": [1, -1] }, { "size": 2, "px": [0, 0], "py": [5, 6], "pz": [1, 0], "nx": [2, 1], "ny": [5, 1], "nz": [1, -1] }, { "size": 2, "px": [7, 14], "py": [3, 5], "pz": [1, 0], "nx": [5, 0], "ny": [16, 7], "nz": [0, -1] }, { "size": 2, "px": [11, 2], "py": [18, 5], "pz": [0, 2], "nx": [11, 4], "ny": [16, 4], "nz": [0, -1] }, { "size": 2, "px": [6, 16], "py": [19, 20], "pz": [0, -1], "nx": [3, 2], "ny": [10, 5], "nz": [1, 2] }, { "size": 2, "px": [5, 3], "py": [3, 1], "pz": [0, 1], "nx": [1, 3], "ny": [4, 8], "nz": [0, -1] }, { "size": 2, "px": [12, 6], "py": [13, 6], "pz": [0, 1], "nx": [10, 1], "ny": [12, 2], "nz": [0, -1] }, { "size": 2, "px": [8, 3], "py": [6, 2], "pz": [1, -1], "nx": [4, 8], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [9, 3], "py": [21, 2], "pz": [0, -1], "nx": [8, 4], "ny": [1, 0], "nz": [1, 2] }, { "size": 2, "px": [8, 4], "py": [1, 0], "pz": [1, -1], "nx": [8, 6], "ny": [4, 2], "nz": [1, 1] }, { "size": 2, "px": [2, 7], "py": [1, 6], "pz": [2, -1], "nx": [7, 9], "ny": [6, 4], "nz": [1, 1] }, { "size": 2, "px": [6, 3], "py": [8, 3], "pz": [1, 2], "nx": [10, 5], "ny": [19, 11], "nz": [0, -1] }, { "size": 2, "px": [2, 2], "py": [3, 4], "pz": [2, 2], "nx": [3, 6], "ny": [4, 6], "nz": [1, -1] }, { "size": 2, "px": [3, 11], "py": [5, 20], "pz": [2, 0], "nx": [11, 5], "ny": [21, 8], "nz": [0, -1] }, { "size": 3, "px": [5, 9, 5], "py": [4, 7, 5], "pz": [2, 0, 2], "nx": [23, 10, 4], "ny": [23, 3, 22], "nz": [0, -1, -1] }, { "size": 4, "px": [11, 9, 7, 1], "py": [13, 8, 11, 10], "pz": [0, -1, -1, -1], "nx": [8, 2, 11, 12], "ny": [4, 2, 4, 4], "nz": [1, 2, 0, 0] }, { "size": 2, "px": [0, 0], "py": [7, 6], "pz": [1, 1], "nx": [0, 4], "ny": [1, 0], "nz": [2, -1] }, { "size": 2, "px": [19, 20], "py": [0, 1], "pz": [0, 0], "nx": [21, 1], "ny": [0, 2], "nz": [0, -1] }, { "size": 2, "px": [8, 5], "py": [11, 0], "pz": [0, -1], "nx": [11, 0], "ny": [12, 1], "nz": [0, 2] }, { "size": 2, "px": [11, 11], "py": [1, 1], "pz": [0, -1], "nx": [4, 7], "ny": [5, 4], "nz": [1, 1] }, { "size": 2, "px": [5, 12], "py": [4, 23], "pz": [2, -1], "nx": [13, 15], "ny": [5, 4], "nz": [0, 0] }, { "size": 2, "px": [12, 20], "py": [4, 16], "pz": [0, -1], "nx": [9, 4], "ny": [2, 1], "nz": [0, 1] }, { "size": 2, "px": [12, 13], "py": [2, 2], "pz": [0, 0], "nx": [4, 16], "ny": [2, 11], "nz": [2, 0] }, { "size": 2, "px": [19, 14], "py": [10, 17], "pz": [0, -1], "nx": [3, 8], "ny": [0, 2], "nz": [2, 0] }, { "size": 2, "px": [8, 12], "py": [1, 2], "pz": [1, 0], "nx": [19, 10], "ny": [3, 1], "nz": [0, -1] }, { "size": 4, "px": [17, 2, 3, 10], "py": [8, 6, 2, 12], "pz": [0, 1, 2, 0], "nx": [17, 9, 12, 2], "ny": [9, 22, 13, 5], "nz": [0, -1, -1, -1] }, { "size": 2, "px": [20, 10], "py": [15, 7], "pz": [0, 1], "nx": [13, 9], "ny": [7, 3], "nz": [0, -1] }, { "size": 2, "px": [0, 0], "py": [1, 0], "pz": [2, 2], "nx": [10, 3], "ny": [9, 2], "nz": [1, -1] }, { "size": 2, "px": [4, 3], "py": [1, 0], "pz": [2, 2], "nx": [0, 22], "ny": [14, 6], "nz": [0, -1] }, { "size": 2, "px": [16, 3], "py": [4, 0], "pz": [0, 2], "nx": [16, 3], "ny": [2, 0], "nz": [0, -1] }, { "size": 2, "px": [8, 16], "py": [6, 12], "pz": [1, 0], "nx": [8, 12], "ny": [4, 7], "nz": [1, -1] }, { "size": 2, "px": [5, 11], "py": [0, 5], "pz": [2, 1], "nx": [10, 1], "ny": [5, 5], "nz": [1, -1] }, { "size": 2, "px": [7, 4], "py": [5, 5], "pz": [0, -1], "nx": [3, 6], "ny": [2, 3], "nz": [1, 0] }, { "size": 2, "px": [11, 11], "py": [11, 12], "pz": [0, 0], "nx": [23, 7], "ny": [20, 2], "nz": [0, -1] }, { "size": 2, "px": [16, 8], "py": [12, 5], "pz": [0, 1], "nx": [8, 2], "ny": [2, 1], "nz": [1, -1] }, { "size": 3, "px": [6, 11, 11], "py": [11, 23, 20], "pz": [1, 0, 0], "nx": [11, 3, 22], "ny": [21, 3, 16], "nz": [0, -1, -1] }, { "size": 2, "px": [17, 15], "py": [3, 2], "pz": [0, -1], "nx": [4, 4], "ny": [3, 2], "nz": [2, 2] }, { "size": 2, "px": [21, 21], "py": [11, 10], "pz": [0, 0], "nx": [11, 3], "ny": [6, 2], "nz": [1, -1] }, { "size": 2, "px": [23, 21], "py": [22, 10], "pz": [0, -1], "nx": [20, 10], "ny": [18, 10], "nz": [0, 1] }, { "size": 2, "px": [4, 2], "py": [6, 3], "pz": [1, 2], "nx": [3, 2], "ny": [4, 3], "nz": [1, -1] }, { "size": 2, "px": [16, 0], "py": [18, 11], "pz": [0, -1], "nx": [8, 7], "ny": [4, 4], "nz": [0, 0] }, { "size": 2, "px": [6, 21], "py": [3, 16], "pz": [0, -1], "nx": [1, 8], "ny": [2, 14], "nz": [2, 0] }, { "size": 2, "px": [8, 1], "py": [3, 0], "pz": [0, -1], "nx": [11, 11], "ny": [2, 1], "nz": [0, 0] }, { "size": 3, "px": [11, 11, 11], "py": [9, 10, 8], "pz": [1, 1, 1], "nx": [23, 1, 0], "ny": [23, 9, 11], "nz": [0, -1, -1] }, { "size": 2, "px": [6, 3], "py": [2, 1], "pz": [1, 2], "nx": [7, 1], "ny": [8, 2], "nz": [0, -1] }, { "size": 2, "px": [10, 17], "py": [17, 19], "pz": [0, -1], "nx": [10, 4], "ny": [16, 9], "nz": [0, 1] }, { "size": 2, "px": [3, 6], "py": [7, 1], "pz": [1, -1], "nx": [11, 0], "ny": [11, 8], "nz": [0, 1] }, { "size": 2, "px": [10, 5], "py": [11, 4], "pz": [1, 2], "nx": [5, 5], "ny": [0, 0], "nz": [2, -1] }, { "size": 2, "px": [3, 6], "py": [3, 6], "pz": [2, 1], "nx": [8, 0], "ny": [4, 16], "nz": [1, -1] }, { "size": 2, "px": [14, 1], "py": [20, 2], "pz": [0, -1], "nx": [7, 7], "ny": [11, 9], "nz": [1, 1] }, { "size": 3, "px": [11, 13, 4], "py": [16, 21, 3], "pz": [0, 0, 2], "nx": [14, 16, 5], "ny": [20, 14, 9], "nz": [0, -1, -1] }, { "size": 2, "px": [7, 0], "py": [1, 1], "pz": [1, -1], "nx": [4, 7], "ny": [2, 4], "nz": [2, 1] }, { "size": 2, "px": [23, 11], "py": [9, 4], "pz": [0, 1], "nx": [11, 3], "ny": [1, 3], "nz": [0, -1] }, { "size": 2, "px": [11, 13], "py": [23, 23], "pz": [0, 0], "nx": [13, 13], "ny": [20, 20], "nz": [0, -1] }, { "size": 2, "px": [10, 8], "py": [5, 11], "pz": [0, -1], "nx": [20, 19], "ny": [18, 20], "nz": [0, 0] }, { "size": 2, "px": [19, 5], "py": [22, 4], "pz": [0, -1], "nx": [2, 9], "ny": [3, 17], "nz": [1, 0] }, { "size": 2, "px": [15, 2], "py": [13, 7], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 2, "px": [14, 13], "py": [17, 2], "pz": [0, -1], "nx": [15, 13], "ny": [19, 15], "nz": [0, 0] }, { "size": 2, "px": [12, 23], "py": [8, 22], "pz": [0, -1], "nx": [7, 10], "ny": [5, 9], "nz": [1, 0] }, { "size": 2, "px": [2, 6], "py": [21, 10], "pz": [0, -1], "nx": [3, 4], "ny": [3, 3], "nz": [1, 1] }, { "size": 2, "px": [15, 11], "py": [5, 0], "pz": [0, -1], "nx": [3, 4], "ny": [17, 16], "nz": [0, 0] }, { "size": 2, "px": [3, 1], "py": [18, 8], "pz": [0, 1], "nx": [14, 4], "ny": [17, 7], "nz": [0, -1] }, { "size": 2, "px": [15, 3], "py": [18, 3], "pz": [0, 2], "nx": [1, 22], "ny": [0, 1], "nz": [0, -1] }, { "size": 2, "px": [13, 3], "py": [9, 3], "pz": [0, -1], "nx": [0, 1], "ny": [9, 20], "nz": [1, 0] }, { "size": 2, "px": [1, 1], "py": [1, 0], "pz": [2, 2], "nx": [9, 23], "ny": [10, 12], "nz": [1, -1] }, { "size": 4, "px": [9, 0, 9, 1], "py": [8, 0, 0, 10], "pz": [1, -1, -1, -1], "nx": [23, 7, 5, 23], "ny": [20, 7, 5, 19], "nz": [0, 1, 2, 0] }, { "size": 2, "px": [18, 18], "py": [12, 12], "pz": [0, -1], "nx": [8, 4], "ny": [4, 2], "nz": [1, 2] }, { "size": 3, "px": [0, 4, 1], "py": [3, 5, 3], "pz": [1, -1, -1], "nx": [16, 11, 8], "ny": [8, 5, 6], "nz": [0, 0, 0] }, { "size": 5, "px": [9, 10, 14, 11, 11], "py": [0, 0, 0, 0, 0], "pz": [0, 0, 0, 0, -1], "nx": [8, 3, 4, 6, 2], "ny": [22, 9, 5, 4, 0], "nz": [0, 1, 0, 0, 2] }, { "size": 2, "px": [6, 5], "py": [2, 2], "pz": [1, 1], "nx": [7, 3], "ny": [8, 7], "nz": [0, -1] }, { "size": 2, "px": [11, 5], "py": [15, 2], "pz": [0, -1], "nx": [3, 10], "ny": [0, 1], "nz": [2, 0] }, { "size": 2, "px": [0, 11], "py": [11, 12], "pz": [1, -1], "nx": [22, 22], "ny": [14, 13], "nz": [0, 0] }, { "size": 2, "px": [2, 2], "py": [15, 14], "pz": [0, 0], "nx": [1, 2], "ny": [11, 8], "nz": [1, -1] }, { "size": 2, "px": [11, 6], "py": [0, 7], "pz": [1, -1], "nx": [19, 5], "ny": [3, 0], "nz": [0, 2] }, { "size": 2, "px": [2, 3], "py": [3, 7], "pz": [2, 1], "nx": [1, 5], "ny": [5, 0], "nz": [1, -1] }, { "size": 2, "px": [10, 14], "py": [4, 5], "pz": [0, -1], "nx": [4, 18], "ny": [2, 12], "nz": [2, 0] }, { "size": 2, "px": [19, 10], "py": [12, 2], "pz": [0, -1], "nx": [13, 4], "ny": [10, 2], "nz": [0, 2] }, { "size": 2, "px": [6, 1], "py": [21, 6], "pz": [0, -1], "nx": [6, 5], "ny": [0, 0], "nz": [1, 1] }], "alpha": [-1.044179e+00, 1.044179e+00, -6.003138e-01, 6.003138e-01, -4.091282e-01, 4.091282e-01, -4.590148e-01, 4.590148e-01, -4.294004e-01, 4.294004e-01, -3.360846e-01, 3.360846e-01, -3.054186e-01, 3.054186e-01, -2.901743e-01, 2.901743e-01, -3.522417e-01, 3.522417e-01, -3.195838e-01, 3.195838e-01, -2.957309e-01, 2.957309e-01, -2.876727e-01, 2.876727e-01, -2.637460e-01, 2.637460e-01, -2.607900e-01, 2.607900e-01, -2.455714e-01, 2.455714e-01, -2.749847e-01, 2.749847e-01, -2.314217e-01, 2.314217e-01, -2.540871e-01, 2.540871e-01, -2.143416e-01, 2.143416e-01, -2.565697e-01, 2.565697e-01, -1.901272e-01, 1.901272e-01, -2.259981e-01, 2.259981e-01, -2.012333e-01, 2.012333e-01, -2.448460e-01, 2.448460e-01, -2.192845e-01, 2.192845e-01, -2.005951e-01, 2.005951e-01, -2.259000e-01, 2.259000e-01, -1.955758e-01, 1.955758e-01, -2.235332e-01, 2.235332e-01, -1.704490e-01, 1.704490e-01, -1.584628e-01, 1.584628e-01, -2.167710e-01, 2.167710e-01, -1.592909e-01, 1.592909e-01, -1.967292e-01, 1.967292e-01, -1.432268e-01, 1.432268e-01, -2.039949e-01, 2.039949e-01, -1.404068e-01, 1.404068e-01, -1.788201e-01, 1.788201e-01, -1.498714e-01, 1.498714e-01, -1.282541e-01, 1.282541e-01, -1.630182e-01, 1.630182e-01, -1.398111e-01, 1.398111e-01, -1.464143e-01, 1.464143e-01, -1.281712e-01, 1.281712e-01, -1.417014e-01, 1.417014e-01, -1.779164e-01, 1.779164e-01, -2.067174e-01, 2.067174e-01, -1.344947e-01, 1.344947e-01, -1.357351e-01, 1.357351e-01, -1.683191e-01, 1.683191e-01, -1.821768e-01, 1.821768e-01, -2.158307e-01, 2.158307e-01, -1.812857e-01, 1.812857e-01, -1.635445e-01, 1.635445e-01, -1.474934e-01, 1.474934e-01, -1.771993e-01, 1.771993e-01, -1.517620e-01, 1.517620e-01, -1.283184e-01, 1.283184e-01, -1.862675e-01, 1.862675e-01, -1.420491e-01, 1.420491e-01, -1.232165e-01, 1.232165e-01, -1.472696e-01, 1.472696e-01, -1.192156e-01, 1.192156e-01, -1.602034e-01, 1.602034e-01, -1.321473e-01, 1.321473e-01, -1.358101e-01, 1.358101e-01, -1.295821e-01, 1.295821e-01, -1.289102e-01, 1.289102e-01, -1.232520e-01, 1.232520e-01, -1.332227e-01, 1.332227e-01, -1.358887e-01, 1.358887e-01, -1.179559e-01, 1.179559e-01, -1.263694e-01, 1.263694e-01, -1.444876e-01, 1.444876e-01, -1.933141e-01, 1.933141e-01, -1.917886e-01, 1.917886e-01, -1.199760e-01, 1.199760e-01, -1.359937e-01, 1.359937e-01, -1.690073e-01, 1.690073e-01, -1.894222e-01, 1.894222e-01, -1.699422e-01, 1.699422e-01, -1.340361e-01, 1.340361e-01, -1.840622e-01, 1.840622e-01, -1.277397e-01, 1.277397e-01, -1.381610e-01, 1.381610e-01, -1.282241e-01, 1.282241e-01, -1.211334e-01, 1.211334e-01, -1.264628e-01, 1.264628e-01, -1.373010e-01, 1.373010e-01, -1.363356e-01, 1.363356e-01, -1.562568e-01, 1.562568e-01, -1.268735e-01, 1.268735e-01, -1.037859e-01, 1.037859e-01, -1.394322e-01, 1.394322e-01, -1.449225e-01, 1.449225e-01, -1.109657e-01, 1.109657e-01, -1.086931e-01, 1.086931e-01, -1.379135e-01, 1.379135e-01, -1.881974e-01, 1.881974e-01, -1.304956e-01, 1.304956e-01, -9.921777e-02, 9.921777e-02, -1.398624e-01, 1.398624e-01, -1.216469e-01, 1.216469e-01, -1.272741e-01, 1.272741e-01, -1.878236e-01, 1.878236e-01, -1.336894e-01, 1.336894e-01, -1.256289e-01, 1.256289e-01, -1.247231e-01, 1.247231e-01, -1.853400e-01, 1.853400e-01, -1.087805e-01, 1.087805e-01, -1.205676e-01, 1.205676e-01, -1.023182e-01, 1.023182e-01, -1.268422e-01, 1.268422e-01, -1.422900e-01, 1.422900e-01, -1.098174e-01, 1.098174e-01, -1.317018e-01, 1.317018e-01, -1.378142e-01, 1.378142e-01, -1.274550e-01, 1.274550e-01, -1.142944e-01, 1.142944e-01, -1.713488e-01, 1.713488e-01, -1.103035e-01, 1.103035e-01, -1.045221e-01, 1.045221e-01, -1.293015e-01, 1.293015e-01, -9.763183e-02, 9.763183e-02, -1.387213e-01, 1.387213e-01, -9.031167e-02, 9.031167e-02, -1.283052e-01, 1.283052e-01, -1.133462e-01, 1.133462e-01, -9.370681e-02, 9.370681e-02, -1.079269e-01, 1.079269e-01, -1.331913e-01, 1.331913e-01, -8.969902e-02, 8.969902e-02, -1.044560e-01, 1.044560e-01, -9.387466e-02, 9.387466e-02, -1.208988e-01, 1.208988e-01, -1.252011e-01, 1.252011e-01, -1.401277e-01, 1.401277e-01, -1.461381e-01, 1.461381e-01, -1.323763e-01, 1.323763e-01, -9.923889e-02, 9.923889e-02, -1.142899e-01, 1.142899e-01, -9.110853e-02, 9.110853e-02, -1.106607e-01, 1.106607e-01, -1.253140e-01, 1.253140e-01, -9.657895e-02, 9.657895e-02, -1.030010e-01, 1.030010e-01, -1.348857e-01, 1.348857e-01, -1.237793e-01, 1.237793e-01, -1.296943e-01, 1.296943e-01, -1.323385e-01, 1.323385e-01, -8.331554e-02, 8.331554e-02, -8.417589e-02, 8.417589e-02, -1.104431e-01, 1.104431e-01, -1.170710e-01, 1.170710e-01, -1.391725e-01, 1.391725e-01, -1.485189e-01, 1.485189e-01, -1.840393e-01, 1.840393e-01, -1.238250e-01, 1.238250e-01, -1.095287e-01, 1.095287e-01, -1.177869e-01, 1.177869e-01, -1.036409e-01, 1.036409e-01, -9.802581e-02, 9.802581e-02, -9.364054e-02, 9.364054e-02, -9.936022e-02, 9.936022e-02, -1.117201e-01, 1.117201e-01, -1.081300e-01, 1.081300e-01, -1.331861e-01, 1.331861e-01, -1.192122e-01, 1.192122e-01, -9.889761e-02, 9.889761e-02, -1.173456e-01, 1.173456e-01, -1.032917e-01, 1.032917e-01, -9.268551e-02, 9.268551e-02, -1.178563e-01, 1.178563e-01, -1.215065e-01, 1.215065e-01, -1.060437e-01, 1.060437e-01, -1.010044e-01, 1.010044e-01, -1.021683e-01, 1.021683e-01, -9.974968e-02, 9.974968e-02, -1.161528e-01, 1.161528e-01, -8.686721e-02, 8.686721e-02, -8.145259e-02, 8.145259e-02, -9.937060e-02, 9.937060e-02, -1.170885e-01, 1.170885e-01, -7.693779e-02, 7.693779e-02, -9.047233e-02, 9.047233e-02, -9.168442e-02, 9.168442e-02, -1.054105e-01, 1.054105e-01, -9.036177e-02, 9.036177e-02, -1.251949e-01, 1.251949e-01, -9.523847e-02, 9.523847e-02, -1.038930e-01, 1.038930e-01, -1.433660e-01, 1.433660e-01, -1.489830e-01, 1.489830e-01, -8.393174e-02, 8.393174e-02, -8.888026e-02, 8.888026e-02, -9.347861e-02, 9.347861e-02, -1.044838e-01, 1.044838e-01, -1.102144e-01, 1.102144e-01, -1.383415e-01, 1.383415e-01, -1.466476e-01, 1.466476e-01, -1.129741e-01, 1.129741e-01, -1.310915e-01, 1.310915e-01, -1.070648e-01, 1.070648e-01, -7.559007e-02, 7.559007e-02, -8.812082e-02, 8.812082e-02, -1.234272e-01, 1.234272e-01, -1.088022e-01, 1.088022e-01, -8.388703e-02, 8.388703e-02, -7.179593e-02, 7.179593e-02, -1.008961e-01, 1.008961e-01, -9.030070e-02, 9.030070e-02, -8.581345e-02, 8.581345e-02, -9.023431e-02, 9.023431e-02, -9.807321e-02, 9.807321e-02, -9.621402e-02, 9.621402e-02, -1.730195e-01, 1.730195e-01, -8.984631e-02, 8.984631e-02, -9.556661e-02, 9.556661e-02, -1.047576e-01, 1.047576e-01, -7.854313e-02, 7.854313e-02, -8.682118e-02, 8.682118e-02, -1.159761e-01, 1.159761e-01, -1.339540e-01, 1.339540e-01, -1.003048e-01, 1.003048e-01, -9.747544e-02, 9.747544e-02, -9.501058e-02, 9.501058e-02, -1.321566e-01, 1.321566e-01, -9.194706e-02, 9.194706e-02, -9.359276e-02, 9.359276e-02, -1.015916e-01, 1.015916e-01, -1.174192e-01, 1.174192e-01, -1.039931e-01, 1.039931e-01, -9.746733e-02, 9.746733e-02, -1.286120e-01, 1.286120e-01, -1.044899e-01, 1.044899e-01, -1.066385e-01, 1.066385e-01, -8.368626e-02, 8.368626e-02, -1.271919e-01, 1.271919e-01, -1.055946e-01, 1.055946e-01, -8.272876e-02, 8.272876e-02, -1.370564e-01, 1.370564e-01, -8.539379e-02, 8.539379e-02, -1.100343e-01, 1.100343e-01, -8.102170e-02, 8.102170e-02, -1.028728e-01, 1.028728e-01, -1.305065e-01, 1.305065e-01, -1.059506e-01, 1.059506e-01, -1.264646e-01, 1.264646e-01, -8.383843e-02, 8.383843e-02, -9.357698e-02, 9.357698e-02, -7.474400e-02, 7.474400e-02, -7.814045e-02, 7.814045e-02, -8.600970e-02, 8.600970e-02, -1.206090e-01, 1.206090e-01, -9.986512e-02, 9.986512e-02, -8.516476e-02, 8.516476e-02, -7.198783e-02, 7.198783e-02, -7.838409e-02, 7.838409e-02, -1.005142e-01, 1.005142e-01, -9.951857e-02, 9.951857e-02, -7.253998e-02, 7.253998e-02, -9.913739e-02, 9.913739e-02, -7.500360e-02, 7.500360e-02, -9.258090e-02, 9.258090e-02, -1.400287e-01, 1.400287e-01, -1.044404e-01, 1.044404e-01, -7.404339e-02, 7.404339e-02, -7.256833e-02, 7.256833e-02, -1.006995e-01, 1.006995e-01, -1.426043e-01, 1.426043e-01, -1.036529e-01, 1.036529e-01, -1.208443e-01, 1.208443e-01, -1.074245e-01, 1.074245e-01, -1.141448e-01, 1.141448e-01, -1.015809e-01, 1.015809e-01, -1.028822e-01, 1.028822e-01, -1.055682e-01, 1.055682e-01, -9.468699e-02, 9.468699e-02, -1.010098e-01, 1.010098e-01, -1.205054e-01, 1.205054e-01, -8.392956e-02, 8.392956e-02, -8.052297e-02, 8.052297e-02, -9.576507e-02, 9.576507e-02, -9.515692e-02, 9.515692e-02, -1.564745e-01, 1.564745e-01, -7.357238e-02, 7.357238e-02, -1.129262e-01, 1.129262e-01, -1.013265e-01, 1.013265e-01, -8.760761e-02, 8.760761e-02, -8.714771e-02, 8.714771e-02, -9.605039e-02, 9.605039e-02, -9.064677e-02, 9.064677e-02, -8.243857e-02, 8.243857e-02, -8.495858e-02, 8.495858e-02, -8.350249e-02, 8.350249e-02, -7.423234e-02, 7.423234e-02, -7.930799e-02, 7.930799e-02, -6.620023e-02, 6.620023e-02, -7.311919e-02, 7.311919e-02, -1.237938e-01, 1.237938e-01, -1.086814e-01, 1.086814e-01, -6.379798e-02, 6.379798e-02, -7.526021e-02, 7.526021e-02, -8.297097e-02, 8.297097e-02, -8.186337e-02, 8.186337e-02, -7.627362e-02, 7.627362e-02, -1.061638e-01, 1.061638e-01, -8.328494e-02, 8.328494e-02, -1.040895e-01, 1.040895e-01, -7.649056e-02, 7.649056e-02, -7.299058e-02, 7.299058e-02, -9.195198e-02, 9.195198e-02, -7.990880e-02, 7.990880e-02, -7.429346e-02, 7.429346e-02, -9.991702e-02, 9.991702e-02, -9.755385e-02, 9.755385e-02, -1.344138e-01, 1.344138e-01, -1.707917e-01, 1.707917e-01, -8.325450e-02, 8.325450e-02, -8.137793e-02, 8.137793e-02, -8.308659e-02, 8.308659e-02, -7.440414e-02, 7.440414e-02, -7.012744e-02, 7.012744e-02, -8.122943e-02, 8.122943e-02, -8.845462e-02, 8.845462e-02, -8.803450e-02, 8.803450e-02, -9.653392e-02, 9.653392e-02, -8.795691e-02, 8.795691e-02, -1.119045e-01, 1.119045e-01, -1.068308e-01, 1.068308e-01, -8.406359e-02, 8.406359e-02, -1.220414e-01, 1.220414e-01, -1.024235e-01, 1.024235e-01, -1.252897e-01, 1.252897e-01, -1.121234e-01, 1.121234e-01, -9.054150e-02, 9.054150e-02, -8.974435e-02, 8.974435e-02, -1.351578e-01, 1.351578e-01, -1.106442e-01, 1.106442e-01, -8.093913e-02, 8.093913e-02, -9.800762e-02, 9.800762e-02, -7.012823e-02, 7.012823e-02, -7.434949e-02, 7.434949e-02, -8.684816e-02, 8.684816e-02, -8.916388e-02, 8.916388e-02, -8.773159e-02, 8.773159e-02, -7.709608e-02, 7.709608e-02, -7.230518e-02, 7.230518e-02, -9.662156e-02, 9.662156e-02, -7.957632e-02, 7.957632e-02, -7.628441e-02, 7.628441e-02, -8.050202e-02, 8.050202e-02, -1.290593e-01, 1.290593e-01, -9.246182e-02, 9.246182e-02, -9.703662e-02, 9.703662e-02, -7.866445e-02, 7.866445e-02, -1.064783e-01, 1.064783e-01, -1.012339e-01, 1.012339e-01, -6.828389e-02, 6.828389e-02, -1.005039e-01, 1.005039e-01, -7.559687e-02, 7.559687e-02, -6.359878e-02, 6.359878e-02, -8.387002e-02, 8.387002e-02, -7.851323e-02, 7.851323e-02, -8.878569e-02, 8.878569e-02, -7.767654e-02, 7.767654e-02, -8.033338e-02, 8.033338e-02, -9.142797e-02, 9.142797e-02, -8.590585e-02, 8.590585e-02, -1.052318e-01, 1.052318e-01, -8.760062e-02, 8.760062e-02, -9.222192e-02, 9.222192e-02, -7.548828e-02, 7.548828e-02, -8.003344e-02, 8.003344e-02, -1.177076e-01, 1.177076e-01, -1.064964e-01, 1.064964e-01, -8.655553e-02, 8.655553e-02, -9.418112e-02, 9.418112e-02, -7.248163e-02, 7.248163e-02, -7.120974e-02, 7.120974e-02, -6.393114e-02, 6.393114e-02, -7.997487e-02, 7.997487e-02, -1.220941e-01, 1.220941e-01, -9.892518e-02, 9.892518e-02, -8.270271e-02, 8.270271e-02, -1.069400e-01, 1.069400e-01, -5.860771e-02, 5.860771e-02, -9.126600e-02, 9.126600e-02, -6.212559e-02, 6.212559e-02, -9.397538e-02, 9.397538e-02, -8.070447e-02, 8.070447e-02, -8.415587e-02, 8.415587e-02, -8.564455e-02, 8.564455e-02, -7.791811e-02, 7.791811e-02, -6.642259e-02, 6.642259e-02, -8.266167e-02, 8.266167e-02, -1.134986e-01, 1.134986e-01, -1.045267e-01, 1.045267e-01, -7.122085e-02, 7.122085e-02, -7.979415e-02, 7.979415e-02, -7.922347e-02, 7.922347e-02, -9.003421e-02, 9.003421e-02, -8.796449e-02, 8.796449e-02, -7.933279e-02, 7.933279e-02, -8.307947e-02, 8.307947e-02, -8.946349e-02, 8.946349e-02, -7.643384e-02, 7.643384e-02, -7.818534e-02, 7.818534e-02, -7.990991e-02, 7.990991e-02, -9.885664e-02, 9.885664e-02, -8.071329e-02, 8.071329e-02, -6.952112e-02, 6.952112e-02, -6.429706e-02, 6.429706e-02, -6.307229e-02, 6.307229e-02, -8.100137e-02, 8.100137e-02, -7.693623e-02, 7.693623e-02, -6.906625e-02, 6.906625e-02, -7.390462e-02, 7.390462e-02, -6.487217e-02, 6.487217e-02, -1.233681e-01, 1.233681e-01, -6.979273e-02, 6.979273e-02, -8.358669e-02, 8.358669e-02, -1.095420e-01, 1.095420e-01, -8.519717e-02, 8.519717e-02, -7.599857e-02, 7.599857e-02, -6.042816e-02, 6.042816e-02, -6.546304e-02, 6.546304e-02, -1.016245e-01, 1.016245e-01, -8.308787e-02, 8.308787e-02, -7.385708e-02, 7.385708e-02, -6.751630e-02, 6.751630e-02, -9.036695e-02, 9.036695e-02, -9.371335e-02, 9.371335e-02, -1.116088e-01, 1.116088e-01, -5.693741e-02, 5.693741e-02, -6.383983e-02, 6.383983e-02, -5.389843e-02, 5.389843e-02, -8.383191e-02, 8.383191e-02, -7.820822e-02, 7.820822e-02, -7.067557e-02, 7.067557e-02, -7.971948e-02, 7.971948e-02, -7.360668e-02, 7.360668e-02, -7.008027e-02, 7.008027e-02, -8.013378e-02, 8.013378e-02, -8.331605e-02, 8.331605e-02, -7.145702e-02, 7.145702e-02, -7.863940e-02, 7.863940e-02, -6.992679e-02, 6.992679e-02, -5.716495e-02, 5.716495e-02, -5.306006e-02, 5.306006e-02, -8.855639e-02, 8.855639e-02, -7.656397e-02, 7.656397e-02, -6.939272e-02, 6.939272e-02, -7.523742e-02, 7.523742e-02, -8.472299e-02, 8.472299e-02, -8.114341e-02, 8.114341e-02, -6.795517e-02, 6.795517e-02, -7.890130e-02, 7.890130e-02, -7.488741e-02, 7.488741e-02, -9.281972e-02, 9.281972e-02, -9.325498e-02, 9.325498e-02, -1.401587e-01, 1.401587e-01, -1.176284e-01, 1.176284e-01, -8.867597e-02, 8.867597e-02, -8.124232e-02, 8.124232e-02, -9.441235e-02, 9.441235e-02, -8.029452e-02, 8.029452e-02, -8.581848e-02, 8.581848e-02, -1.029819e-01, 1.029819e-01, -9.569118e-02, 9.569118e-02, -7.690893e-02, 7.690893e-02, -9.018228e-02, 9.018228e-02, -1.049209e-01, 1.049209e-01, -8.969413e-02, 8.969413e-02, -8.651891e-02, 8.651891e-02, -8.613331e-02, 8.613331e-02, -7.120468e-02, 7.120468e-02, -8.743959e-02, 8.743959e-02, -7.607158e-02, 7.607158e-02, -1.015547e-01, 1.015547e-01, -8.090879e-02, 8.090879e-02, -7.114079e-02, 7.114079e-02, -8.744835e-02, 8.744835e-02, -6.074904e-02, 6.074904e-02, -6.919871e-02, 6.919871e-02, -7.607774e-02, 7.607774e-02, -9.444600e-02, 9.444600e-02, -7.833429e-02, 7.833429e-02, -6.817555e-02, 6.817555e-02, -8.997390e-02, 8.997390e-02, -9.845223e-02, 9.845223e-02, -7.894180e-02, 7.894180e-02, -7.921373e-02, 7.921373e-02, -7.448032e-02, 7.448032e-02, -1.178165e-01, 1.178165e-01, -8.216686e-02, 8.216686e-02, -8.103286e-02, 8.103286e-02, -6.981470e-02, 6.981470e-02, -8.709008e-02, 8.709008e-02, -8.336259e-02, 8.336259e-02, -6.213589e-02, 6.213589e-02, -7.068045e-02, 7.068045e-02, -6.915676e-02, 6.915676e-02, -7.103416e-02, 7.103416e-02, -6.523849e-02, 6.523849e-02, -7.634760e-02, 7.634760e-02, -7.263038e-02, 7.263038e-02, -7.164396e-02, 7.164396e-02, -8.745559e-02, 8.745559e-02, -6.960181e-02, 6.960181e-02, -8.500098e-02, 8.500098e-02, -6.523260e-02, 6.523260e-02, -7.319714e-02, 7.319714e-02, -6.268125e-02, 6.268125e-02, -7.083135e-02, 7.083135e-02, -7.984517e-02, 7.984517e-02, -1.256265e-01, 1.256265e-01, -1.065412e-01, 1.065412e-01, -8.524323e-02, 8.524323e-02, -9.291364e-02, 9.291364e-02, -7.936567e-02, 7.936567e-02, -8.607723e-02, 8.607723e-02, -7.583416e-02, 7.583416e-02, -7.931928e-02, 7.931928e-02, -7.408357e-02, 7.408357e-02, -1.034404e-01, 1.034404e-01, -1.012127e-01, 1.012127e-01, -7.916689e-02, 7.916689e-02, -8.753651e-02, 8.753651e-02, -6.090366e-02, 6.090366e-02, -7.500103e-02, 7.500103e-02, -1.228709e-01, 1.228709e-01, -6.318201e-02, 6.318201e-02, -7.585420e-02, 7.585420e-02, -7.089090e-02, 7.089090e-02, -1.053542e-01, 1.053542e-01, -8.549521e-02, 8.549521e-02, -7.906308e-02, 7.906308e-02, -6.338780e-02, 6.338780e-02, -8.417910e-02, 8.417910e-02, -7.115511e-02, 7.115511e-02, -7.693949e-02, 7.693949e-02, -7.446749e-02, 7.446749e-02, -1.037929e-01, 1.037929e-01, -7.991005e-02, 7.991005e-02, -7.119439e-02, 7.119439e-02, -7.071340e-02, 7.071340e-02, -8.587362e-02, 8.587362e-02, -7.001236e-02, 7.001236e-02, -7.567115e-02, 7.567115e-02, -7.118930e-02, 7.118930e-02, -6.844895e-02, 6.844895e-02, -1.035118e-01, 1.035118e-01, -8.156618e-02, 8.156618e-02, -7.449593e-02, 7.449593e-02, -8.154360e-02, 8.154360e-02, -9.110878e-02, 9.110878e-02, -6.222534e-02, 6.222534e-02, -1.033841e-01, 1.033841e-01, -6.811687e-02, 6.811687e-02, -6.828443e-02, 6.828443e-02, -5.769408e-02, 5.769408e-02, -5.917684e-02, 5.917684e-02, -8.358868e-02, 8.358868e-02] }] };

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* eslint-disable_ */

// jsfeat.imgproc.grayscale

// jsfeat.matrix_t
// jsfeat.U8_t
// jsfeat.C1_t

// jsfeat.bbf.build_pyramid
// jsfeat.bbf.detect
// jsfeat.bbf.group_rectangles
// jsfeat.bbf.face_cascade

var jsfeat = __webpack_require__(0);
var bbfFaceCascade = __webpack_require__(1);

var imgU8 = void 0;
var lastWidth = void 0,
    lastHeight = void 0;

function init() {
  jsfeat.bbf.prepare_cascade(bbfFaceCascade);

  lastWidth = -1;
  lastHeight = -1;
}

init();

self.onmessage = function (e) {
  if (e.data.width !== lastWidth || e.data.height !== lastHeight) {
    // eslint-disable-next-line new-cap
    imgU8 = new jsfeat.matrix_t(e.data.width, e.data.height, jsfeat.U8_t | jsfeat.C1_t);
  }

  var imageData = e.data.image;
  jsfeat.imgproc.grayscale(imageData.data, e.data.width, e.data.height, imgU8);
  // possible options
  // jsfeat.imgproc.equalize_histogram(imgU8, imgU8);
  var pyr = jsfeat.bbf.build_pyramid(imgU8, 24 * 2, 24 * 2, 4);
  var rects = jsfeat.bbf.detect(pyr, bbfFaceCascade);
  rects = jsfeat.bbf.group_rectangles(rects, 1);

  // keep the best results
  var topResults = rects.sort(function (recA, recB) {
    return recB.confidence - recA.confidence;
  }).slice(0, e.data.maxDetectedFaces);

  // scale and remove some values
  var scaledResults = topResults.map(function (res) {
    return {
      x: res.x * e.data.scale,
      y: res.y * e.data.scale,
      width: res.width * e.data.scale,
      height: res.height * e.data.scale
    };
  });

  postMessage({
    id: e.data.id,
    result: scaledResults,
    err: null
  });
};

/***/ })
/******/ ]);
//# sourceMappingURL=a221596b0004fd4893df.worker.js.map