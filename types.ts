export interface Fact {
  id: string;
  statement: string;
  source: string;
  confidence: number;
  category: 'Product' | 'Logistics' | 'Legal' | 'General';
  lastUpdated: string;
}

export interface Constraint {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  type: 'Safety' | 'Brand' | 'Accuracy' | 'Legal';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  factsCited?: string[]; // IDs of facts cited in this message
  violatedConstraintId?: string; // ID of the constraint that triggered a specific response/refusal
}

export interface Conversation {
  id: string;
  clientName: string;
  startTime: string;
  status: 'Active' | 'Completed' | 'Flagged';
  messages: Message[];
}

export interface HistoricalExample {
  id: string;
  scenario: string;
  response: string;
  tags?: string[];
  date?: string;
  flaggedReason?: string;
  severity?: string;
  status?: string;
  timestamp?: string;
}

export type ViewState = 'observer' | 'facts' | 'constraints' | 'history' | 'chatbots' | 'settings' | 'prompt';