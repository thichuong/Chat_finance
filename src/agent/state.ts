export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StepRecord {
  thought: string;
  action: string;
  tools_called?: string[];
  parsed?: any;
}

export interface ToolResult {
  tool: string;
  input: string;
  output?: string;
  error?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface GroundingResult {
  iteration: number;
  sources: GroundingSource[];
  search_queries?: string;
}

export interface AgentState {
  messages: Message[];
  iteration: number;
  steps: StepRecord[];
  all_tool_results: ToolResult[];
  final_response: string;
  session_id: string;
  thinking_updates: string[];
  grounding_results: GroundingResult[];
}

