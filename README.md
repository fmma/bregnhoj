# bregnhoj

Website for bregnhoj.com and meisnermadsen.dk.

## Building

You need `npm`:
```
apt install npm
```

Install deps in node_modules:
```
npm i
```

## Development

Run locally for dev:
```
npm run dev
```

## Release

These commands require ssh access to web server `foadell`.

Build and publish for `bregnhoj.com`:
```
release-bregnhoj
```

Build and publish for `lisogkarsten.dk`:
```
release-meisnermadsen
```

