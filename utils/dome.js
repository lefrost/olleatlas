var ffmpeg = require("fluent-ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer//ffprobe");
ffmpeg.setFfprobePath(ffprobeInstaller.path);

module.exports = {
  removeNonalphanumerics: (str) => {
    return str.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  },
  removeNonnumerics: (str) => {
    return str.replace(/[^0-9]/g, "").toLowerCase();
  },
  stripHtml: (html) => {
    return html.replace(/(<([^>]+)>)/gi, "");
  },
  squeezeStr: (str) => {
    let m = module.exports;
    return m.stripHtml(m.removeNonalphanumerics(str));
  },
  squeezeNum: (str) => {
    let m = module.exports;
    return +m.stripHtml(m.removeNonnumerics(str));
  },
  getVideoDetails: (videoUrl) => {
    let done = new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, function (err, metadata) {
        resolve(metadata ? metadata : null);
      });
    });
    return done;
  },
};
