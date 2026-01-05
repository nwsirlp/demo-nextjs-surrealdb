import type { NextApiRequest, NextApiResponse } from 'next';
import Surreal from 'surrealdb';

// Server-side SurrealDB configuration
const SurrealEndpoint = process.env.SURREAL_ENDPOINT ?? 'http://localhost:8000/rpc';
const SurrealNamespace = process.env.SURREAL_NAMESPACE ?? 'test';
const SurrealDatabase = process.env.SURREAL_DATABASE ?? 'test';
const SurrealRootUser = process.env.SURREAL_ROOT_USER ?? 'root';
const SurrealRootPass = process.env.SURREAL_ROOT_PASS ?? 'root';

type ResponseData = {
    success: boolean;
    message: string;
    info?: {
        endpoint: string;
        namespace: string;
        database: string;
    };
    error?: string;
    timestamp: string;
};

/**
 * API Route to test SurrealDB connection
 * 
 * GET /api/test-db
 * 
 * Returns connection status and server info
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
            timestamp: new Date().toISOString(),
        });
    }

    try {
        const db = new Surreal();
        
        // Connect to SurrealDB
        await db.connect(SurrealEndpoint);
        
        // Sign in as root user
        await db.signin({
            username: SurrealRootUser,
            password: SurrealRootPass,
        });
        
        // Select namespace and database
        await db.use({ namespace: SurrealNamespace, database: SurrealDatabase });
        
        // Run a simple query to verify connection
        await db.query('INFO FOR DB');
        
        await db.close();
        
        return res.status(200).json({
            success: true,
            message: 'Successfully connected to SurrealDB!',
            info: {
                endpoint: SurrealEndpoint,
                namespace: SurrealNamespace,
                database: SurrealDatabase,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to connect to SurrealDB',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
    }
}

