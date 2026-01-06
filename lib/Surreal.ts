import Surreal from 'surrealdb';
import { type SigninDetails, type SignupDetails } from '../constants/Types';

// Define connection details for our surrealdb instance.
export const SurrealEndpoint =
    process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? `http://localhost:8000/rpc`;
export const SurrealNamespace =
    process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? 'test';
export const SurrealDatabase =
    process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? 'test';

// Create a singleton instance
let surrealInstance: Surreal | null = null;

export const getSurrealInstance = async (): Promise<Surreal> => {
    if (!surrealInstance) {
        surrealInstance = new Surreal();
        await surrealInstance.connect(SurrealEndpoint);
        await surrealInstance.use({ namespace: SurrealNamespace, database: SurrealDatabase });
        
        // Restore user session from localStorage if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('usersession');
            if (token) {
                try {
                    await surrealInstance.authenticate(token);
                } catch {
                    localStorage.removeItem('usersession');
                }
            }
        }
    }
    return surrealInstance;
};

// For backward compatibility
export const SurrealInstance = {
    async query<T>(sql: string, vars?: Record<string, unknown>): Promise<T> {
        const db = await getSurrealInstance();
        return db.query(sql, vars) as Promise<T>;
    },
    async signin(params: Record<string, unknown>): Promise<string> {
        const db = await getSurrealInstance();
        return db.signin(params as Parameters<typeof db.signin>[0]);
    },
    async signup(params: Record<string, unknown>): Promise<string> {
        const db = await getSurrealInstance();
        return db.signup(params as Parameters<typeof db.signup>[0]);
    },
    async invalidate(): Promise<void> {
        const db = await getSurrealInstance();
        await db.invalidate();
    },
    async authenticate(token: string): Promise<void> {
        const db = await getSurrealInstance();
        await db.authenticate(token);
    },
};

// Opiniated wrapper function for this DB schema.
// Also stores the user token in localStorage.
export const SurrealSignin = async (auth: SigninDetails): Promise<boolean> =>
    new Promise((resolve) => {
        getSurrealInstance().then(async (db) => {
            db.signin({
                namespace: SurrealNamespace,
                database: SurrealDatabase,
                access: 'user',
                variables: {
                    username: auth.username,
                    password: auth.password,
                },
            })
                .then(async (res) => {
                    if (!res) throw new Error('Did not receive token');
                    localStorage.setItem('usersession', res);
                    resolve(true);
                })
                .catch((error) => {
                    console.error('Failed to authenticate:', error);
                    resolve(false);
                });
        });
    });

// Opiniated wrapper function for this DB schema.
// Also stores the user token in localStorage.
export const SurrealSignup = async (auth: SignupDetails): Promise<boolean> =>
    new Promise((resolve) => {
        getSurrealInstance().then(async (db) => {
            db.signup({
                namespace: SurrealNamespace,
                database: SurrealDatabase,
                access: 'user',
                variables: {
                    name: auth.name,
                    username: auth.username,
                    password: auth.password,
                },
            })
                .then(async (res) => {
                    localStorage.setItem('usersession', res);
                    resolve(true);
                })
                .catch((error) => {
                    console.error('Failed to register:', error);
                    resolve(false);
                });
        });
    });

// Opiniated wrapper function for this DB schema.
// Also removes the user token from localStorage.
export const SurrealSignout = async (): Promise<boolean> =>
    new Promise((resolve) => {
        getSurrealInstance().then(async (db) => {
            db.invalidate()
                .then(async () => {
                    localStorage.removeItem('usersession');
                    resolve(false);
                })
                .catch((error) => {
                    console.error(error);
                    resolve(true);
                });
        });
    });
