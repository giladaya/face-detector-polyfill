/* eslint-disable */
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

// namespace ?
var jsfeat = jsfeat || { REVISION: 'ALPHA' };

/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function(global) {
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

    var _data_type_size = new Int32Array([ -1, 1, 4, -1, 4, -1, -1, -1, 8, -1, -1, -1, -1, -1, -1, -1, 8 ]);

    var get_data_type = (function () {
        return function(type) {
            return (type & 0xFF00);
        }
    })();

    var get_channel = (function () {
        return function(type) {
            return (type & 0xFF);
        }
    })();

    var get_data_type_size = (function () {
        return function(type) {
            return _data_type_size[(type & 0xFF00) >> 8];
        }
    })();

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

    var data_t = (function () {
        function data_t(size_in_bytes, buffer) {
            // we need align size to multiple of 8
            this.size = ((size_in_bytes + 7) | 0) & -8;
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
    })();

    var matrix_t = (function () {
        // columns, rows, data_type
        function matrix_t(c, r, data_type, data_buffer) {
            this.type = get_data_type(data_type)|0;
            this.channel = get_channel(data_type)|0;
            this.cols = c|0;
            this.rows = r|0;
            if (typeof data_buffer === "undefined") { 
                this.allocate();
            } else {
                this.buffer = data_buffer;
                // data user asked for
                this.data = this.type&U8_t ? this.buffer.u8 : (this.type&S32_t ? this.buffer.i32 : (this.type&F32_t ? this.buffer.f32 : this.buffer.f64));
            }
        }
        matrix_t.prototype.allocate = function() {
            // clear references
            delete this.data;
            delete this.buffer;
            //
            this.buffer = new data_t((this.cols * get_data_type_size(this.type) * this.channel) * this.rows);
            this.data = this.type&U8_t ? this.buffer.u8 : (this.type&S32_t ? this.buffer.i32 : (this.type&F32_t ? this.buffer.f32 : this.buffer.f64));
        }
        matrix_t.prototype.copy_to = function(other) {
            var od = other.data, td = this.data;
            var i = 0, n = (this.cols*this.rows*this.channel)|0;
            for(; i < n-4; i+=4) {
                od[i] = td[i];
                od[i+1] = td[i+1];
                od[i+2] = td[i+2];
                od[i+3] = td[i+3];
            }
            for(; i < n; ++i) {
                od[i] = td[i];
            }
        }
        matrix_t.prototype.resize = function(c, r, ch) {
            if (typeof ch === "undefined") { ch = this.channel; }
            // relocate buffer only if new size doesnt fit
            var new_size = (c * get_data_type_size(this.type) * ch) * r;
            if(new_size > this.buffer.size) {
                this.cols = c;
                this.rows = r;
                this.channel = ch;
                this.allocate();
            } else {
                this.cols = c;
                this.rows = r;
                this.channel = ch;
            }
        }

        return matrix_t;
    })();

    var pyramid_t = (function () {

        function pyramid_t(levels) {
            this.levels = levels|0;
            this.data = new Array(levels);
            this.pyrdown = jsfeat.imgproc.pyrdown;
        }

        pyramid_t.prototype.allocate = function(start_w, start_h, data_type) {
            var i = this.levels;
            while(--i >= 0) {
                this.data[i] = new matrix_t(start_w >> i, start_h >> i, data_type);
            }
        }

        pyramid_t.prototype.build = function(input, skip_first_level) {
            if (typeof skip_first_level === "undefined") { skip_first_level = true; }
            // just copy data to first level
            var i = 2, a = input, b = this.data[0];
            if(!skip_first_level) {
                var j=input.cols*input.rows;
                while(--j >= 0) {
                    b.data[j] = input.data[j];
                }
            }
            b = this.data[1];
            this.pyrdown(a, b);
            for(; i < this.levels; ++i) {
                a = b;
                b = this.data[i];
                this.pyrdown(a, b);
            }
        }

        return pyramid_t;
    })();

    var keypoint_t = (function () {
        function keypoint_t(x,y,score,level,angle) {
            if (typeof x === "undefined") { x=0; }
            if (typeof y === "undefined") { y=0; }
            if (typeof score === "undefined") { score=0; }
            if (typeof level === "undefined") { level=0; }
            if (typeof angle === "undefined") { angle=-1.0; }

            this.x = x;
            this.y = y;
            this.score = score;
            this.level = level;
            this.angle = angle;
        }
        return keypoint_t;
    })();


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

(function(global) {
    "use strict";
    //

    var cache = (function() {

        // very primitive array cache, still need testing if it helps
        // of course V8 has its own powerful cache sys but i'm not sure
        // it caches several multichannel 640x480 buffer creations each frame

        var _pool_node_t = (function () {
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
            _pool_node_t.prototype.resize = function(size_in_bytes) {
                delete this.data;
                this.data = new jsfeat.data_t(size_in_bytes);
                this.size = this.data.size;
                this.buffer = this.data.buffer;
                this.u8 = this.data.u8;
                this.i32 = this.data.i32;
                this.f32 = this.data.f32;
                this.f64 = this.data.f64;
            }
            return _pool_node_t;
        })();

        var _pool_head, _pool_tail;
        var _pool_size = 0;

        return {

            allocate: function(capacity, data_size) {
                _pool_head = _pool_tail = new _pool_node_t(data_size);
                for (var i = 0; i < capacity; ++i) {
                    var node = new _pool_node_t(data_size);
                    _pool_tail = _pool_tail.next = node;

                    _pool_size++;
                }
            },

            get_buffer: function(size_in_bytes) {
                // assume we have enough free nodes
                var node = _pool_head;
                _pool_head = _pool_head.next;
                _pool_size--;

                if(size_in_bytes > node.size) {
                    node.resize(size_in_bytes);
                }

                return node;
            },

            put_buffer: function(node) {
                _pool_tail = _pool_tail.next = node;
                _pool_size++;
            }
        };
    })();

    global.cache = cache;
    // for now we dont need more than 30 buffers
    // if having cache sys really helps we can add auto extending sys
    cache.allocate(30, 640*4);

})(jsfeat);

/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function(global) {
    "use strict";
    //

    var imgproc = (function() {

        var _resample_u8 = function(src, dst, nw, nh) {
            var xofs_count=0;
            var ch=src.channel,w=src.cols,h=src.rows;
            var src_d=src.data,dst_d=dst.data;
            var scale_x = w / nw, scale_y = h / nh;
            var inv_scale_256 = (scale_x * scale_y * 0x10000)|0;
            var dx=0,dy=0,sx=0,sy=0,sx1=0,sx2=0,i=0,k=0,fsx1=0.0,fsx2=0.0;
            var a=0,b=0,dxn=0,alpha=0,beta=0,beta1=0;

            var buf_node = jsfeat.cache.get_buffer((nw*ch)<<2);
            var sum_node = jsfeat.cache.get_buffer((nw*ch)<<2);
            var xofs_node = jsfeat.cache.get_buffer((w*2*3)<<2);

            var buf = buf_node.i32;
            var sum = sum_node.i32;
            var xofs = xofs_node.i32;

            for (; dx < nw; dx++) {
                fsx1 = dx * scale_x, fsx2 = fsx1 + scale_x;
                sx1 = (fsx1 + 1.0 - 1e-6)|0, sx2 = fsx2|0;
                sx1 = Math.min(sx1, w - 1);
                sx2 = Math.min(sx2, w - 1);

                if(sx1 > fsx1) {
                    xofs[k++] = (dx * ch)|0;
                    xofs[k++] = ((sx1 - 1)*ch)|0; 
                    xofs[k++] = ((sx1 - fsx1) * 0x100)|0;
                    xofs_count++;
                }
                for(sx = sx1; sx < sx2; sx++){
                    xofs_count++;
                    xofs[k++] = (dx * ch)|0;
                    xofs[k++] = (sx * ch)|0;
                    xofs[k++] = 256;
                }
                if(fsx2 - sx2 > 1e-3) {
                    xofs_count++;
                    xofs[k++] = (dx * ch)|0;
                    xofs[k++] = (sx2 * ch)|0;
                    xofs[k++] = ((fsx2 - sx2) * 256)|0;
                }
            }

            for (dx = 0; dx < nw * ch; dx++) {
                buf[dx] = sum[dx] = 0;
            }
            dy = 0;
            for (sy = 0; sy < h; sy++) {
                a = w * sy;
                for (k = 0; k < xofs_count; k++) {
                    dxn = xofs[k*3];
                    sx1 = xofs[k*3+1];
                    alpha = xofs[k*3+2];
                    for (i = 0; i < ch; i++) {
                        buf[dxn + i] += src_d[a+sx1+i] * alpha;
                    }
                }
                if ((dy + 1) * scale_y <= sy + 1 || sy == h - 1) {
                    beta = (Math.max(sy + 1 - (dy + 1) * scale_y, 0.0) * 256)|0;
                    beta1 = 256 - beta;
                    b = nw * dy;
                    if (beta <= 0) {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b+dx] = Math.min(Math.max((sum[dx] + buf[dx] * 256) / inv_scale_256, 0), 255);
                            sum[dx] = buf[dx] = 0;
                        }
                    } else {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b+dx] = Math.min(Math.max((sum[dx] + buf[dx] * beta1) / inv_scale_256, 0), 255);
                            sum[dx] = buf[dx] * beta;
                            buf[dx] = 0;
                        }
                    }
                    dy++;
                } else {
                    for(dx = 0; dx < nw * ch; dx++) {
                        sum[dx] += buf[dx] * 256;
                        buf[dx] = 0;
                    }
                }
            }

            jsfeat.cache.put_buffer(sum_node);
            jsfeat.cache.put_buffer(buf_node);
            jsfeat.cache.put_buffer(xofs_node);
        }

        var _resample = function(src, dst, nw, nh) {
            var xofs_count=0;
            var ch=src.channel,w=src.cols,h=src.rows;
            var src_d=src.data,dst_d=dst.data;
            var scale_x = w / nw, scale_y = h / nh;
            var scale = 1.0 / (scale_x * scale_y);
            var dx=0,dy=0,sx=0,sy=0,sx1=0,sx2=0,i=0,k=0,fsx1=0.0,fsx2=0.0;
            var a=0,b=0,dxn=0,alpha=0.0,beta=0.0,beta1=0.0;

            var buf_node = jsfeat.cache.get_buffer((nw*ch)<<2);
            var sum_node = jsfeat.cache.get_buffer((nw*ch)<<2);
            var xofs_node = jsfeat.cache.get_buffer((w*2*3)<<2);

            var buf = buf_node.f32;
            var sum = sum_node.f32;
            var xofs = xofs_node.f32;

            for (; dx < nw; dx++) {
                fsx1 = dx * scale_x, fsx2 = fsx1 + scale_x;
                sx1 = (fsx1 + 1.0 - 1e-6)|0, sx2 = fsx2|0;
                sx1 = Math.min(sx1, w - 1);
                sx2 = Math.min(sx2, w - 1);

                if(sx1 > fsx1) {
                    xofs_count++;
                    xofs[k++] = ((sx1 - 1)*ch)|0;
                    xofs[k++] = (dx * ch)|0;
                    xofs[k++] = (sx1 - fsx1) * scale;
                }
                for(sx = sx1; sx < sx2; sx++){
                    xofs_count++;
                    xofs[k++] = (sx * ch)|0;
                    xofs[k++] = (dx * ch)|0; 
                    xofs[k++] = scale;
                }
                if(fsx2 - sx2 > 1e-3) {
                    xofs_count++;
                    xofs[k++] = (sx2 * ch)|0;
                    xofs[k++] = (dx * ch)|0;
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
                    sx1 = xofs[k*3]|0;
                    dxn = xofs[k*3+1]|0;
                    alpha = xofs[k*3+2];
                    for (i = 0; i < ch; i++) {
                        buf[dxn + i] += src_d[a+sx1+i] * alpha;
                    }
                }
                if ((dy + 1) * scale_y <= sy + 1 || sy == h - 1) {
                    beta = Math.max(sy + 1 - (dy + 1) * scale_y, 0.0);
                    beta1 = 1.0 - beta;
                    b = nw * dy;
                    if (Math.abs(beta) < 1e-3) {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b+dx] = sum[dx] + buf[dx];
                            sum[dx] = buf[dx] = 0;
                        }
                    } else {
                        for (dx = 0; dx < nw * ch; dx++) {
                            dst_d[b+dx] = sum[dx] + buf[dx] * beta1;
                            sum[dx] = buf[dx] * beta;
                            buf[dx] = 0;
                        }
                    }
                    dy++;
                } else {
                    for(dx = 0; dx < nw * ch; dx++) {
                        sum[dx] += buf[dx]; 
                        buf[dx] = 0;
                    }
                }
            }
            jsfeat.cache.put_buffer(sum_node);
            jsfeat.cache.put_buffer(buf_node);
            jsfeat.cache.put_buffer(xofs_node);
        }

        var _convol_u8 = function(buf, src_d, dst_d, w, h, filter, kernel_size, half_kernel) {
            var i=0,j=0,k=0,sp=0,dp=0,sum=0,sum1=0,sum2=0,sum3=0,f0=filter[0],fk=0;
            var w2=w<<1,w3=w*3,w4=w<<2;
            // hor pass
            for (; i < h; ++i) { 
                sum = src_d[sp];
                for (j = 0; j < half_kernel; ++j) {
                    buf[j] = sum;
                }
                for (j = 0; j <= w-2; j+=2) {
                    buf[j + half_kernel] = src_d[sp+j];
                    buf[j + half_kernel+1] = src_d[sp+j+1];
                }
                for (; j < w; ++j) {
                    buf[j + half_kernel] = src_d[sp+j];
                }
                sum = src_d[sp+w-1];
                for (j = w; j < half_kernel + w; ++j) {
                    buf[j + half_kernel] = sum;
                }
                for (j = 0; j <= w-4; j+=4) {
                    sum = buf[j] * f0, 
                    sum1 = buf[j+1] * f0,
                    sum2 = buf[j+2] * f0,
                    sum3 = buf[j+3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j+1] * fk;
                        sum2 += buf[k + j+2] * fk;
                        sum3 += buf[k + j+3] * fk;
                    }
                    dst_d[dp+j] = Math.min(sum >> 8, 255);
                    dst_d[dp+j+1] = Math.min(sum1 >> 8, 255);
                    dst_d[dp+j+2] = Math.min(sum2 >> 8, 255);
                    dst_d[dp+j+3] = Math.min(sum3 >> 8, 255);
                }
                for (; j < w; ++j) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp+j] = Math.min(sum >> 8, 255);
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
                for (j = 0; j <= h-2; j+=2, k+=w2) {
                    buf[j+half_kernel] = dst_d[k];
                    buf[j+half_kernel+1] = dst_d[k+w];
                }
                for (; j < h; ++j, k+=w) {
                    buf[j+half_kernel] = dst_d[k];
                }
                sum = dst_d[(h-1)*w + i];
                for (j = h; j < half_kernel + h; ++j) {
                    buf[j + half_kernel] = sum;
                }
                dp = i;
                for (j = 0; j <= h-4; j+=4, dp+=w4) { 
                    sum = buf[j] * f0, 
                    sum1 = buf[j+1] * f0,
                    sum2 = buf[j+2] * f0,
                    sum3 = buf[j+3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j+1] * fk;
                        sum2 += buf[k + j+2] * fk;
                        sum3 += buf[k + j+3] * fk;
                    }
                    dst_d[dp] = Math.min(sum >> 8, 255);
                    dst_d[dp+w] = Math.min(sum1 >> 8, 255);
                    dst_d[dp+w2] = Math.min(sum2 >> 8, 255);
                    dst_d[dp+w3] = Math.min(sum3 >> 8, 255);
                }
                for (; j < h; ++j, dp+=w) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp] = Math.min(sum >> 8, 255);
                }
            }
        }

        var _convol = function(buf, src_d, dst_d, w, h, filter, kernel_size, half_kernel) {
            var i=0,j=0,k=0,sp=0,dp=0,sum=0.0,sum1=0.0,sum2=0.0,sum3=0.0,f0=filter[0],fk=0.0;
            var w2=w<<1,w3=w*3,w4=w<<2;
            // hor pass
            for (; i < h; ++i) { 
                sum = src_d[sp];
                for (j = 0; j < half_kernel; ++j) {
                    buf[j] = sum;
                }
                for (j = 0; j <= w-2; j+=2) {
                    buf[j + half_kernel] = src_d[sp+j];
                    buf[j + half_kernel+1] = src_d[sp+j+1];
                }
                for (; j < w; ++j) {
                    buf[j + half_kernel] = src_d[sp+j];
                }
                sum = src_d[sp+w-1];
                for (j = w; j < half_kernel + w; ++j) {
                    buf[j + half_kernel] = sum;
                }
                for (j = 0; j <= w-4; j+=4) {
                    sum = buf[j] * f0, 
                    sum1 = buf[j+1] * f0,
                    sum2 = buf[j+2] * f0,
                    sum3 = buf[j+3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j+1] * fk;
                        sum2 += buf[k + j+2] * fk;
                        sum3 += buf[k + j+3] * fk;
                    }
                    dst_d[dp+j] = sum;
                    dst_d[dp+j+1] = sum1;
                    dst_d[dp+j+2] = sum2;
                    dst_d[dp+j+3] = sum3;
                }
                for (; j < w; ++j) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp+j] = sum;
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
                for (j = 0; j <= h-2; j+=2, k+=w2) {
                    buf[j+half_kernel] = dst_d[k];
                    buf[j+half_kernel+1] = dst_d[k+w];
                }
                for (; j < h; ++j, k+=w) {
                    buf[j+half_kernel] = dst_d[k];
                }
                sum = dst_d[(h-1)*w + i];
                for (j = h; j < half_kernel + h; ++j) {
                    buf[j + half_kernel] = sum;
                }
                dp = i;
                for (j = 0; j <= h-4; j+=4, dp+=w4) { 
                    sum = buf[j] * f0, 
                    sum1 = buf[j+1] * f0,
                    sum2 = buf[j+2] * f0,
                    sum3 = buf[j+3] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        fk = filter[k];
                        sum += buf[k + j] * fk;
                        sum1 += buf[k + j+1] * fk;
                        sum2 += buf[k + j+2] * fk;
                        sum3 += buf[k + j+3] * fk;
                    }
                    dst_d[dp] = sum;
                    dst_d[dp+w] = sum1;
                    dst_d[dp+w2] = sum2;
                    dst_d[dp+w3] = sum3;
                }
                for (; j < h; ++j, dp+=w) {
                    sum = buf[j] * f0;
                    for (k = 1; k < kernel_size; ++k) {
                        sum += buf[k + j] * filter[k];
                    }
                    dst_d[dp] = sum;
                }
            }
        }

        return {
            // TODO: add support for RGB/BGR order
            // for raw arrays
            grayscale: function(src, w, h, dst, code) {
                // this is default image data representation in browser
                if (typeof code === "undefined") { code = jsfeat.COLOR_RGBA2GRAY; }
                var x=0, y=0, i=0, j=0, ir=0,jr=0;
                var coeff_r = 4899, coeff_g = 9617, coeff_b = 1868, cn = 4;

                if(code == jsfeat.COLOR_BGRA2GRAY || code == jsfeat.COLOR_BGR2GRAY) {
                    coeff_r = 1868;
                    coeff_b = 4899;
                }
                if(code == jsfeat.COLOR_RGB2GRAY || code == jsfeat.COLOR_BGR2GRAY) {
                    cn = 3;
                }
                var cn2 = cn<<1, cn3 = (cn*3)|0;

                dst.resize(w, h, 1);
                var dst_u8 = dst.data;

                for(y = 0; y < h; ++y, j+=w, i+=w*cn) {
                    for(x = 0, ir = i, jr = j; x <= w-4; x+=4, ir+=cn<<2, jr+=4) {
                        dst_u8[jr]     = (src[ir] * coeff_r + src[ir+1] * coeff_g + src[ir+2] * coeff_b + 8192) >> 14;
                        dst_u8[jr + 1] = (src[ir+cn] * coeff_r + src[ir+cn+1] * coeff_g + src[ir+cn+2] * coeff_b + 8192) >> 14;
                        dst_u8[jr + 2] = (src[ir+cn2] * coeff_r + src[ir+cn2+1] * coeff_g + src[ir+cn2+2] * coeff_b + 8192) >> 14;
                        dst_u8[jr + 3] = (src[ir+cn3] * coeff_r + src[ir+cn3+1] * coeff_g + src[ir+cn3+2] * coeff_b + 8192) >> 14;
                    }
                    for (; x < w; ++x, ++jr, ir+=cn) {
                        dst_u8[jr] = (src[ir] * coeff_r + src[ir+1] * coeff_g + src[ir+2] * coeff_b + 8192) >> 14;
                    }
                }
            },
            // derived from CCV library
            resample: function(src, dst, nw, nh) {
                var h=src.rows,w=src.cols;
                if (h > nh && w > nw) {
                    dst.resize(nw, nh, src.channel);
                    // using the fast alternative (fix point scale, 0x100 to avoid overflow)
                    if (src.type&jsfeat.U8_t && dst.type&jsfeat.U8_t && h * w / (nh * nw) < 0x100) {
                        _resample_u8(src, dst, nw, nh);
                    } else {
                        _resample(src, dst, nw, nh);
                    }
                }
            },

            // assume we always need it for u8 image
            pyrdown: function(src, dst, sx, sy) {
                // this is needed for bbf
                if (typeof sx === "undefined") { sx = 0; }
                if (typeof sy === "undefined") { sy = 0; }

                var w = src.cols, h = src.rows;
                var w2 = w >> 1, h2 = h >> 1;
                var _w2 = w2 - (sx << 1), _h2 = h2 - (sy << 1);
                var x=0,y=0,sptr=sx+sy*w,sline=0,dptr=0,dline=0;

                dst.resize(w2, h2, src.channel);

                var src_d = src.data, dst_d = dst.data;

                for(y = 0; y < _h2; ++y) {
                    sline = sptr;
                    dline = dptr;
                    for(x = 0; x <= _w2-2; x+=2, dline+=2, sline += 4) {
                        dst_d[dline] = (src_d[sline] + src_d[sline+1] +
                                            src_d[sline+w] + src_d[sline+w+1] + 2) >> 2;
                        dst_d[dline+1] = (src_d[sline+2] + src_d[sline+3] +
                                            src_d[sline+w+2] + src_d[sline+w+3] + 2) >> 2;
                    }
                    for(; x < _w2; ++x, ++dline, sline += 2) {
                        dst_d[dline] = (src_d[sline] + src_d[sline+1] +
                                            src_d[sline+w] + src_d[sline+w+1] + 2) >> 2;
                    }
                    sptr += w << 1;
                    dptr += w2;
                }
            },

            equalize_histogram: function(src, dst) {
                var w=src.cols,h=src.rows,src_d=src.data;

                dst.resize(w, h, src.channel);

                var dst_d=dst.data,size=w*h;
                var i=0,prev=0,hist0,norm;

                var hist0_node = jsfeat.cache.get_buffer(256<<2);
                hist0 = hist0_node.i32;
                for(; i < 256; ++i) hist0[i] = 0;
                for (i = 0; i < size; ++i) {
                    ++hist0[src_d[i]];
                }

                prev = hist0[0];
                for (i = 1; i < 256; ++i) {
                    prev = hist0[i] += prev;
                }

                norm = 255 / size;
                for (i = 0; i < size; ++i) {
                    dst_d[i] = (hist0[src_d[i]] * norm + 0.5)|0;
                }
                jsfeat.cache.put_buffer(hist0_node);
            },
        };
    })();

    global.imgproc = imgproc;

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

(function(global) {
    "use strict";
    //
    var bbf = (function() {

        var _group_func = function(r1, r2) {
            var distance = (r1.width * 0.25 + 0.5)|0;

            return r2.x <= r1.x + distance &&
                   r2.x >= r1.x - distance &&
                   r2.y <= r1.y + distance &&
                   r2.y >= r1.y - distance &&
                   r2.width <= (r1.width * 1.5 + 0.5)|0 &&
                   (r2.width * 1.5 + 0.5)|0 >= r1.width;
        }

        var img_pyr = new jsfeat.pyramid_t(1);

        return {

            interval: 4,
            scale: 1.1486,
            next: 5,
            scale_to: 1,

            // make features local copy
            // to avoid array allocation with each scale
            // this is strange but array works faster than Int32 version???
            prepare_cascade: function(cascade) {
                var sn = cascade.stage_classifier.length;
                for (var j = 0; j < sn; j++) {
                    var orig_feature = cascade.stage_classifier[j].feature;
                    var f_cnt = cascade.stage_classifier[j].count;
                    var feature = cascade.stage_classifier[j]._feature = new Array(f_cnt);
                    for (var k = 0; k < f_cnt; k++) {
                        feature[k] = {"size" : orig_feature[k].size,
                                      "px" : new Array(orig_feature[k].size),
                                      "pz" : new Array(orig_feature[k].size),
                                      "nx" : new Array(orig_feature[k].size),
                                      "nz" : new Array(orig_feature[k].size)};
                    }
                }
            },

            build_pyramid: function(src, min_width, min_height, interval) {
                if (typeof interval === "undefined") { interval = 4; }

                var sw=src.cols,sh=src.rows;
                var i=0,nw=0,nh=0;
                var new_pyr=false;
                var src0=src,src1=src;
                var data_type = jsfeat.U8_t | jsfeat.C1_t;

                this.interval = interval;
                this.scale = Math.pow(2, 1 / (this.interval + 1));
                this.next = (this.interval + 1)|0;
                this.scale_to = (Math.log(Math.min(sw / min_width, sh / min_height)) / Math.log(this.scale))|0;

                var pyr_l = ((this.scale_to + this.next * 2) * 4) | 0;
                if(img_pyr.levels != pyr_l) {
                    img_pyr.levels = pyr_l;
                    img_pyr.data = new Array(pyr_l);
                    new_pyr = true;
                    img_pyr.data[0] = src; // first is src
                }

                for (i = 1; i <= this.interval; ++i) {
                    nw = (sw / Math.pow(this.scale, i))|0;
                    nh = (sh / Math.pow(this.scale, i))|0;
                    src0 = img_pyr.data[i<<2];
                    if(new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[i<<2] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[i<<2];
                    }
                    jsfeat.imgproc.resample(src, src0, nw, nh);
                }
                for (i = this.next; i < this.scale_to + this.next * 2; ++i) {
                    src1 = img_pyr.data[(i << 2) - (this.next << 2)];
                    src0 = img_pyr.data[i<<2];
                    nw = src1.cols >> 1;
                    nh = src1.rows >> 1;
                    if(new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[i<<2] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[i<<2];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0);
                }
                for (i = this.next * 2; i < this.scale_to + this.next * 2; ++i) {
                    src1 = img_pyr.data[(i << 2) - (this.next << 2)];
                    nw = src1.cols >> 1;
                    nh = src1.rows >> 1;
                    src0 = img_pyr.data[(i<<2)+1];
                    if(new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[(i<<2)+1] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[(i<<2)+1];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0, 1, 0);
                    //
                    src0 = img_pyr.data[(i<<2)+2];
                    if(new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[(i<<2)+2] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[(i<<2)+2];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0, 0, 1);
                    //
                    src0 = img_pyr.data[(i<<2)+3];
                    if(new_pyr || nw != src0.cols || nh != src0.rows) {
                        img_pyr.data[(i<<2)+3] = new jsfeat.matrix_t(nw, nh, data_type);
                        src0 = img_pyr.data[(i<<2)+3];
                    }
                    jsfeat.imgproc.pyrdown(src1, src0, 1, 1);
                }
                return img_pyr;
            },

            detect: function(pyramid, cascade) {
                var interval = this.interval;
                var scale = this.scale;
                var next = this.next;
                var scale_upto = this.scale_to;
                var i=0,j=0,k=0,n=0,x=0,y=0,q=0,sn=0,f_cnt=0,q_cnt=0,p=0,pmin=0,nmax=0,f=0,i4=0,qw=0,qh=0;
                var sum=0.0, alpha, feature, orig_feature, feature_k, feature_o, flag = true, shortcut=true;
                var scale_x = 1.0, scale_y = 1.0;
                var dx = [0, 1, 0, 1];
                var dy = [0, 0, 1, 1];
                var seq = [];
                var pyr=pyramid.data, bpp = 1, bpp2 = 2, bpp4 = 4;

                var u8 = [], u8o = [0,0,0];
                var step = [0,0,0];
                var paddings = [0,0,0];

                for (i = 0; i < scale_upto; i++) {
                    i4 = (i<<2);
                    qw = pyr[i4 + (next << 3)].cols - (cascade.width >> 2);
                    qh = pyr[i4 + (next << 3)].rows - (cascade.height >> 2);
                    step[0] = pyr[i4].cols * bpp;
                    step[1] = pyr[i4 + (next << 2)].cols * bpp;
                    step[2] = pyr[i4 + (next << 3)].cols * bpp;
                    paddings[0] = (pyr[i4].cols * bpp4) - (qw * bpp4);
                    paddings[1] = (pyr[i4 + (next << 2)].cols * bpp2) - (qw * bpp2);
                    paddings[2] = (pyr[i4 + (next << 3)].cols * bpp) - (qw * bpp);
                    sn = cascade.stage_classifier.length;
                    for (j = 0; j < sn; j++) {
                        orig_feature = cascade.stage_classifier[j].feature;
                        feature = cascade.stage_classifier[j]._feature;
                        f_cnt = cascade.stage_classifier[j].count;
                        for (k = 0; k < f_cnt; k++) {
                            feature_k = feature[k];
                            feature_o = orig_feature[k];
                            q_cnt = feature_o.size|0;
                            for (q = 0; q < q_cnt; q++) {
                                feature_k.px[q] = (feature_o.px[q] * bpp) + feature_o.py[q] * step[feature_o.pz[q]];
                                feature_k.pz[q] = feature_o.pz[q];
                                feature_k.nx[q] = (feature_o.nx[q] * bpp) + feature_o.ny[q] * step[feature_o.nz[q]];
                                feature_k.nz[q] = feature_o.nz[q];
                            }
                        }
                    }
                    u8[0] = pyr[i4].data; u8[1] = pyr[i4 + (next<<2)].data;
                    for (q = 0; q < 4; q++) {
                        u8[2] = pyr[i4 + (next<<3) + q].data;
                        u8o[0] = (dx[q]*bpp2) + dy[q] * (pyr[i4].cols*bpp2); 
                        u8o[1] = (dx[q]*bpp) + dy[q] * (pyr[i4 + (next<<2)].cols*bpp); 
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
                                            sum += (shortcut) ? alpha[(k << 1) + 1] : alpha[k << 1];
                                        }
                                    }
                                    if (sum < cascade.stage_classifier[j].threshold) {
                                        flag = false;
                                        break;
                                    }
                                }
                                if (flag) {
                                    seq.push({"x" : (x * 4 + dx[q] * 2) * scale_x,
                                              "y" : (y * 4 + dy[q] * 2) * scale_y,
                                              "width" : cascade.width * scale_x,
                                              "height" : cascade.height * scale_y,
                                              "neighbor" : 1,
                                              "confidence" : sum});
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
            group_rectangles: function(rects, min_neighbors) {
                if (typeof min_neighbors === "undefined") { min_neighbors = 1; }
                var i, j, n = rects.length;
                var node = [];
                for (i = 0; i < n; ++i) {
                    node[i] = {"parent" : -1,
                               "element" : rects[i],
                               "rank" : 0};
                }
                for (i = 0; i < n; ++i) {
                    if (!node[i].element)
                        continue;
                    var root = i;
                    while (node[root].parent != -1)
                        root = node[root].parent;
                    for (j = 0; j < n; ++j) {
                        if( i != j && node[j].element && _group_func(node[i].element, node[j].element)) {
                            var root2 = j;

                            while (node[root2].parent != -1)
                                root2 = node[root2].parent;

                            if(root2 != root) {
                                if(node[root].rank > node[root2].rank)
                                    node[root2].parent = root;
                                else {
                                    node[root].parent = root2;
                                    if (node[root].rank == node[root2].rank)
                                    node[root2].rank++;
                                    root = root2;
                                }

                                /* compress path from node2 to the root: */
                                var temp, node2 = j;
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
                for(i = 0; i < n; i++) {
                    j = -1;
                    var node1 = i;
                    if(node[node1].element) {
                        while (node[node1].parent != -1)
                            node1 = node[node1].parent;
                        if(node[node1].rank >= 0)
                            node[node1].rank = ~class_idx++;
                        j = ~node[node1].rank;
                    }
                    idx_seq[i] = j;
                }
                
                var comps = [];
                for (i = 0; i < class_idx+1; ++i) {
                    comps[i] = {"neighbors" : 0,
                                "x" : 0,
                                "y" : 0,
                                "width" : 0,
                                "height" : 0,
                                "confidence" : 0};
                }

                // count number of neighbors
                for(i = 0; i < n; ++i) {
                    var r1 = rects[i];
                    var idx = idx_seq[i];

                    if (comps[idx].neighbors == 0)
                        comps[idx].confidence = r1.confidence;

                    ++comps[idx].neighbors;

                    comps[idx].x += r1.x;
                    comps[idx].y += r1.y;
                    comps[idx].width += r1.width;
                    comps[idx].height += r1.height;
                    comps[idx].confidence = Math.max(comps[idx].confidence, r1.confidence);
                }

                var seq2 = [];
                // calculate average bounding box
                for(i = 0; i < class_idx; ++i) {
                    n = comps[i].neighbors;
                    if (n >= min_neighbors)
                        seq2.push({"x" : (comps[i].x * 2 + n) / (2 * n),
                                   "y" : (comps[i].y * 2 + n) / (2 * n),
                                   "width" : (comps[i].width * 2 + n) / (2 * n),
                                   "height" : (comps[i].height * 2 + n) / (2 * n),
                                   "neighbors" : comps[i].neighbors,
                                   "confidence" : comps[i].confidence});
                }

                var result_seq = [];
                n = seq2.length;
                // filter out small face rectangles inside large face rectangles
                for(i = 0; i < n; ++i) {
                    var r1 = seq2[i];
                    var flag = true;
                    for(j = 0; j < n; ++j) {
                        var r2 = seq2[j];
                        var distance = (r2.width * 0.25 + 0.5)|0;

                        if(i != j &&
                           r1.x >= r2.x - distance &&
                           r1.y >= r2.y - distance &&
                           r1.x + r1.width <= r2.x + r2.width + distance &&
                           r1.y + r1.height <= r2.y + r2.height + distance &&
                           (r2.neighbors > Math.max(3, r1.neighbors) || r1.neighbors < 3)) {
                            flag = false;
                            break;
                        }
                    }

                    if(flag)
                        result_seq.push(r1);
                }
                return result_seq;
            }

        };

    })();

    global.bbf = bbf;

})(jsfeat);
/**
 * @author Eugene Zatepyakin / http://inspirit.ru/
 */

(function(lib) {
    "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        // in a browser, define its namespaces in global
        window.jsfeat = lib;
    } else {
        // in commonjs, or when AMD wrapping has been applied, define its namespaces as exports
        module.exports = lib;
    }
})(jsfeat);
