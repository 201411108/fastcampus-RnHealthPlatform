const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const monorepoNodeModules = path.join(monorepoRoot, 'node_modules');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    disableHierarchicalLookup: true,
    nodeModulesPaths: [monorepoNodeModules],
    extraNodeModules: {
      react: path.join(monorepoNodeModules, 'react'),
      'react-native': path.join(monorepoNodeModules, 'react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
