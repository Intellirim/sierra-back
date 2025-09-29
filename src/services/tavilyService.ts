import axios from "axios";
import { getEnv } from "../utils/env.js";

const TAVILY_URL = "https://api.tavily.com/search";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

type TavilyResponse = {
  answer?: string;
  results: TavilyResult[];
};

export async function searchWithTavily(
  query: string,
  includeDomains?: string[]
): Promise<TavilyResponse> {
  const apiKey = getEnv("TAVILY_API_KEY");

  const body: Record<string, unknown> = {
    api_key: apiKey,
    query,
    search_depth: "advanced",
    include_answer: true,
    max_results: 8,
    include_images: false,
  };

  if (includeDomains?.length) {
    body.include_domains = includeDomains;
  }

  const { data } = await axios.post<TavilyResponse>(TAVILY_URL, body, {
    timeout: 20000,
  });

  return data; // { answer, results: [...] }
}