from langchain_core.tools import tool
import requests
import re
from bs4 import BeautifulSoup
from markdownify import markdownify as md

@tool
def scrape_web(url: str) -> str:
    """Reads and extracts the main content of a web page, converting it to clean text.
    Use this to get detailed information from a specific URL (often from search_tavily results).
    Input: Full URL (e.g. "https://vnexpress.net/kinh-doanh/chung-khoan").
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove unwanted elements (more aggressive cleanup)
        for element in soup(['script', 'style', 'nav', 'footer', 'aside', 'header', 
                             'iframe', 'noscript', 'form', 'button']):
            element.decompose()
        
        # Remove common ad/sidebar classes
        for cls in ['sidebar', 'advertisement', 'ad-', 'social-share', 'related-', 'comment']:
            for el in soup.find_all(class_=re.compile(cls, re.I)):
                el.decompose()
        
        # Try to find main content area first
        main_content = (
            soup.find('article') or 
            soup.find('main') or 
            soup.find(class_=re.compile(r'(content|article|post|entry)', re.I)) or
            soup.find('body')
        )
        
        if main_content:
            markdown_content = md(str(main_content))
        else:
            markdown_content = md(str(soup))
        
        # Clean up excessive whitespace
        markdown_content = re.sub(r'\n{3,}', '\n\n', markdown_content).strip()
        
        # Truncate to save tokens
        max_len = 6000
        if len(markdown_content) > max_len:
            markdown_content = markdown_content[:max_len] + "\n\n...[truncated]"
        
        return f"Content from {url}:\n{markdown_content}"
    except requests.exceptions.Timeout:
        return f"[ERROR] Timeout when scraping {url}. The page took too long to respond."
    except requests.exceptions.HTTPError as e:
        return f"[ERROR] HTTP error scraping {url}: {e.response.status_code}"
    except Exception as e:
        return f"[ERROR] Failed to scrape {url}: {str(e)}"
