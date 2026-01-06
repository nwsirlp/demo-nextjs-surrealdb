/**
 * Embedding Provider Interface
 * 
 * Pluggable architecture for generating text embeddings.
 * Supports Mock (demo), Local (transformers.js), and OpenAI providers.
 */

export type EmbeddingProviderType = 'mock' | 'local' | 'openai' | 'ollama';

export interface EmbeddingProvider {
    name: string;
    dimensions: number;
    generate(text: string): Promise<number[]>;
    generateBatch(texts: string[]): Promise<number[][]>;
}

// Configuration for the embedding system
export interface EmbeddingConfig {
    provider: EmbeddingProviderType;
    openaiApiKey?: string;
    openaiModel?: string;
    localModelPath?: string;
    // Ollama configuration
    ollamaHost?: string;
    ollamaModel?: string;
    ollamaDimensions?: number;
    ollamaTimeout?: number;
}

// Default configuration - reads from environment variables
function getDefaultProvider(): EmbeddingProviderType {
    const binding = process.env.EMBEDDING_BINDING;
    if (binding === 'ollama') return 'ollama';
    if (binding === 'openai') return 'openai';
    if (binding === 'local') return 'local';
    return 'mock';
}

let currentConfig: EmbeddingConfig = {
    provider: getDefaultProvider(),
    ollamaHost: process.env.EMBEDDING_BINDING_HOST,
    ollamaModel: process.env.EMBEDDING_MODEL,
    ollamaDimensions: process.env.EMBEDDING_DIM ? parseInt(process.env.EMBEDDING_DIM) : undefined,
    ollamaTimeout: process.env.EMBEDDING_TIMEOUT ? parseInt(process.env.EMBEDDING_TIMEOUT) * 1000 : undefined,
};

/**
 * Set the embedding configuration
 */
export function setEmbeddingConfig(config: Partial<EmbeddingConfig>): void {
    currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current embedding configuration
 */
export function getEmbeddingConfig(): EmbeddingConfig {
    return { ...currentConfig };
}

// ==========================================
// MOCK PROVIDER (for demo purposes)
// ==========================================

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

const MockProvider: EmbeddingProvider = {
    name: 'Mock Embeddings',
    dimensions: 384, // Using smaller dimensions for mock
    
    async generate(text: string): Promise<number[]> {
        // Generate deterministic pseudo-random embedding based on text hash
        const seed = hashString(text.toLowerCase().trim());
        const random = seededRandom(seed);
        
        const embedding: number[] = [];
        for (let i = 0; i < this.dimensions; i++) {
            // Generate values between -1 and 1
            embedding.push((random() * 2) - 1);
        }
        
        // Normalize to unit vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / magnitude);
    },
    
    async generateBatch(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map(text => this.generate(text)));
    }
};

// ==========================================
// LOCAL PROVIDER (transformers.js)
// ==========================================

// Note: Requires @xenova/transformers package to be installed
// Since it's not installed, this provider falls back to mock
const LocalProvider: EmbeddingProvider = {
    name: 'Local Embeddings (transformers.js)',
    dimensions: 384, // all-MiniLM-L6-v2 dimensions
    
    async generate(text: string): Promise<number[]> {
        // @xenova/transformers is not installed, fall back to mock
        console.warn('Local embeddings: @xenova/transformers not installed, using mock');
        return MockProvider.generate(text);
    },
    
    async generateBatch(texts: string[]): Promise<number[][]> {
        return MockProvider.generateBatch(texts);
    }
};

// ==========================================
// OPENAI PROVIDER
// ==========================================

const OpenAIProvider: EmbeddingProvider = {
    name: 'OpenAI Embeddings',
    dimensions: 1536, // text-embedding-3-small default
    
    async generate(text: string): Promise<number[]> {
        const config = getEmbeddingConfig();
        
        if (!config.openaiApiKey) {
            console.warn('OpenAI API key not configured, falling back to mock');
            return MockProvider.generate(text);
        }
        
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: config.openaiModel || 'text-embedding-3-small',
                    input: text,
                }),
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            console.error('OpenAI embedding generation failed:', error);
            return MockProvider.generate(text);
        }
    },
    
    async generateBatch(texts: string[]): Promise<number[][]> {
        const config = getEmbeddingConfig();
        
        if (!config.openaiApiKey) {
            console.warn('OpenAI API key not configured, falling back to mock');
            return MockProvider.generateBatch(texts);
        }
        
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: config.openaiModel || 'text-embedding-3-small',
                    input: texts,
                }),
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            
            const data = await response.json();
            // Sort by index to maintain order
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.data.sort((a: any, b: any) => a.index - b.index).map((item: any) => item.embedding);
        } catch (error) {
            console.error('OpenAI batch embedding generation failed:', error);
            return MockProvider.generateBatch(texts);
        }
    }
};

// ==========================================
// OLLAMA PROVIDER
// ==========================================

const OllamaProvider: EmbeddingProvider = {
    name: 'Ollama Embeddings',
    dimensions: 1024, // Default for bge-m3, but configurable
    
    async generate(text: string): Promise<number[]> {
        const config = getEmbeddingConfig();
        const host = config.ollamaHost || process.env.EMBEDDING_BINDING_HOST || 'http://localhost:11434';
        const model = config.ollamaModel || process.env.EMBEDDING_MODEL || 'bge-m3:latest';
        const timeout = config.ollamaTimeout || parseInt(process.env.EMBEDDING_TIMEOUT || '300') * 1000;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`${host}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt: text,
                }),
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.embedding;
        } catch (error) {
            console.error('Ollama embedding generation failed:', error);
            return MockProvider.generate(text);
        }
    },
    
    async generateBatch(texts: string[]): Promise<number[][]> {
        // Ollama doesn't have a batch endpoint, so we process sequentially
        const embeddings: number[][] = [];
        for (const text of texts) {
            const embedding = await this.generate(text);
            embeddings.push(embedding);
        }
        return embeddings;
    }
};

// ==========================================
// PROVIDER FACTORY
// ==========================================

const providers: Record<EmbeddingProviderType, EmbeddingProvider> = {
    mock: MockProvider,
    local: LocalProvider,
    openai: OpenAIProvider,
    ollama: OllamaProvider,
};

/**
 * Get the current embedding provider based on configuration
 */
export function getEmbeddingProvider(): EmbeddingProvider {
    return providers[currentConfig.provider];
}

/**
 * Generate embedding for a single text using the configured provider
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const provider = getEmbeddingProvider();
    return provider.generate(text);
}

/**
 * Generate embeddings for multiple texts using the configured provider
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const provider = getEmbeddingProvider();
    return provider.generateBatch(texts);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Get embedding dimensions for the current provider
 */
export function getEmbeddingDimensions(): number {
    return getEmbeddingProvider().dimensions;
}
