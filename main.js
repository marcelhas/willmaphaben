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

const calcPricePerSize = (price, size) => {
  if (price == null || size == null) return null;
  if (size <= 0) return null;
  return Number(Number(price / size).toFixed(2));
};

const calcColor = (value) => {
  if (value == null) return colorToString([0, 0, 1]);
  const color1 = [0, 1, 0];
  const color2 = [1, 0, 0];
  const color = interpolateColors(color1, color2, value);

  return colorToString(color);
};

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

const mapAdvert = (advert) => {
  const id = advert.id;
  const attr = advert.attributes.attribute;
  const coordinates = attr
    .filter((att) => att.name == "COORDINATES")
    .flatMap((x) => x.values[0].split(","));
  const title = attr.find((att) => att.name == "HEADING")?.values[0];
  const price = attr.find((att) => att.name == "PRICE")?.values[0];
  const address = attr.find((att) => att.name == "ADDRESS")?.values[0];
  const size = advert.teaserAttributes[0]?.value;
  const img = advert.advertImageList.advertImage[0]?.mainImageUrl;

  return {
    id,
    coordinates,
    title,
    price,
    address,
    size,
    img,
  };
};

const filterValidAdvert = (advert) => {
  return advert.coordinates.length > 0;
};

const main = (adverts) => {
  document.body.style.border = "5px solid red";

  // Remove existing map.
  document.getElementById("map")?.remove();
  // Map container.
  const mapDiv = document.createElement("div");
  mapDiv.setAttribute("id", "map");
  document.body.prepend(mapDiv);

  const map = L.map("map");
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Min/Max price per m².
  const [min, max] = [9, 15];

  const preparedAdverts = adverts.map(mapAdvert).filter(filterValidAdvert);

  const mapCenter = calcCoordinatesCenter(
    preparedAdverts.map((pa) => pa.coordinates),
  );
  map.setView(mapCenter, 10);

  preparedAdverts.forEach(
    ({ id, coordinates, title, price, size, address, img }) => {
      const pricePerSize = calcPricePerSize(price, size);
      const color = calcColor(normalize(pricePerSize, min, max));
      L.circle(coordinates, {
        radius: 48,
        stroke: true,
        strokeWidth: 1,
        fill: true,
        fillColor: color,
        fillOpacity: 1.0,
      })
        .bindPopup(
          `<b>${title}</b><br>\
          <img src="${img}" width="250px" alt="image of ${title}" />\
          <p>${price ?? "?"}€, ${size ?? "?"}m², ${pricePerSize ?? "?"}€/m²</p>\
          <p>${address ?? "-"}</p>\
          <a href="https://www.willhaben.at/iad/object?adId=${id}">link</a>`,
        )
        .addTo(map);
    },
  );
};

main(
  JSON.parse(document.getElementById("__NEXT_DATA__").textContent).props
    .pageProps.searchResult.advertSummaryList.advertSummary,
);

// See <https://aweirdimagination.net/2024/05/19/monkey-patching-async-functions-in-user-scripts/>.
const intercept = (resource, responseText) => {
  if (resource.includes("/webapi/iad/search/atz/seo/")) {
    main(JSON.parse(responseText).advertSummaryList.advertSummary);
  }
};

const w = window.wrappedJSObject;
if (w) {
  exportFunction(intercept, window, { defineAs: "extIntercept" });
  w.eval("window.origFetch = window.fetch");

  w.eval(
    `window.fetch = ${async (...args) => {
      let [resource, config] = args;
      const response = await window.origFetch(resource, config);
      window.extIntercept(resource, await response.clone().text());
      return response;
    }}`,
  );
} else {
  const { fetch: origFetch } = window;

  window.fetch = async (...args) => {
    let [resource, config] = args;
    const response = await origFetch(resource, config);
    intercept(resource, await response.clone().text());
    return response;
  };
}
