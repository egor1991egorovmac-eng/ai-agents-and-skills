import { createResolvers } from 'utils/create-resolvers';

export const queryDemoListingResolver = createResolvers({
  Query: {
    wrongListing: async (_root, { data }, { dataSources }) =>
      dataSources.demoAPI.getDemoListing(data),
  },
});
