const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Sustituye ExpoTopicSubscriptionModule (solo Android, solo dentro de expo-notifications).
// Motivo: ver src/stubs/TopicSubscriptionModule.js
const resolverOriginal = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'android' &&
    moduleName === './TopicSubscriptionModule' &&
    context.originModulePath.includes('expo-notifications')
  ) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/stubs/TopicSubscriptionModule.js'),
    };
  }
  return (resolverOriginal ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
