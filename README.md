# willmaphaben

A Firefox extension that shows a map on [Willhaben](https://willhaben.at).

![Demo Video](./images/demo.avif)

## Setup
> [!warning]
> Currently the map shows only adverts from the current page and might not show all of them as coordinates might be missing.

1. Clone this repo
2. Goto Firefox's debug settings: <about:debugging#/runtime/this-firefox>
3. Click `Load Temporary Add-on...`
4. Select `/manifest.json`
5. Go to `https://www.willhaben.at/`
6. Profit

## Build

```sh
web-ext build
```
