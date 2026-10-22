import { getGenAIClient } from '../../agent/llmClient';
import { LLM_MODEL_NAME } from '../../config/constants';

export async function googleSearch(query: string): Promise<string> {
  try {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: LLM_MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [{ text: `Hãy tìm kiếm Google và trả lời ngắn gọn: ${query}` }],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'Bạn là trợ lý tìm kiếm. Hãy dùng Google Search để tìm thông tin chính xác và tóm tắt ngắn gọn các ý chính.',
      },
    });

    return response.text || 'Không tìm thấy kết quả từ Google Search.';
  } catch (e: any) {
    return `[ERROR] Google Search failed: ${e.message}`;
  }
}

