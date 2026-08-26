require('dotenv').config();

const { API_MLS_URL } = require('./src/config/env');

module.exports = {
  schema: `${API_MLS_URL}/graphql`,
  generates: {
    'src/lib/graphql/types.ts': {
      plugins: ['typescript'],
    },
  },
};
