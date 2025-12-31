export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessageType[];
}

export interface ChatMessageType {
  role: 'user' | 'model';
  text: string;
}

export type Language = 'th' | 'en' | 'zh';

export type Theme = 'blue' | 'pink' | 'purple' | 'red';