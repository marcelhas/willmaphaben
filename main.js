const calcPricePerSize = (price, size) => {
  if (price == null || size == null) return null;
  if (size <= 0) return null;
  return Number(Number(price / size).toFixed(2));
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

const toImmobilienPopup = ({ title, img, price, size, address, id }) => {
  const pricePerSize = calcPricePerSize(price, size);
  return `<b>${title}</b><br>\
          <img src="${img}" width="250px" alt="image of ${title}" />\
          <p>${price ?? "?"}€, ${size ?? "?"}m², ${pricePerSize ?? "?"}€/m²</p>\
          <p>${address ?? "-"}</p>\
          <a href="https://www.willhaben.at/iad/object?adId=${id}">link</a>`;
};

const toGenericPopup = ({ title, img, price, address, id }) => {
  return `<b>${title}</b><br>\
          <img src="${img}" width="250px" alt="image of ${title}" />\
          <p>${price ?? "?"}€</p>\
          <p>${address ?? "-"}</p>\
          <a href="https://www.willhaben.at/iad/object?adId=${id}">link</a>`;
};

const toPopup = (advert) => {
  const url = window.location.pathname;
  if (url.includes("/immobilien/")) return toImmobilienPopup(advert);
  else return toGenericPopup(advert);
};

const rerenderMap = (adverts) => {
  document.body.style.border = "5px solid red";

  // Remove existing map.
  document.getElementById("map")?.remove();
  // Map container.
  const mapDiv = document.createElement("div");
  mapDiv.setAttribute("id", "map");
  document.body.prepend(mapDiv);

  const map = L.map("map");
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
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

  preparedAdverts.forEach((advert) => {
    const color = calcColor(normalize(advert.price, min, max));
    L.circle(advert.coordinates, {
      radius: 48,
      stroke: true,
      strokeWidth: 1,
      fill: true,
      fillColor: color,
      fillOpacity: 1.0,
    })
      .bindPopup(toPopup(advert))
      .addTo(map);
  });
};

rerenderMap(
  JSON.parse(document.getElementById("__NEXT_DATA__").textContent).props
    .pageProps.searchResult.advertSummaryList.advertSummary,
);

// React to filter changes.
// See <https://aweirdimagination.net/2024/05/19/monkey-patching-async-functions-in-user-scripts/>.
const intercept = (resource, responseText) => {
  if (resource.includes("/webapi/iad/search/atz/seo/")) {
    rerenderMap(JSON.parse(responseText).advertSummaryList.advertSummary);
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
