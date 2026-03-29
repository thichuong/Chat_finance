from langchain_core.tools import tool
import os
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

@tool
def search_tavily(query: str) -> str:
    """Performs a web search using Tavily API for latest news or general information."""
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return "Tavily API key not found in environmental variables."
    
    try:
        tavily = TavilyClient(api_key=api_key)
        response = tavily.search(query=query, search_depth="advanced")
        results = ""
        for result in response['results']:
            results += f"Title: {result['title']}\nURL: {result['url']}\nSnippet: {result['content']}\n\n"
        return results if results else "No results found."
    except Exception as e:
        return f"Error with Tavily Search: {str(e)}"

@tool
def scrape_web(url: str) -> str:
    """Reads the content of a web page and converts it to markdown for detailed reading."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'footer', 'aside', 'header']):
            element.decompose()
            
        markdown_content = md(str(soup))
        
        return markdown_content[:8000] if len(markdown_content) > 8000 else markdown_content
    except Exception as e:
        return f"Error scraping URL {url}: {str(e)}"

