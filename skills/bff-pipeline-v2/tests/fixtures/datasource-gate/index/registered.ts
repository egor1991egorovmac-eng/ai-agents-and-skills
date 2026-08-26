import { DemoApi } from './demo-api';

export const getDataSources = ({ req }) => ({
  demoApi: new DemoApi({ req }),
});
