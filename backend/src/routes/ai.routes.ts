import { Router } from 'express';
import { callAI } from '../services/ai/ai.provider';
import { optionalAuth } from '../middleware';

const router = Router();

// Apply optionalAuth so developers can test easily from a browser or Postman without full login,
// but still tracking auth context if active.
router.get('/test', optionalAuth, async (req, res, next) => {
  const startTime = Date.now();
  const testPrompt = 'Respond with exactly the phrase: "AI connection test successful!" and absolutely nothing else. Do not add punctuation, formatting, or introduction.';
  const systemPrompt = 'You are a system diagnostic tool. Follow instructions exactly.';

  try {
    console.log('[AI Diagnostics] Running connectivity test...');
    
    // Call the active AI provider configured in your .env
    const response = await callAI(testPrompt, systemPrompt, {
      maxTokens: 50,
      temperature: 0.1
    });

    const latencyMs = Date.now() - startTime;
    console.log(`[AI Diagnostics] Test succeeded in ${latencyMs}ms using provider: ${response.provider}`);

    res.json({
      success: true,
      message: 'AI provider is connected and responding correctly.',
      provider: response.provider,
      model: response.model,
      latencyMs,
      tokensUsed: response.tokensUsed,
      rawResponse: response.content.trim()
    });

  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error(`[AI Diagnostics] Test failed after ${latencyMs}ms:`, error.message);

    res.status(500).json({
      success: false,
      message: 'AI provider failed to respond.',
      latencyMs,
      error: error.message,
      tip: error.message.includes('Access Denied')
        ? 'Please check your AWS console and request model access for the configured model.'
        : error.message.includes('Validation')
        ? 'Please check if your BEDROCK_MODEL_ID or BEDROCK_REGION is supported.'
        : 'Double-check your API key and network connection.'
    });
  }
});

export default router;
