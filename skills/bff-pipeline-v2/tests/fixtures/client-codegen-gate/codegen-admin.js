require('dotenv').config();

const { GRAPHQL_URL } = require('./src/config/env');

module.exports = {
  schema: GRAPHQL_URL,
  generates: {
    'src/lib/graphql/types.ts': {
      plugins: ['typescript'],
    },
  },
};
