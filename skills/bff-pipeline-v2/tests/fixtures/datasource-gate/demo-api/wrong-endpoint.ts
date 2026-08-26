import { ApiDataSourceError } from 'utils/errors';

import { ApiDataSourceRest } from './api-data-source-rest';

import type { ResponseShape } from '@realt-by/api-schema';
import type { DemoItem } from '@realt-by/api-schema/typescript/demo/http/DemoItem';

const host = process.env.DEMO_HOST ?? '';
const port = process.env.DEMO_PORT ?? '';

export class DemoApi extends ApiDataSourceRest {
  constructor(config: Pick<ApiDataSourceRest, 'req'>) {
    super({ ...config, host, port });
  }

  async getDemoListing(body: DemoItem) {
    const response = await this.post<ResponseShape<DemoItem>>('/demo/wrong-path', {
      body,
    });

    if (!response.success) {
      throw new ApiDataSourceError(response.errors);
    }

    return response.body;
  }
}
