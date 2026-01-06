import type { NextApiRequest, NextApiResponse } from 'next';
import Surreal from 'surrealdb';

interface Message {
    id: string;
    user: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, unknown>;
    created: string;
}

// Create authenticated SurrealDB connection using user token
async function getAuthenticatedDB(token: string): Promise<Surreal> {
    const db = new Surreal();
    const endpoint = process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? 'http://localhost:8000/rpc';
    const namespace = process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? 'test';
    const database = process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? 'test';
    
    await db.connect(endpoint);
    await db.use({ namespace, database });
    await db.authenticate(token);
    
    return db;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Get auth token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.usersession;
    
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = await getAuthenticatedDB(token);

        switch (req.method) {
            case 'GET': {
                // Fetch user's chat history (RLS ensures only their messages)
                const limit = parseInt(req.query.limit as string) || 50;
                const result = await db.query<[Message[]]>(
                    'SELECT * FROM message ORDER BY created ASC LIMIT $limit',
                    { limit }
                );
                
                let messages: Message[] = [];
                if (Array.isArray(result) && result.length > 0) {
                    const data = result[0];
                    if (Array.isArray(data)) {
                        messages = data;
                    }
                }
                
                await db.close();
                return res.status(200).json({ messages });
            }

            case 'POST': {
                // Save a new message
                const { role, content, metadata } = req.body;
                
                if (!role || !content) {
                    return res.status(400).json({ error: 'role and content are required' });
                }

                // Get current user ID
                const userResult = await db.query<[{ id: string }[]]>(
                    'SELECT id FROM $auth'
                );
                
                let userId = '';
                if (Array.isArray(userResult) && userResult.length > 0) {
                    const data = userResult[0];
                    if (Array.isArray(data) && data.length > 0) {
                        userId = String(data[0].id);
                    }
                }
                
                if (!userId) {
                    await db.close();
                    return res.status(401).json({ error: 'Could not determine user' });
                }

                const createResult = await db.query<[Message[]]>(`
                    CREATE message CONTENT {
                        user: $userId,
                        role: $role,
                        content: $content,
                        metadata: $metadata
                    }
                `, { userId, role, content, metadata: metadata || null });
                
                let newMessage: Message | null = null;
                if (Array.isArray(createResult) && createResult.length > 0) {
                    const data = createResult[0];
                    if (Array.isArray(data) && data.length > 0) {
                        newMessage = data[0];
                    }
                }
                
                await db.close();
                return res.status(201).json({ message: newMessage });
            }

            case 'DELETE': {
                // Clear all user's chat history
                await db.query('DELETE message');
                await db.close();
                return res.status(200).json({ success: true });
            }

            default:
                await db.close();
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Chat history API error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
