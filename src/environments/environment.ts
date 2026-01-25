import packageJson from '../../package.json';

export const environment = {
  s3Endpoint: 'https://fsn1.your-objectstorage.com/wherespoken/',
  s3EndpointFallback: 'https://hel1.your-objectstorage.com/wherespoken-mirror/',
  gameUrl: 'https://wherespoken.polarcade.eu',
  gameOverviewUrl: 'https://polarcade.eu',
  production: true,
  version: packageJson.version,
};
