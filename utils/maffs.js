module.exports = {
  getClosestResolution: (inputResolution) => {
    let resolutions = [
      144, 240, 360, 480, 720, 1080, 1440, 2160, 2540, 4000, 4320,
    ];
    return resolutions.sort(
      (a, b) => Math.abs(inputResolution - a) - Math.abs(inputResolution - b)
    )[0];
  },
};
