import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Strip surrounding quotes from env values.
 * dotenv sometimes preserves them when values are quoted in .env files.
 */
function stripQuotes(val: string): string {
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

function env(key: string, fallback = ''): string {
  const raw = process.env[key] || fallback;
  return stripQuotes(raw);
}

export const config = {
  // Server
  port: parseInt(env('PORT', '5000'), 10),
  nodeEnv: env('NODE_ENV', 'development'),
  frontendUrl: env('FRONTEND_URL', 'http://localhost:3000'),

  // AI Provider
  ai: {
    provider: env('AI_PROVIDER', 'ollama') as 'ollama' | 'claude' | 'openai' | 'bedrock',
    ollama: {
      baseUrl: env('OLLAMA_BASE_URL', 'http://localhost:11434'),
      model: env('OLLAMA_MODEL', 'llama3'),
    },
    claude: {
      apiKey: env('CLAUDE_API_KEY'),
    },
    openai: {
      apiKey: env('OPENAI_API_KEY'),
    },
    bedrock: {
      apiKey: env('BEDROCK_API_KEY'),
      region: env('BEDROCK_REGION', 'us-east-1'),
      modelId: env('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0'),
    },
  },

  // Database
  mongodb: {
    uri: env('MONGODB_URI', 'mongodb://localhost:27017/resumeai'),
  },

  // Redis
  redis: {
    url: env('REDIS_URL'),
  },

  // Cloudinary
  cloudinary: {
    cloudName: env('CLOUDINARY_CLOUD_NAME'),
    apiKey: env('CLOUDINARY_API_KEY'),
    apiSecret: env('CLOUDINARY_API_SECRET'),
  },

  // Clerk
  clerk: {
    secretKey: env('CLERK_SECRET_KEY'),
    publishableKey: env('CLERK_PUBLISHABLE_KEY'),
  },
} as const;

// Log config on startup (mask secrets)
console.log('[Config] Loaded:', {
  port: config.port,
  nodeEnv: config.nodeEnv,
  aiProvider: config.ai.provider,
  aiModel: config.ai.provider === 'ollama' 
    ? config.ai.ollama.model 
    : (config.ai.provider === 'bedrock' ? config.ai.bedrock.modelId : 'cloud'),
  cloudinaryCloud: config.cloudinary.cloudName || '(not set)',
  clerkConfigured: !!config.clerk.secretKey,
});
