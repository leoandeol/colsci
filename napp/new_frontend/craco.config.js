const path = require('path');

module.exports = {
  style: {
    postOptions: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Handle ESM modules
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      });

      // Resolve .js extensions for imports
      webpackConfig.resolve.extensions.push('.js');

      return webpackConfig;
    },
  },
};