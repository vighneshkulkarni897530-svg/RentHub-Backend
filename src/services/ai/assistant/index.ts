// ============================================================
// RentHub AI Assistant - Module Exports
// ============================================================

export { handleAssistantRequest } from './assistant.service';
export type { AssistantRequest, AssistantResponse } from './assistant.service';
export { validateAIIntent, AI_INTENTS } from './intentSchema';
export type { AIAssistantIntent, AIIntent, PriceUnit, FulfillmentMethod, SortOption } from './intentSchema';
export { checkOllamaHealth } from './ollamaClient';