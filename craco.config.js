const {
  when,
  whenDev,
  whenProd,
  whenTest,
  ESLINT_MODES,
  POSTCSS_MODES
} = require('@craco/craco')
const CracoAlias = require('craco-alias')
module.exports = {
  reactScriptsVersion: 'react-scripts' /* (default value) */,
  eslint: {
    enable: true /* (default value) */,
    mode: 'extends' /* (default value) */ || 'file',
    configure: (eslintConfig, { env, paths }) => {
      return eslintConfig
    }
    // pluginOptions: (eslintOptions, { env, paths }) => { return eslintOptions; }
  },
  typescript: {
    enableTypeChecking: true /* (default value)  */
  },
  webpack: {
    alias: {},
    plugins: {
      add: [] /* An array of plugins */,
      remove: [] /* An array of plugin constructor's names (i.e. "StyleLintPlugin", "ESLintWebpackPlugin" ) */
    }
    // configure: (webpackConfig, { env, paths }) => { return webpackConfig; }
  },
  // devServer: (devServerConfig, { env, paths, proxy, allowedHost }) => { return devServerConfig; },
  plugins: [
    // {
    //     plugin: {
    //         // overrideCracoConfig: ({ cracoConfig, pluginOptions, context: { env, paths } }) => { return cracoConfig; },
    //         // overrideWebpackConfig: ({ webpackConfig, cracoConfig, pluginOptions, context: { env, paths } }) => { return webpackConfig; },
    //         // overrideDevServerConfig: ({ devServerConfig, cracoConfig, pluginOptions, context: { env, paths, proxy, allowedHost } }) => { return devServerConfig; },
    //         // overrideJestConfig: ({ jestConfig, cracoConfig, pluginOptions, context: { env, paths, resolve, rootDir } }) => { return jestConfig },
    //     },
    //     options: {}
    // },
    {
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        // as you know, CRA doesn't allow to modify tsconfig's compilerOptions
        // so you should create a separate JSON file and extend tsconfig.json from it
        baseUrl: './src',
        // and then just specify its path here:
        tsConfigPath: './tsconfig.extend.json'
      }
    }
  ]
}
