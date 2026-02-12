import packageJson from '../../package.json';

export const environment = {
  middlewareUrl: 'https://riddles.staging.polarcade.eu/api/v2/wherespoken',
  gameUrl: 'https://wherespoken.staging.polarcade.eu',
  gameOverviewUrl: 'https://staging.polarcade.eu',
  production: true,
  version: packageJson.version,
};
