import { ErrorCode, ErrorDetail } from './error-codes.js';

export type Role = 'user' | 'assistant';

export type ChatMode = 'chat' | 'explain' | 'fix' | 'generate_tests';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ContextSelection {
  path: string;
  language: string;
  content: string;
}

export interface ContextFile {
  path: string;
  language: string;
  content: string;
}

export interface RequestContext {
  selection?: ContextSelection;
  files?: ContextFile[];
}

export interface ChatOptions {
  stream?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface ChatRequest {
  requestId?: string;
  mode: ChatMode;
  model?: string;
  messages: ChatMessage[];
  context?: RequestContext;
  options?: ChatOptions;
}

export interface UsageInfo {
  inputTokens: number | null;
  outputTokens: number | null;
  neurons: number | null;
}

export interface ChatTiming {
  totalMs: number;
}

export interface ChatResponse {
  requestId: string;
  ok: true;
  model: string;
  output: ChatMessage;
  usage: UsageInfo;
  timing: ChatTiming;
}

export interface HealthResponse {
  ok: true;
  service: string;
  apiVersion: string;
  defaultModel: string;
  streamingEnabled: boolean;
  timestamp: string;
}

export interface ModelCapability {
  id: string;
  label: string;
  capabilities: string[];
  enabled: boolean;
}

export interface ModelsResponse {
  defaultModel: string;
  models: ModelCapability[];
}

export interface ErrorResponse {
  requestId: string;
  ok: false;
  error: ErrorDetail;
}

// SSE Event payloads
export interface MetaEventData {
  requestId: string;
  model: string;
}

export interface DeltaEventData {
  text: string;
}

export interface UsageEventData extends UsageInfo {}

export interface DoneEventData {
  requestId: string;
}

export interface ErrorEventData extends ErrorDetail {}

