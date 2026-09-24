module.exports = {
  apps: [
    {
      name: 'musicmedia',
      cwd: '/home/arx-app/backends/musicmedia',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 50101,
      },
    },
  ],
};