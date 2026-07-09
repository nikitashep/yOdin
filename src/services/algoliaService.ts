import { algoliasearch } from 'algoliasearch';

const APP_ID = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID ?? '';
const SEARCH_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY ?? '';
const INDEX = 'discussions';

// algoliasearch() throws synchronously when the credentials are empty, so build
// the client lazily and only when configured. Without keys, search is a no-op
// (returns no hits) instead of crashing the Forum screen at import time.
let readClient: ReturnType<typeof algoliasearch> | null = null;
function getClient(): ReturnType<typeof algoliasearch> | null {
  if (!APP_ID || !SEARCH_KEY) return null;
  if (!readClient) readClient = algoliasearch(APP_ID, SEARCH_KEY);
  return readClient;
}

export type AlgoliaHit = {
  objectID: string;
  question: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorNationality: string;
  authorCountryCode: string;
  location: string;
  replyCount: number;
  createdAt: number;
  acceptedReplyId?: string;
  acceptedReplyText?: string;
  acceptedReplyAuthorName?: string;
  isAnswered?: boolean;
};

export async function searchDiscussions(
  query: string,
  nationalities?: string[],
  answerFilter?: 'all' | 'answered' | 'unanswered',
): Promise<AlgoliaHit[]> {
  const client = getClient();
  if (!client) return [];

  const facetFilters: string[][] = [];
  if (nationalities && nationalities.length > 0)
    facetFilters.push(nationalities.map((n) => 'authorNationality:' + n));
  if (answerFilter === 'answered')
    facetFilters.push(['isAnswered:true']);
  else if (answerFilter === 'unanswered')
    facetFilters.push(['isAnswered:false']);

  const result = await client.searchSingleIndex({
    indexName: INDEX,
    searchParams: {
      query,
      ...(facetFilters.length > 0 ? { facetFilters } : {}),
      hitsPerPage: 50,
      attributesToRetrieve: [
        'objectID',
        'question',
        'authorId',
        'authorName',
        'authorPhoto',
        'authorNationality',
        'authorCountryCode',
        'location',
        'replyCount',
        'createdAt',
        'acceptedReplyId',
        'acceptedReplyText',
        'acceptedReplyAuthorName',
        'isAnswered',
      ],
    },
  });
  return result.hits as unknown as AlgoliaHit[];
}
