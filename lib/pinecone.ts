import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY;
const environment = process.env.PINECONE_ENVIRONMENT;

if (!apiKey) {
  throw new Error('PINECONE_API_KEY is not set in the environment variables.');
}

if (!environment) {
    throw new Error('PINECONE_ENVIRONMENT is not set in the environment variables.');
}

const pinecone = new Pinecone({
  apiKey,
  environment
});

export const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);
