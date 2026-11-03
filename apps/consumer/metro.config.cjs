const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('node:path');

const config = getDefaultConfig(__dirname);
const current = config.resolver.blockList;
const generatedDirectories = [
  resolve(__dirname, 'dist'),
  resolve(__dirname, 'test-results'),
  resolve(__dirname, 'playwright-report'),
  resolve(__dirname, '../../backend/target'),
];
const escapedDirectory = (directory) =>
  new RegExp(
    `^${directory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/\\\\]|$)`,
  );

// Keep Expo's monorepo defaults. Generated test/build files must not invalidate
// the live Router graph while a browser scenario or export writes artifacts.
config.resolver.blockList = [
  ...(Array.isArray(current) ? current : current ? [current] : []),
  ...generatedDirectories.map(escapedDirectory),
];
module.exports = config;
