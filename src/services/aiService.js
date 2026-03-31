// src/services/aiService.js
import OpenAI from 'openai';
import { examService } from './examService';


const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This is needed since we are running in the browser
});

const DEFAULT_MODEL = 'gpt-4o';

const cleanJsonResponse = (text) => {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
};

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const waitTime = baseDelay * Math.pow(2, i);
      console.warn(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

/**
 * Calls OpenAI Chat Completion API
 */
export const callGPT = async (prompt, options = {}) => {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature || 0.7;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        response_format: { type: "json_object" }
      });
    }, options.maxRetries || 3);

    const usage = response.usage;
    const modelRates = {
      'gpt-4o': { input: 5 / 1000000, output: 15 / 1000000 },
      'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.60 / 1000000 }
    };

    const rate = modelRates[model] || modelRates['gpt-4o'];
    const cost = (usage.prompt_tokens * rate.input) + (usage.completion_tokens * rate.output);

    const text = response.choices[0].message.content;
    const parsed = JSON.parse(cleanJsonResponse(text));
    
    // SYNC COST TO FIRESTORE
    if (cost > 0) {
      await examService.incrementTotalCost(cost);
    }
    
    return {
      data: parsed,
      usage: {
        total_tokens: usage.total_tokens,
        cost: cost,
        model: model
      }
    };
  } catch (error) {
    console.error(`AI Service Error (${model}):`, error.message);
    throw error;
  }
};
