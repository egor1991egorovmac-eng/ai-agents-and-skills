import { mergeResolvers } from '@graphql-tools/merge';

import { queryDemoListingResolver } from 'graph/demo/query-demoListing/query-demoListing-resolver';

export const resolvers = mergeResolvers([queryDemoListingResolver]);
