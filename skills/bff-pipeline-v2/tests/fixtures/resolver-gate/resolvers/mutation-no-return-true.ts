import { createResolvers } from 'utils/create-resolvers';

export const mutationDemoArchiveResolver = createResolvers({
  Mutation: {
    demoArchive: async (_root, { data }, { dataSources }) =>
      dataSources.demoAPI.archiveDemo(data),
  },
});
