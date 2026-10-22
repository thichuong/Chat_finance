import { AgentState } from './state';
import { getMemory } from './memory';
import { reasonNode } from './nodes/reasonNode';
import { executeToolsNode } from './nodes/executeToolsNode';
import { generateResponseNode } from './nodes/generateResponseNode';
import { MAX_ITERATIONS } from '../config/constants';

export interface GraphYield {
  type: 'thinking' | 'final' | 'error';
  content: string;
}

function shouldExecuteTools(state: AgentState): boolean {
  const steps = state.steps || [];
  if (steps.length === 0) return false;
  const lastStep = steps[steps.length - 1];
  const action = lastStep.action || '';
  return action === 'call_tools' || action === 'call_tool';
}

function shouldContinueLoop(state: AgentState): boolean {
  const iteration = state.iteration || 0;
  if (iteration >= MAX_ITERATIONS) return false;
  if (state.all_tool_results && state.all_tool_results.length > 0) {
    return true;
  }
  return false;
}

/**
 * Async generator that executes the ReAct Agent Graph and yields real-time updates.
 */
export async function* runAgentGraph(
  query: string,
  sessionId: string = 'default'
): AsyncGenerator<GraphYield, void, unknown> {
  const memory = getMemory(sessionId);
  memory.addUserMessage(query);

  const state: AgentState = {
    messages: [{ role: 'user', content: query }],
    iteration: 0,
    steps: [],
    all_tool_results: [],
    final_response: '',
    session_id: sessionId,
    thinking_updates: [],
    grounding_results: [],
  };

  let lastYieldedThinkingIndex = 0;

  const yieldNewThinking = function* () {
    const updates = state.thinking_updates || [];
    while (lastYieldedThinkingIndex < updates.length) {
      yield {
        type: 'thinking' as const,
        content: updates[lastYieldedThinkingIndex],
      };
      lastYieldedThinkingIndex++;
    }
  };

  try {
    let continueLoop = true;

    while (continueLoop) {
      // 1. Run Reason Node
      const reasonUpdate = await reasonNode(state);
      Object.assign(state, reasonUpdate);
      yield* yieldNewThinking();

      if (state.final_response) {
        break;
      }

      // Check conditional edge from reasonNode
      if (shouldExecuteTools(state)) {
        // 2. Run Execute Tools Node
        const execUpdate = await executeToolsNode(state);
        Object.assign(state, execUpdate);
        yield* yieldNewThinking();

        // Check conditional edge from executeToolsNode
        if (!shouldContinueLoop(state)) {
          break;
        }
        // Loops back to reasonNode
      } else {
        // Doesn't need tools, break to generation
        break;
      }
    }

    // 3. Run Generate Response Node if not already answered
    if (!state.final_response) {
      const genUpdate = await generateResponseNode(state);
      Object.assign(state, genUpdate);
      yield* yieldNewThinking();
    }

    // Yield final response and save to memory
    const finalAnswer = state.final_response || 'Không thể tạo phản hồi.';
    memory.addAiMessage(finalAnswer);
    yield {
      type: 'final',
      content: finalAnswer,
    };
  } catch (error: any) {
    console.error('Agent Graph Execution Error:', error);
    yield {
      type: 'error',
      content: error.message || String(error),
    };
  }
}

