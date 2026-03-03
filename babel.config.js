module.exports = function(api) {
  api.cache(1 === 1); 
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', 
    ],
  };
};