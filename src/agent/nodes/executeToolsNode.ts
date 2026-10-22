import { AgentState, ToolResult } from '../state';
import { TOOLS_MAP } from '../../tools/registry';

export async function executeToolsNode(state: AgentState): Promise<Partial<AgentState>> {
  const steps = state.steps || [];
  const thinkingUpdates = [...(state.thinking_updates || [])];

  if (steps.length === 0) {
    return { all_tool_results: state.all_tool_results || [] };
  }

  const lastStep = steps[steps.length - 1];
  const parsed = lastStep.parsed || {};
  let toolsToCall = parsed.tools || [];

  // Backward compatibility
  if (!toolsToCall || toolsToCall.length === 0) {
    const name = parsed.tool_name || parsed.name;
    const inp = parsed.tool_input || parsed.input || '';
    if (name) {
      toolsToCall = [{ name, input: inp }];
    }
  }

  const existingResults: ToolResult[] = [...(state.all_tool_results || [])];
  const newResults: ToolResult[] = [];

  // Execute requested tools in parallel
  const executions = toolsToCall.map(async (toolInfo: any) => {
    const name = toolInfo.name || '';
    let inputData = toolInfo.input !== undefined ? toolInfo.input : '';

    if (typeof inputData === 'object' && inputData !== null) {
      inputData = JSON.stringify(inputData);
    } else {
      inputData = String(inputData).trim();
    }

    if (name in TOOLS_MAP) {
      try {
        const result = await TOOLS_MAP[name](inputData);
        return { tool: name, input: inputData, output: String(result) };
      } catch (err: any) {
        return { tool: name, input: inputData, error: err.message || String(err) };
      }
    } else {
      return { tool: name, input: inputData, error: `Tool '${name}' not found` };
    }
  });

  const executed = await Promise.all(executions);
  newResults.push(...executed);

  const successCount = newResults.filter((r) => r.output !== undefined).length;
  const errorCount = newResults.filter((r) => r.error !== undefined).length;

  if (successCount > 0) {
    thinkingUpdates.push(
      `✅ **Kết quả:** ${successCount} tool thành công` + (errorCount > 0 ? `, ${errorCount} lỗi` : '')
    );
  } else if (errorCount > 0) {
    thinkingUpdates.push(`❌ **Lỗi:** ${errorCount} tool thất bại`);
  }

  return {
    all_tool_results: [...existingResults, ...newResults],
    thinking_updates: thinkingUpdates,
  };
}

