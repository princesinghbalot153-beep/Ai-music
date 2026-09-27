import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI();

// Enhance prompt endpoint using Gemini
app.post('/api/music/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { idea, genre, mood, tempo } = req.body;
    if (!idea && !genre) {
      return res.status(400).json({ error: 'Please provide an idea or genre' });
    }

    const promptEnhance = `You are a world-class music producer and audio engineer prompting Google DeepMind's Lyria music generation model.
Transform the following basic user idea into a vivid, acoustically descriptive prompt (maximum 40 words) that describes:
1. Genre & subgenre
2. Core instrumentation (e.g. analog synths, warm Rhodes, 808 subs, brushed acoustic drums)
3. Rhythm & Tempo (${tempo || 120} BPM)
4. Mood/Atmosphere (${mood || 'uplifting'})
5. Production mixing texture (e.g. vinyl crackle, lush stereo reverb, tape saturation)

User idea: "${idea || genre || 'Ambient beat'}"
Style context: Genre: ${genre || 'any'}, Mood: ${mood || 'any'}

Respond with ONLY the enhanced prompt string. No quotes, no explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptEnhance,
    });

    const enhanced = response.text?.trim() || idea;
    res.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to enhance prompt' });
  }
});

// Generate music endpoint calling Lyria models
app.post('/api/music/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'lyria-3-clip-preview',
      genre,
      mood,
      tempo,
      duration = 15,
      instruments = [],
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Ensure model is valid
    const targetModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    // Construct enriched input prompt for Lyria
    let fullPrompt = prompt.trim();
    const details: string[] = [];
    if (genre) details.push(`Genre: ${genre}`);
    if (mood) details.push(`Mood: ${mood}`);
    if (tempo) details.push(`${tempo} BPM`);
    if (instruments && instruments.length > 0) details.push(`Instruments: ${instruments.join(', ')}`);
    if (duration) details.push(`Duration: ${duration}s`);

    if (details.length > 0) {
      fullPrompt = `${fullPrompt}. [${details.join(' | ')}]`;
    }

    console.log(`[Lyria API] Calling model "${targetModel}" with prompt: "${fullPrompt}"`);

    // Call Interactions API with Lyria
    const interaction: any = await ai.interactions.create({
      model: targetModel,
      input: fullPrompt,
    });

    console.log(`[Lyria API] Response received. Keys:`, Object.keys(interaction || {}));

    let audioData: string | null = null;
    let mimeType = 'audio/mp3';
    let audioUri: string | null = null;

    if (interaction.output_audio) {
      audioData = interaction.output_audio.data || null;
      mimeType = interaction.output_audio.mime_type || 'audio/mp3';
      audioUri = interaction.output_audio.uri || null;
    } else if (Array.isArray(interaction.steps)) {
      for (const step of interaction.steps) {
        if (Array.isArray(step.content)) {
          for (const item of step.content) {
            if (item.type === 'audio') {
              audioData = item.data || null;
              mimeType = item.mime_type || mimeType;
              audioUri = item.uri || null;
              break;
            }
          }
        }
        if (audioData || audioUri) break;
      }
    }

    if (!audioData && !audioUri) {
      // In case output structure differs
      console.warn('[Lyria API] No audio payload found in response structure:', JSON.stringify(interaction).slice(0, 500));
      return res.status(502).json({
        error: 'NO_AUDIO_OUTPUT',
        message: 'The model completed without generating audio output.',
        raw: interaction,
      });
    }

    const audioUrl = audioData
      ? `data:${mimeType};base64,${audioData}`
      : audioUri;

    res.json({
      success: true,
      id: interaction.id || `trk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      model: targetModel,
      prompt: fullPrompt,
      originalPrompt: prompt,
      audioUrl,
      mimeType,
      duration: duration || (targetModel === 'lyria-3-clip-preview' ? 15 : 60),
      createdAt: new Date().toISOString(),
      metadata: {
        genre,
        mood,
        tempo,
        instruments,
      },
    });
  } catch (error: any) {
    console.error('[Lyria API Error]:', error);

    const errorMessage = error?.message || 'Unknown error occurred during music generation';
    const isRateLimit =
      errorMessage.includes('Rate limit') ||
      errorMessage.includes('Free Tier') ||
      errorMessage.includes('limit: 0') ||
      error?.status === 429;

    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      error: isRateLimit ? 'RATE_LIMIT_FREE_TIER' : 'GENERATION_FAILED',
      message: errorMessage,
      upgradeUrl: 'https://ai.dev/rate-limit',
    });
  }
});

// App info endpoint
app.get('/api/info', (_req: Request, res: Response) => {
  res.json({
    appName: 'Lyria Music Studio',
    models: [
      {
        id: 'lyria-3-clip-preview',
        name: 'Lyria 3 Clip Preview',
        description: 'Ultra-fast music loops, stems, hooks, and short tracks up to 30 seconds',
        maxDuration: 30,
        recommended: true,
      },
      {
        id: 'lyria-3-pro-preview',
        name: 'Lyria 3 Pro Preview',
        description: 'Full-length high-fidelity musical compositions and arrangements',
        maxDuration: 180,
        recommended: false,
      },
    ],
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Lyria Music Studio backend running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
