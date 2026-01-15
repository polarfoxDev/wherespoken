import packageJson from '../../package.json';

export const environment = {
  s3Endpoint: 'https://fsn1.your-objectstorage.com/wherespoken/',
  gameUrl: 'https://wherespoken.polarcade.eu',
  gameOverviewUrl: 'https://polarcade.eu',
  production: false,
  version: packageJson.version,
};
