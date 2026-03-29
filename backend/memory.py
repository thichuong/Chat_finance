"""
Session-based conversation memory for the Finance Agent.
Maintains a sliding window of messages within a single Gradio session.
"""

from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage


class ConversationMemory:
    """Manages conversation history with a sliding window approach.
    
    Memory is session-scoped: it persists for the duration of a single
    Gradio browser session and is cleared when the page is refreshed.
    """

    def __init__(self, max_messages: int = 20):
        """
        Args:
            max_messages: Maximum number of messages to keep in memory.
                          Older messages are dropped (FIFO) when the limit is exceeded.
        """
        self.messages: List[BaseMessage] = []
        self.max_messages = max_messages

    def add_user_message(self, content: str):
        """Add a user message to memory."""
        self.messages.append(HumanMessage(content=content))
        self._trim()

    def add_ai_message(self, content: str):
        """Add an AI response to memory."""
        self.messages.append(AIMessage(content=content))
        self._trim()

    def get_history(self) -> List[BaseMessage]:
        """Return the full message history within the window."""
        return list(self.messages)

    def get_context_string(self) -> str:
        """Return conversation history as a formatted string for prompt injection.
        
        Only includes the last few exchanges to keep the context window manageable.
        """
        if not self.messages:
            return ""

        # Take last 6 messages (3 exchanges) for context
        recent = self.messages[-6:]
        lines = []
        for msg in recent:
            role = "Người dùng" if isinstance(msg, HumanMessage) else "Trợ lý"
            # Truncate long messages to save tokens
            content = msg.content[:500] + "..." if len(msg.content) > 500 else msg.content
            lines.append(f"{role}: {content}")

        return "\n".join(lines)

    def clear(self):
        """Clear all message history."""
        self.messages.clear()

    def _trim(self):
        """Trim messages to stay within the max_messages window."""
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def __len__(self) -> int:
        return len(self.messages)


# Global memory store keyed by session ID
# (each Gradio tab/window gets its own memory instance)
_memory_store: Dict[str, ConversationMemory] = {}


def get_memory(session_id: str = "default") -> ConversationMemory:
    """Get or create a ConversationMemory for the given session.
    
    Args:
        session_id: Unique identifier for the session.
                    Defaults to "default" for single-user usage.
    
    Returns:
        The ConversationMemory instance for this session.
    """
    if session_id not in _memory_store:
        _memory_store[session_id] = ConversationMemory()
    return _memory_store[session_id]


def clear_memory(session_id: str = "default"):
    """Clear memory for a specific session."""
    if session_id in _memory_store:
        _memory_store[session_id].clear()
