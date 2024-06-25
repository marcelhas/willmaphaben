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

  const tmp = window.wrappedJSObject["__NEXT_DATA__"].props.pageProps.searchResult.advertSummaryList.advertSummary
  XPCNativeWrapper(window.wrappedJSObject["__NEXT_DATA__"].props.pageProps.searchResult.advertSummaryList.advertSummary);
  const adverts = JSON.parse(JSON.stringify(tmp));
  adverts
    .forEach(advert => {
      const id = advert.id
      const c = advert.attributes.attribute.filter(att => att.name == "COORDINATES").flatMap(x => x.values[0].split(","))
      const title = advert.attributes.attribute.find(att => att.name == "HEADING").values[0]
      const price = advert.attributes.attribute.find(att => att.name == "PRICE").values[0]
      const address = advert.attributes.attribute.find(att => att.name == "ADDRESS")?.values[0]
      const size = advert.teaserAttributes[0]?.value
      L.marker(c)
        .bindPopup(`<b>${title}</b><br>\
          ${price}€, ${size}m², ${Number(price/size).toFixed(2)}€/m²<br>\
          ${address ?? "-"} <br>\
          <a href="https://www.willhaben.at/iad/object?adId=${id}">link</a>`)
        .addTo(map)
    })
}
main()
