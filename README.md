# Othent dARchive API

Endpoint:
`/api/v1/archive` - Capture html and screenshot of the URL and upload it to [Arweave](https://arweave.org/) using [Othent](https://othent.io/).

## Setup

```sh
npm install

# or

yarn
```

Rename `.env.sample` to `.env` and place the value for `BROWSERLESS_API_KEY` and `OTHENT_API_ID`.

If `BROWSERLESS_API_KEY` is present [browerless](https://www.browserless.io/) endpoint is used else Chrome browser is required to capture the webpage and screenshot of the URL with puppeteer.

## Development

```sh
npm run dev

# or

yarn dev
```

## Production

```sh
npm run start

# or

yarn start
```

## Author

👤 **Pawan Paudel**

* Github: [@pawanpaudel93](https://github.com/pawanpaudel93)

## 🤝 Contributing

Contributions, issues and feature requests are welcome! \ Feel free to check [issues page](https://github.com/pawanpaudel93/othent-darchive-api/issues).

## Show your support

Give a ⭐️ if this project helped you!

Copyright © 2023 [Pawan Paudel](https://github.com/pawanpaudel93)
