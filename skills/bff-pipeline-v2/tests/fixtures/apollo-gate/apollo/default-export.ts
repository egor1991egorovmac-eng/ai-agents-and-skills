import { gql } from '@apollo/client';

import { createApolloQuery } from 'lib/apollo/create-apollo-bindings';
import type { Query, QueryDemoListingArgs } from 'lib/graphql/types';

const binding = createApolloQuery<Pick<Query, 'demoListing'>, QueryDemoListingArgs>(gql`
  query demoListing($data: DemoListingInput!) {
    demoListing(data: $data) {
      results {
        uuid
      }
    }
  }
`);

export default binding;
