import { AgentState } from '../state';
import { getMemory } from '../memory';
import { formatToolResults, getCurrentTimeStr } from '../utils';
import { getGenAIClient } from '../llmClient';
import { LLM_MODEL_NAME } from '../../config/constants';

export async function generateResponseNode(state: AgentState): Promise<Partial<AgentState>> {
  const thinkingUpdates = [...(state.thinking_updates || [])];

  // If final_response is already set by reasonNode, return it
  if (state.final_response) {
    return { final_response: state.final_response };
  }

  thinkingUpdates.push('📊 **Tổng hợp** câu trả lời cuối cùng...');

  const lastMessage = state.messages[state.messages.length - 1];
  const query = lastMessage ? lastMessage.content : '';
  const toolResults = state.all_tool_results || [];
  const sessionId = state.session_id || 'default';
  const memory = getMemory(sessionId);
  const context = memory.getContextString();

  // Extract native search / grounding results
  let groundingContext = '';
  const groundingData = state.grounding_results || [];
  if (groundingData.length > 0) {
    const sourcesSet = new Set<string>();
    for (const res of groundingData) {
      for (const source of res.sources || []) {
        sourcesSet.add(`- [${source.title}](${source.url})`);
      }
    }
    if (sourcesSet.size > 0) {
      groundingContext = '\nThông tin từ Google Search:\n' + Array.from(sourcesSet).join('\n') + '\n';
    }
  }

  const contextBlock = context ? `\nLịch sử hội thoại:\n${context}\n` : '';

  const prompt = `Thời gian hiện tại: ${getCurrentTimeStr()}

Bạn là một chuyên gia tài chính. Dựa trên dữ liệu sau, hãy trả lời yêu cầu của người dùng bằng tiếng Việt chuyên nghiệp, có cấu trúc rõ ràng (dùng markdown phong phú, bảng nếu cần).

Câu hỏi: ${query}
${contextBlock}
Dữ liệu từ API:
${formatToolResults(toolResults)}
${groundingContext}
Hãy phân tích chuyên sâu, đưa ra nhận xét và khuyến nghị nếu phù hợp. Hãy dẫn nguồn (citations) từ kết quả tìm kiếm nếu có thể.`;

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
      temperature: 0.5,
    },
  });

  return {
    final_response: response.text || '',
    thinking_updates: thinkingUpdates,
  };
}

