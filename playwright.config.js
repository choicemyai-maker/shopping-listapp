const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testMatch: '**/*.test.js',
  use: {
    headless: false,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
