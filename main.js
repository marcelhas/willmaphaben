const interpolateColors = (a, b, x) => {
    // Interpolate each channel
    const interpolatedRGB = a.map((start, index) => {
        const end = b[index];
        return start * (1-x) + end * x
    });
    
    return interpolatedRGB;
}

const normalize = (value, min, max) => {
  if (normalize == null) return null
  if (min === max) return 1
  if (value <= min) return 0
  if (value >= max) return 1

  return (value - min) / (max - min)
}

const colorToString = (color) => {
  const f = (c) => Math.round(c * 255.0)
  const r = f(color[0])
  const g = f(color[1])
  const b = f(color[2])

  return `rgb(${r},${g},${b})`
}

const calcPricePerSize = (price, size) => {
  if (price == null || size == null) return null
  if (size <= 0) return null
  return Number(Number(price / size).toFixed(2))
}

const calcColor = (value) => {
  if (value == null) return colorToString([0, 0, 1])
  const color1 = [0, 1, 0]
  const color2 = [1, 0, 0]
  const color = interpolateColors(color1, color2, value)

  return colorToString(color)
}

const main = () => {
  document.body.style.border = "5px solid red";

  // Map container.
  let mapDiv = document.createElement("div");
  mapDiv.setAttribute("id", "map");
  document.body.prepend(mapDiv)
  let map = L.map('map').setView([48.31150015320114, 14.288522], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Access global json data.
  const tmp = window.wrappedJSObject["__NEXT_DATA__"].props.pageProps.searchResult.advertSummaryList.advertSummary
  XPCNativeWrapper(window.wrappedJSObject["__NEXT_DATA__"].props.pageProps.searchResult.advertSummaryList.advertSummary);

  // Cursed cloning to prevent permission errors ¯\_(ツ)_/¯.
  const adverts = JSON.parse(JSON.stringify(tmp));

  // Min/Max price per m².
  const [min, max] = [9, 15]

  adverts
    .forEach(advert => {
      const id = advert.id
      const c = advert.attributes.attribute.filter(att => att.name == "COORDINATES").flatMap(x => x.values[0].split(","))
      const title = advert.attributes.attribute.find(att => att.name == "HEADING").values[0]
      const price = advert.attributes.attribute.find(att => att.name == "PRICE").values[0]
      const address = advert.attributes.attribute.find(att => att.name == "ADDRESS")?.values[0]
      const size = advert.teaserAttributes[0]?.value
      const pricePerSize = calcPricePerSize(price, size)
      const color = calcColor(normalize(pricePerSize, min, max))

      console.log(id)
      if (c.length <= 0) {
        console.log("no coordinates", advert)
        return
      }

      L.circle(c, { radius: 48, stroke: true, strokeWidth: 1, fill: true, fillColor: color, fillOpacity: 1.0 })
        .bindPopup(`<b>${title}</b><br>\
          ${price}€, ${size}m², ${pricePerSize ?? "?"}€/m²<br>\
          ${address ?? "-"} <br>\
          <a href="https://www.willhaben.at/iad/object?adId=${id}">link</a>`)
        .addTo(map)
    })
}

main()
