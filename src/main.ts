declare module 'inspirit/jsfeat' {

}
var width = 1280;
var height = 720;
import * as jsfeat from 'inspirit/jsfeat';
import { profiler } from './profiler';
import { VideoSourcer } from './videoSourcer';

import * as compatibility from './compatability';
import 'src/dat-gui.js';
export function bootStrapConfigurator(document) {
    // lets do some fun
    var video = document.getElementById('webcam');
    var sourceSelect = document.getElementById('source');
    var videoSourcer = new VideoSourcer(video, sourceSelect);
    var canvas = document.getElementById('canvas');

    try {
        var attempts = 0;
        var readyListener = function(event) {
            findVideoSize();
        };
        var findVideoSize = function() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                video.removeEventListener('loadeddata', readyListener);
                onDimensionsReady(video.videoWidth, video.videoHeight);
            } else {
                if (attempts < 10) {
                    attempts++;
                    setTimeout(findVideoSize, 200);
                } else {
                    onDimensionsReady(width, height);
                }
            }
        };
        var onDimensionsReady = function(width, height) {
            demo_app(width, height);
            compatibility.requestAnimationFrame(tick);
        };

        video.addEventListener('loadeddata', readyListener);

    } catch (error) {
        console.log(error);
        document.getElementById('canvas').classList.add('hide');
        document.getElementById('log').classList.add('hide');
        document.getElementById('no_rtc').innerHTML = '<h4>Something goes wrong...</h4>';
        document.getElementById('no_rtc').classList.remove('hide');
    }

    var stat = new profiler();

    var gui, options, ctx, canvasWidth, canvasHeight;
    var img_u8;

    var demo_opt = function() {
        this.blur_radius = 2;
        this.low_threshold = 20;
        this.high_threshold = 50;
    };

    function demo_app(videoWidth, videoHeight) {
        canvasWidth  = canvas.width = width;
        canvasHeight = canvas.height = height;
        ctx = canvas.getContext('2d');

        ctx.fillStyle = "rgb(0,255,0)";
        ctx.strokeStyle = "rgb(0,255,0)";

        img_u8 = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);

        options = new demo_opt();
        gui = new dat.GUI();
        document.body.appendChild(gui.domElement.parentNode);

        gui.add(options, 'blur_radius', 0, 4).step(1);
        gui.add(options, 'low_threshold', 1, 127).step(1);
        gui.add(options, 'high_threshold', 1, 127).step(1);

        stat.add("grayscale");
        stat.add("gauss blur");
        stat.add("canny edge");
    }

    function tick() {
        compatibility.requestAnimationFrame(tick);
        stat.new_frame();
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, width, height);
            var imageData = ctx.getImageData(0, 0, width, height);

            stat.start("grayscale");
            jsfeat.imgproc.grayscale(imageData.data, width, height, img_u8);
            stat.stop("grayscale");

            var r = options.blur_radius | 0;
            var kernel_size = (r + 1) << 1;

            stat.start("gauss blur");
            jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);
            stat.stop("gauss blur");

            stat.start("canny edge");
            jsfeat.imgproc.canny(img_u8, img_u8, options.low_threshold | 0, options.high_threshold | 0);
            stat.stop("canny edge");

            // render result back to canvas
            var data_u32 = new Uint32Array(imageData.data.buffer);
            var alpha = (0xff << 24);
            var i = img_u8.cols * img_u8.rows, pix = 0;
            while (--i >= 0) {
                pix = img_u8.data[i];
                data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
            }

            ctx.putImageData(imageData, 0, 0);

            document.getElementById('log').innerHTML = stat.log();
        }
    }



    window.addEventListener('unload', function() {
        video.pause();
        video.src = null;
    });
}

window.bootstrapConfigurator = bootStrapConfigurator;
