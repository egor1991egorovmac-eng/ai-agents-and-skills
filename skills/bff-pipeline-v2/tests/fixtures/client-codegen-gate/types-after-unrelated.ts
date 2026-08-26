export type Scalars = {
  ID: string;
};

export type Query = {
  demoListing?: Maybe<DemoListing>;
  otherQuery?: Maybe<Scalars['ID']>;
};

export type QueryDemoListingArgs = {
  data: DemoListingInput;
};

export type DemoListingInput = {
  page: Scalars['ID'];
};

export type DemoListing = {
  results: Array<DemoItem>;
};

export type DemoItem = {
  uuid: Scalars['ID'];
};

export type Maybe<T> = T | null;
