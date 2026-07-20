module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        // 프로덕션 빌드 시 모든 console.log 등을 제거하여 성능 향상 및 정보 유출 방지
        plugins: ['transform-remove-console']
      }
    }
  };
};
