// Shared TypeScript definitions for EasyDoc

export type Role = 'USER' | 'ADMIN';
export type DocStatus = 'DRAFT' | 'COMPLETE';
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'groq';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  plan: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  templateId?: string | null;
  status: DocStatus;
  createdAt: string;
  updatedAt: string;
  template?: TemplateItem | null;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage?: string | null;
  usageCount: number;
}

export interface AIRequestItem {
  id: string;
  userId: string;
  prompt: string;
  provider: AIProvider;
  responseTimeMs: number;
  success: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isRead: boolean;
  createdAt: string;
}

export interface GenerateDocRequest {
  title: string;
  templateId?: string;
  tone: string;
  instructions: string;
  provider: AIProvider;
}

export interface GenerateDocResponse {
  documentId: string;
  title: string;
  content: string;
  provider: AIProvider;
  responseTimeMs: number;
}
