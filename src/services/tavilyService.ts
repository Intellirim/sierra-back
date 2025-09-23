import axios from 'axios';
import { requireEnv } from '../utils/env.js';

const TAVILY_URL = 'https://api.tavily.com/search';

export async function searchWithTavily(query: string, includeDomains?: string[]) {
  const apiKey = requireEnv('TAVILY_API_KEY');
  const body = {
    api_key: apiKey,
    query,
    search_depth: 'advanced',
    include_answer: true,
    max_results: 8,
    include_images: false,
    include_domains: includeDomains?.length ? includeDomains : undefined
  };

  const { data } = await axios.post(TAVILY_URL, body, { timeout: 20000 });
  return data; // { answer, results: [{title,url,content,score,...}], ...}
}
