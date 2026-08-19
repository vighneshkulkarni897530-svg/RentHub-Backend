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
import env from '../../../config/env';

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
    // In development, return the actual reason so the developer can fix it.
    // In production, hide the reason from the user.
    const devMessage =
      env.nodeEnv === 'development'
        ? `AI Assistant is temporarily unavailable. ${health.error}`
        : 'AI Assistant is currently unavailable. You can still use RentHub normally.';
    return {
      success: false,
      data: {
        intent: 'UNKNOWN',
        message: devMessage,
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

  logger.info(`AI request: received: "${message.slice(0, 200)}"`);

  let rawResponse: string;
  try {
    rawResponse = await ollamaChat([
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);
  } catch (err) {
    if (err instanceof OllamaError) {
      logger.warn(`Ollama error: ${err.code} - ${err.message}`);
      const devMessage =
        env.nodeEnv === 'development'
          ? `AI Assistant is temporarily unavailable. ${err.message}`
          : 'AI Assistant is currently unavailable. You can still use RentHub normally.';
      return {
        success: false,
        data: {
          intent: 'UNKNOWN',
          message: devMessage,
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

  logger.info(`AI intent: ${intent.intent}`);

  // 4. Execute only allowlisted tools with the authenticated user context
  const ctx: ToolContext = {
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated: !!user,
  };

  const toolResult: ToolResult = await executeIntent(intent, ctx);
  logger.info(`AI tool: ${intent.intent} -> success=${toolResult.success}`);

  // 5. Build the safe response
  // Public intents never require login — the model sometimes incorrectly
  // sets requiresLogin=true for search/navigation intents. Override it.
  const PUBLIC_INTENTS = new Set([
    'SEARCH_PRODUCTS',
    'VIEW_PRODUCT',
    'VIEW_CATEGORIES',
    'GENERAL_HELP',
    'VIEW_HELP',
    'CHECK_AVAILABILITY',
    'UNKNOWN',
  ]);
  const requiresLogin = PUBLIC_INTENTS.has(intent.intent) ? false : intent.requiresLogin || false;

  return {
    success: toolResult.success,
    data: {
      intent: intent.intent,
      message: toolResult.message,
      products: (toolResult.data as { products?: unknown[] })?.products,
      navigation: toolResult.navigation,
      requiresLogin,
      requiresConfirmation: intent.requiresConfirmation || false,
    },
  };
}
