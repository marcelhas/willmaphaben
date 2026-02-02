// See <https://stackoverflow.com/a/14231286>.
const calcCoordinatesCenter = (coordinates) => {
  if (coordinates.length <= 0) return [48.31150015320114, 14.288522];
  if (coordinates.length === 1) return coordinates[0];

  let x = 0;
  let y = 0;
  let z = 0;

  for (const c of coordinates) {
    var latitude = (c[0] * Math.PI) / 180;
    var longitude = (c[1] * Math.PI) / 180;

    x += Math.cos(latitude) * Math.cos(longitude);
    y += Math.cos(latitude) * Math.sin(longitude);
    z += Math.sin(latitude);
  }

  var total = coordinates.length;

  x = x / total;
  y = y / total;
  z = z / total;

  var centralLongitude = Math.atan2(y, x);
  var centralSquareRoot = Math.sqrt(x * x + y * y);
  var centralLatitude = Math.atan2(z, centralSquareRoot);

  return [
    (centralLatitude * 180) / Math.PI,
    (centralLongitude * 180) / Math.PI,
  ];
};

const calcColor = (value) => {
  if (value == null) return colorToString([0, 0, 1]);
  const color1 = [0, 1, 0];
  const color2 = [1, 0, 0];
  const color = interpolateColors(color1, color2, value);

  return colorToString(color);
};

const interpolateColors = (a, b, x) => {
  // Interpolate each channel
  const interpolatedRGB = a.map((start, index) => {
    const end = b[index];
    return start * (1 - x) + end * x;
  });

  return interpolatedRGB;
};

const normalize = (value, min, max) => {
  if (value == null) return null;
  if (min === max) return 1;
  if (value <= min) return 0;
  if (value >= max) return 1;

  return (value - min) / (max - min);
};

const colorToString = (color) => {
  const f = (c) => Math.round(c * 255.0);
  const r = f(color[0]);
  const g = f(color[1]);
  const b = f(color[2]);

  return `rgb(${r},${g},${b})`;
};
