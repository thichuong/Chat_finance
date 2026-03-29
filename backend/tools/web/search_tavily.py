from langchain_core.tools import tool
import os
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

@tool
def search_tavily(query: str) -> str:
    """Performs a web search using Tavily API for latest news, articles, and general information.
    Best for finding current events, market analysis, company news.
    Input: Search query string (e.g. "tin tức thị trường chứng khoán Việt Nam hôm nay").
    Returns: Structured search results with titles, URLs, and snippets.
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return "[ERROR] Tavily API key not found. Set TAVILY_API_KEY in .env file."
    
    try:
        tavily = TavilyClient(api_key=api_key)
        response = tavily.search(query=query, search_depth="advanced", max_results=5)
        
        if not response.get('results'):
            return "[ERROR] No search results found for the query."
        
        results = []
        for i, result in enumerate(response['results'], 1):
            results.append(
                f"[{i}] {result['title']}\n"
                f"    URL: {result['url']}\n"
                f"    Summary: {result['content'][:300]}"
            )
        
        return "\n\n".join(results)
    except Exception as e:
        return f"[ERROR] Tavily search failed: {str(e)}"
