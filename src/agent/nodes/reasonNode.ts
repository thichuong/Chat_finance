import { AgentState, GroundingResult, StepRecord } from '../state';
import { getMemory } from '../memory';
import {
  parseJsonResponse,
  buildFewShotPrompt,
  formatToolResults,
  formatStepsHistory,
  getCurrentTimeStr,
} from '../utils';
import { REACT_SYSTEM_PROMPT, EVALUATION_PROMPT_TEMPLATE } from '../prompts';
import { getGenAIClient } from '../llmClient';
import { LLM_MODEL_NAME, MAX_ITERATIONS } from '../../config/constants';

export async function reasonNode(state: AgentState): Promise<Partial<AgentState>> {
  const iteration = state.iteration || 0;
  const lastMessage = state.messages[state.messages.length - 1];
  const query = lastMessage ? lastMessage.content : '';
  const sessionId = state.session_id || 'default';
  const memory = getMemory(sessionId);

  const thinkingUpdates = [...(state.thinking_updates || [])];

  let prompt = '';
  if (iteration === 0) {
    thinkingUpdates.push(`🔍 **Phân tích yêu cầu:** ${query}`);

    const context = memory.getContextString();
    const contextBlock = context ? `\n\nLịch sử hội thoại gần đây:\n${context}\n` : '';

    prompt = `Thời gian hiện tại: ${getCurrentTimeStr()}

${REACT_SYSTEM_PROMPT}

## Ví dụ:
${buildFewShotPrompt()}

---

${contextBlock}User: ${query}
Assistant:`;
  } else {
    thinkingUpdates.push(`🔄 **Đánh giá kết quả** (vòng ${iteration + 1}/${MAX_ITERATIONS})...`);

    const evalPrompt = EVALUATION_PROMPT_TEMPLATE(
      query,
      formatToolResults(state.all_tool_results || []),
      formatStepsHistory(state.steps || [])
    );

    prompt = `Thời gian hiện tại: ${getCurrentTimeStr()}

${REACT_SYSTEM_PROMPT}

${evalPrompt}`;
  }

  const ai = getGenAIClient();
  const response = await ai.models.generateContent({
    model: LLM_MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    config: {
      thinkingConfig: {
        thinkingLevel: 'HIGH' as any,
      },
      tools: [{ googleSearch: {} }],
    },
  });

  // Extract grounding metadata & native thoughts if returned by Gemma 4
  const groundingData: GroundingResult[] = [...(state.grounding_results || [])];
  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];

    // Check Google Search Grounding
    if (candidate.groundingMetadata) {
      thinkingUpdates.push('🌐 **Sử dụng Google Search nguyên bản**...');
      const chunks = (candidate.groundingMetadata as any).groundingChunks || [];
      const sources: { title: string; url: string }[] = [];
      for (const chunk of chunks) {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
      groundingData.push({
        iteration,
        sources,
        search_queries: (candidate.groundingMetadata as any).searchEntryPoint?.renderedContent || '',
      });
    }

    // Check thoughts in candidate parts
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if ((part as any).thought) {
          thinkingUpdates.push(`💭 **Suy nghĩ (Gemma 4):** ${(part as any).thought}`);
        }
      }
    }
  }

  const content = response.text || '';
  const parsed = parseJsonResponse(content);

  if (!parsed) {
    // Fallback: If we have tool results, proceed to answer
    if (state.all_tool_results && state.all_tool_results.length > 0) {
      thinkingUpdates.push('⚠️ Không parse được JSON, tạo câu trả lời từ dữ liệu đã có...');
      return {
        steps: [
          ...(state.steps || []),
          { thought: 'JSON parse failed, using existing data', action: 'final_answer' },
        ],
        iteration: iteration + 1,
        thinking_updates: thinkingUpdates,
        grounding_results: groundingData,
      };
    } else {
      thinkingUpdates.push('⚠️ Không parse được JSON, trả lời trực tiếp...');
      return {
        final_response: content,
        steps: [{ thought: 'Direct response (no JSON)', action: 'final_answer' }],
        iteration: iteration + 1,
        thinking_updates: thinkingUpdates,
        grounding_results: groundingData,
      };
    }
  }

  const thought = parsed.thought || '';
  const action = parsed.action || 'respond_directly';
  const stepRecord: StepRecord = {
    thought,
    action,
    parsed,
  };

  if (thought) {
    thinkingUpdates.push(`💭 **Suy nghĩ:** ${thought}`);
  }

  // Handle final_answer or respond_directly
  if (action === 'final_answer' || action === 'respond_directly') {
    const answer = parsed.answer || content;
    return {
      final_response: answer,
      steps: [...(state.steps || []), stepRecord],
      iteration: iteration + 1,
      thinking_updates: thinkingUpdates,
      grounding_results: groundingData,
    };
  }

  // Handle call_tools
  let tools = parsed.tools || [];
  if (!tools || tools.length === 0) {
    const toolName = parsed.tool_name || parsed.name;
    const toolInput = parsed.tool_input || parsed.input || '';
    if (toolName) {
      tools = [{ name: toolName, input: toolInput }];
    }
  }

  stepRecord.tools_called = tools.map((t: any) => t.name || '?');
  for (const t of tools) {
    thinkingUpdates.push(`🛠️ **Gọi tool:** ${t.name} → \`${t.input || ''}\``);
  }

  return {
    steps: [...(state.steps || []), stepRecord],
    iteration: iteration + 1,
    thinking_updates: thinkingUpdates,
    grounding_results: groundingData,
  };
}

