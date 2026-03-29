from langgraph.graph import StateGraph, END
from backend.state import AgentState
from backend.nodes import reason_node, execute_tools_node, generate_response_node, MAX_ITERATIONS

def should_execute_tools(state: AgentState) -> str:
    """After reasoning, decide: execute tools or generate final response."""
    steps = state.get("steps", [])
    
    if not steps:
        return "generate"
    
    last_step = steps[-1]
    action = last_step.get("action", "")
    
    # If the last step decided to call tools → execute them
    if action in ["call_tools", "call_tool"]:
        return "execute"
    
    # Otherwise → generate final response
    return "generate"

def should_continue_loop(state: AgentState) -> str:
    """After executing tools, decide: reason again or generate response.
    
    Continues the ReAct loop if:
    - We haven't hit MAX_ITERATIONS
    - There are tool results to evaluate
    """
    iteration = state.get("iteration", 0)
    
    # Safety: hard limit on iterations
    if iteration >= MAX_ITERATIONS:
        return "generate"
    
    # If we have results, let the reason node evaluate them
    if state.get("all_tool_results"):
        return "reason"
    
    return "generate"


# ============================================================
# Build Graph
# ============================================================

workflow = StateGraph(AgentState)

# Nodes
workflow.add_node("reason", reason_node)
workflow.add_node("execute_tools", execute_tools_node)
workflow.add_node("generate", generate_response_node)

# Entry point
workflow.set_entry_point("reason")

# Edges
workflow.add_conditional_edges(
    "reason",
    should_execute_tools,
    {
        "execute": "execute_tools",
        "generate": "generate",
    }
)

workflow.add_conditional_edges(
    "execute_tools",
    should_continue_loop,
    {
        "reason": "reason",
        "generate": "generate",
    }
)

workflow.add_edge("generate", END)

# Compile
app = workflow.compile()
