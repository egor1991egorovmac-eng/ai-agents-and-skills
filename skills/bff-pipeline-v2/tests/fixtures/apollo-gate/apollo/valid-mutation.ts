import { gql } from '@apollo/client';

import { createApolloMutation } from 'lib/apollo/create-apollo-bindings';
import type { Mutation, MutationWorkStatusCreateArgs } from 'lib/graphql/types';

export const { useMutation: useApolloWorkStatusesCreateWorkStatusMutation } =
  createApolloMutation<Pick<Mutation, 'workStatusCreate'>, MutationWorkStatusCreateArgs>(gql`
    mutation workStatusCreate($data: InputWorkStatusCreate!) {
      workStatusCreate(data: $data)
    }
  `);
