from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

MAX_ITERATIONS = 5
llm = ChatGoogleGenerativeAI(model="gemma-3-27b-it", temperature=0.3)
