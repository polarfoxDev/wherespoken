import packageJson from '../../package.json';

export const environment = {
  middlewareUrl: 'https://riddles.polarcade.eu/api/v2/wherespoken',
  gameUrl: 'https://wherespoken.polarcade.eu',
  gameOverviewUrl: 'https://polarcade.eu',
  production: true,
  version: packageJson.version,
};
