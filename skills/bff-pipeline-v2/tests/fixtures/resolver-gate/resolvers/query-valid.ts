import { createResolvers } from 'utils/create-resolvers';

export const queryDemoListingResolver = createResolvers({
  Query: {
    demoListing: async (_root, { data }, { dataSources }) =>
      dataSources.demoAPI.getDemoListing(data),
  },
});
