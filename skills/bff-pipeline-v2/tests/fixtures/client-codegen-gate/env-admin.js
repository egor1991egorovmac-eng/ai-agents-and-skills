const host = process.env.NEXT_PUBLIC_API_HOST ?? '127.0.0.1';
const port = process.env.NEXT_PUBLIC_API_PORT;
const portStr = port ? `:${port}` : '';

module.exports = {
  GRAPHQL_URL: `${host}${portStr}/graphql`,
};
