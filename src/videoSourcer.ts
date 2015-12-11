export class VideoSourcer {
    stream;

    constructor(private videoElement, private sourceSelect) {

        navigator.getUserMedia = navigator.getUserMedia ||
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;



        this.sourceSelect.onchange = this.start.bind(this);

        if (typeof MediaStreamTrack === 'undefined' ||
            typeof MediaStreamTrack.getSources === 'undefined') {
          alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
        } else {
          MediaStreamTrack.getSources(this.gotSources.bind(this));
        }

        this.start();
    }

    gotSources(sourceInfos) {
      for (var i = 0; i !== sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement('option');
        option.value = sourceInfo.id;
        if (sourceInfo.kind === 'video') {
          option.text = sourceInfo.label || 'camera ' + (this.sourceSelect.length + 1);
          this.sourceSelect.appendChild(option);
        } else {
          console.log('Some other kind of source: ', sourceInfo);
        }
      }
    }
    successCallback(stream) {
      this.stream = stream; // make stream available to console
      this.videoElement.src = window.URL.createObjectURL(stream);
      this.videoElement.play();
    }

    errorCallback(error) {
      console.log('navigator.getUserMedia error: ', error);
    }

    start() {
      if (this.stream) {
        this.videoElement.src = null;
        this.stream.stop();
      }
      var videoSource = this.sourceSelect.value;
      var constraints = {
        video: {
          optional: [{
            sourceId: videoSource
          }]
        }
      };
      navigator.getUserMedia(constraints, this.successCallback.bind(this), this.errorCallback.bind(this));
    }
}
