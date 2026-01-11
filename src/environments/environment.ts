import packageJson from '../../package.json';

export const environment = {
  s3Endpoint: 'https://fsn1.your-objectstorage.com/wherespoken/',
  gameUrl: 'https://wherespoken.games.polarnight.eu',
  gameOverviewUrl: 'https://games.polarnight.eu',
  production: true,
  version: packageJson.version,
};
