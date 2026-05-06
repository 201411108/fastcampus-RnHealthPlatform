module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['**/metro.config.js', '**/babel.config.js'],
  overrides: [
    {
      files: ['apps/mobile/**/*.js'],
      parserOptions: {
        babelOptions: {
          cwd: __dirname + '/apps/mobile',
        },
      },
    },
    {
      files: ['packages/feature-ai-camera/**/*.{ts,tsx}'],
      parserOptions: {
        babelOptions: {
          cwd: __dirname + '/apps/mobile',
        },
      },
    },
  ],
};
