export interface MemoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ConversationMemory {
  private messages: MemoryMessage[] = [];
  private maxMessages: number;
  private storageKey: string;

  constructor(sessionId: string = 'default', maxMessages: number = 20) {
    this.maxMessages = maxMessages;
    this.storageKey = `chat_finance_memory_${sessionId}`;
    this.load();
  }

  private load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.messages = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not load memory from localStorage', e);
    }
  }

  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch (e) {
      console.warn('Could not save memory to localStorage', e);
    }
  }

  public addUserMessage(content: string) {
    this.messages.push({ role: 'user', content });
    this.trim();
    this.save();
  }

  public addAiMessage(content: string) {
    this.messages.push({ role: 'assistant', content });
    this.trim();
    this.save();
  }

  public getHistory(): MemoryMessage[] {
    return [...this.messages];
  }

  public getContextString(): string {
    if (this.messages.length === 0) return '';
    // Take last 6 messages (3 exchanges)
    const recent = this.messages.slice(-6);
    return recent
      .map((msg) => {
        const role = msg.role === 'user' ? 'Người dùng' : 'Trợ lý';
        const content = msg.content.length > 500 ? msg.content.slice(0, 500) + '...' : msg.content;
        return `${role}: ${content}`;
      })
      .join('\n');
  }

  public clear() {
    this.messages = [];
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Could not remove memory from localStorage', e);
    }
  }

  private trim() {
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }
}

const memoryStore: Record<string, ConversationMemory> = {};

export function getMemory(sessionId: string = 'default'): ConversationMemory {
  if (!memoryStore[sessionId]) {
    memoryStore[sessionId] = new ConversationMemory(sessionId);
  }
  return memoryStore[sessionId];
}

export function clearMemory(sessionId: string = 'default') {
  if (memoryStore[sessionId]) {
    memoryStore[sessionId].clear();
  } else {
    new ConversationMemory(sessionId).clear();
  }
}

