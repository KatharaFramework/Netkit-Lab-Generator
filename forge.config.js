module.exports = {
  packagerConfig: {
    icon: './src/static/images/icons/icon'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
  ],
};
