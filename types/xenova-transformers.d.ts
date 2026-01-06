// Type declarations for @xenova/transformers (optional dependency)
declare module '@xenova/transformers' {
    export function pipeline(
        task: string,
        model: string,
        options?: Record<string, unknown>
    ): Promise<{
        (input: string, options?: { pooling?: string; normalize?: boolean }): Promise<{
            data: Float32Array;
        }>;
    }>;
}
