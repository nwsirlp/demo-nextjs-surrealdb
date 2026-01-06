import type { NextApiRequest, NextApiResponse } from 'next';
import { generateEmbedding, setEmbeddingConfig, getEmbeddingProvider } from '../../lib/EmbeddingProvider';

type EmbedRequest = {
    text?: string;
    texts?: string[];
    provider?: 'mock' | 'local' | 'openai';
    openaiApiKey?: string;
};

type EmbedResponse = {
    embeddings?: number[][];
    provider: string;
    dimensions: number;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<EmbedResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed', 
            provider: '', 
            dimensions: 0 
        });
    }
    
    try {
        const { text, texts, provider, openaiApiKey } = req.body as EmbedRequest;
        
        // Configure provider if specified
        if (provider) {
            setEmbeddingConfig({
                provider,
                openaiApiKey: openaiApiKey || process.env.OPENAI_API_KEY,
            });
        }
        
        const currentProvider = getEmbeddingProvider();
        
        // Generate embeddings
        const inputTexts = texts || (text ? [text] : []);
        
        if (inputTexts.length === 0) {
            return res.status(400).json({
                error: 'No text provided. Send "text" or "texts" in request body.',
                provider: currentProvider.name,
                dimensions: currentProvider.dimensions,
            });
        }
        
        const embeddings = await Promise.all(
            inputTexts.map(t => generateEmbedding(t))
        );
        
        return res.status(200).json({
            embeddings,
            provider: currentProvider.name,
            dimensions: currentProvider.dimensions,
        });
    } catch (error) {
        console.error('Embedding generation error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: '',
            dimensions: 0,
        });
    }
}
