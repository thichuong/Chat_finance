import { FEW_SHOT_EXAMPLES } from './prompts';
import { ToolResult, StepRecord } from './state';

export function parseJsonResponse(content: string): any | null {
  if (!content) return null;

  // Strategy 1: Match JSON inside ```json ... ``` code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Find outermost { ... }
  let braceDepth = 0;
  let startIdx: number | null = null;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') {
      if (braceDepth === 0) {
        startIdx = i;
      }
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
      if (braceDepth === 0 && startIdx !== null) {
        try {
          return JSON.parse(content.substring(startIdx, i + 1));
        } catch {
          startIdx = null;
          continue;
        }
      }
    }
  }

  // Strategy 3: Regex match
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // ignore
    }
  }

  return null;
}

export function buildFewShotPrompt(): string {
  return FEW_SHOT_EXAMPLES.map(
    (ex) => `User: ${ex.user}\nAssistant: ${ex.assistant}`
  ).join('\n\n---\n\n');
}

export function formatToolResults(results: ToolResult[]): string {
  if (!results || results.length === 0) {
    return 'Chưa có kết quả nào.';
  }

  return results
    .map((res) => {
      const toolName = res.tool || 'unknown';
      if (res.error) {
        return `❌ ${toolName}: ${res.error}`;
      }
      return `✅ ${toolName}: ${res.output}`;
    })
    .join('\n');
}

export function formatStepsHistory(steps: StepRecord[]): string {
  if (!steps || steps.length === 0) {
    return 'Chưa thực hiện bước nào.';
  }

  return steps
    .map((step, idx) => {
      let line = `Bước ${idx + 1}: [${step.action}] ${step.thought}`;
      if (step.tools_called && step.tools_called.length > 0) {
        line += `\n  Tools gọi: ${step.tools_called.join(', ')}`;
      }
      return line;
    })
    .join('\n');
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayStr = days[now.getDay()];

  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

  return `${timeStr}, ${dayStr}, ngày ${dateStr}`;
}

