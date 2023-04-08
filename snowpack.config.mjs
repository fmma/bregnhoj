
import proxy from 'http2-proxy';

export default {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
  plugins: [
    [
      '@snowpack/plugin-typescript',
      {
        /* Yarn PnP workaround: see https://www.npmjs.com/package/@snowpack/plugin-typescript */
        ...(process.versions.pnp ? { tsc: 'yarn pnpify tsc' } : {}),
      },
    ],
  ],
  routes: [
    {
      src: '/bregnhoj/.*',
      dest: (req, res) => {
        req.url = req.url.replace(/^\/bregnhoj\//, '/');

        return proxy.web(req, res, {
          hostname: 'localhost',
          port: 8080
        });
      }
    }
  ],
  optimize: {
    /* Example: Bundle your final build: */
      bundle: true,
      // minify: true,
      sourcemap: false,
      treeshake: true
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    baseUrl: '/bregnhoj/'
    /* ... */
  },
};