const { createProxyMiddleware } = require('http-proxy-middleware')

let proxyMiddlewares = {}

const updateProxyMiddlewares = (proxyConfigs) => {
  proxyMiddlewares = {}

  for (const proxyConfig of proxyConfigs) {
    proxyMiddlewares[proxyConfig.origin] = createProxyMiddleware({
      target: proxyConfig.target,
      pathFilter: '**',
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['access-control-allow-origin'] = '*'
      },
      pathRewrite: {
        [`^${proxyConfig.origin}`]: '',
      },
      changeOrigin: true,
    })
  }
}

const getProxyMiddlewares = () => {
  return proxyMiddlewares
}

module.exports = {
  updateProxyMiddlewares,
  getProxyMiddlewares,
  proxyMiddlewares,
}
