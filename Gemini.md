# 🧠 Gemini Integration

This document outlines the usage of Google's Gemini models within the Chat Finance project.

## 🔑 Setup

Ensure your API key is correctly set in the environment variables:
```bash
GEMINI_API_KEY=your_api_key_here
```

## 🛠️ Model Usage

We primarily utilize the following models:
- `gemini-2.0-flash`: Optimizing for low latency and high quality responses for quick financial data queries.
- `gemini-1.5-pro`: Used for complex reasoning and long-context financial report analysis.

## 📝 Configuration

Configuration for the Gemini agent can be found in `backend/agent.py`. The agent is configured to:
- Use structured output for tool calls.
- Maintain context across multiple turns for portfolio discussion.
- Apply high-level financial constraints for risk assessment.

## 📡 API Reference

For detailed documentation, visit the [Google AI Documentation](https://ai.google.dev/docs).
