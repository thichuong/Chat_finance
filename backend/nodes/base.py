from langchain_google_genai import ChatGoogleGenerativeAI
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

MAX_ITERATIONS = 5

# Gemma 4 31B Dense - Dùng cho tất cả các node để đảm bảo độ chính xác cao nhất
genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
llm_model_name = "gemma-4-31b-it"

# Cấu hình Native Google Search & Thinking cho Reasoning Node
reasoning_config = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(
        thinking_level="HIGH",
    ),
    tools=[
        types.Tool(googleSearch=types.GoogleSearch())
    ],
)

# Sử dụng 31B Dense cho tất cả các node khác qua LangChain để đồng bộ
llm_generate = ChatGoogleGenerativeAI(model=llm_model_name, temperature=0.5)

# Giữ lại 'llm' và 'llm_reason_model' làm alias
llm = llm_generate
llm_reason_model = llm_model_name
