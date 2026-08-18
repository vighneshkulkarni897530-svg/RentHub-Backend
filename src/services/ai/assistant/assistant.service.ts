// ============================================================
// RentHub AI Assistant - Main Service
// ============================================================
// Orchestrates: user message → Ollama → structured intent →
// strict validation → allowlisted tool execution → safe result.
// ============================================================

import { AI_SYSTEM_PROMPT, buildUserMessage } from './aiPrompt';
import { ollamaChat, extractJsonFromResponse, checkOllamaHealth, OllamaError } from './ollamaClient';
import { validateAIIntent, AIAssistantIntent } from './intentSchema';
import { executeIntent, ToolContext, ToolResult } from './aiTools';
import { UserRole } from '../../../models/User';
import logger from '../../../config/logger';

export interface AssistantRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentPath?: string;
    selectedProductId?: string | null;
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  };
}

export interface AssistantResponse {
  success: boolean;
  data: {
    intent: string;
    message: string;
    products?: unknown[];
    navigation?: {
      type: 'SEARCH' | 'PRODUCT' | 'PAGE' | 'LOGIN' | 'NONE';
      url?: string;
      productId?: string;
    };
    requiresLogin?: boolean;
    requiresConfirmation?: boolean;
  };
}

/**
 * Main entry point for the AI assistant.
 * Never throws for user-facing errors — always returns a safe response.
 */
export async function handleAssistantRequest(
  req: AssistantRequest,
  user?: { id: string; role: UserRole }
): Promise<AssistantResponse> {
  const message = (req.message || '').trim();
  if (!message) {
    return {
      success: false,
      data: {
        intent: 'UNKNOWN',
        message: 'Please tell me what you need. For example: "Show me cameras under ₹800 per day".',
        navigation: { type: 'NONE' },
      },
    };
  }

  // 1. Check Ollama health first (fast fail with friendly message)
  const health = await checkOllamaHealth();
  if (!health.ok) {
    logger.warn(`AI Assistant unavailable: ${health.error}`);
    return {
      success: false,
      data: {
        intent: 'UNKNOWN',
        message: 'AI Assistant is currently unavailable. You can still use RentHub normally.',
        navigation: { type: 'NONE' },
      },
    };
  }

  // 2. Build the prompt and call Ollama
  const userMessage = buildUserMessage(message, {
    currentPath: req.context?.currentPath,
    selectedProductId: req.context?.selectedProductId,
    userRole: user?.role || null,
    isAuthenticated: !!user,
    conversationHistory: req.context?.conversationHistory,
  });

  let rawResponse: string;
  try {
    rawResponse = await ollamaChat([
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);
  } catch (err) {
    if (err instanceof OllamaError) {
      logger.warn(`Ollama error: ${err.code} - ${err.message}`);
      return {
        success: false,
        data: {
          intent: 'UNKNOWN',
          message: 'AI Assistant is currently unavailable. You can still use RentHub normally.',
          navigation: { type: 'NONE' },
        },
      };
    }
    return {
      success: false,
      data: {
        intent: 'UNKNOWN',
        message: 'AI Assistant is currently unavailable. You can still use RentHub normally.',
        navigation: { type: 'NONE' },
      },
    };
  }

  // 3. Extract and validate the structured intent
  let intent: AIAssistantIntent;
  try {
    const rawJson = extractJsonFromResponse(rawResponse);
    const validated = validateAIIntent(rawJson);
    if (!validated) {
      logger.warn('AI returned invalid intent schema');
      return {
        success: false,
        data: {
          intent: 'UNKNOWN',
          message: 'I had trouble understanding that. Could you rephrase your request?',
          navigation: { type: 'NONE' },
        },
      };
    }
    intent = validated;
  } catch (err) {
    logger.warn(`AI JSON extraction failed: ${err instanceof Error ? err.message : 'unknown'}`);
    return {
      success: false,
      data: {
        intent: 'UNKNOWN',
        message: 'I had trouble understanding that. Could you rephrase your request?',
        navigation: { type: 'NONE' },
      },
    };
  }

  // 4. Execute only allowlisted tools with the authenticated user context
  const ctx: ToolContext = {
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated: !!user,
  };

  const toolResult: ToolResult = await executeIntent(intent, ctx);

  // 5. Build the safe response
  return {
    success: toolResult.success,
    data: {
      intent: intent.intent,
      message: toolResult.message,
      products: (toolResult.data as { products?: unknown[] })?.products,
      navigation: toolResult.navigation,
      requiresLogin: intent.requiresLogin || false,
      requiresConfirmation: intent.requiresConfirmation || false,
    },
  };
}