const plugins = [
  // ['@babel/plugin-proposal-class-properties', { loose: true }],
  '@babel/plugin-syntax-dynamic-import',
];

module.exports = {
  babelrc: false,
  plugins,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['defaults'],
        },
      },
    ],
    ['@babel/preset-typescript', { allowNamespaces: true }],
  ],
};
