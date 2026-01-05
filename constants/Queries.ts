import { useMutation, useQuery } from '@tanstack/react-query';
import {
    SurrealInstance as surreal,
    SurrealSignin,
    SurrealSignout,
    SurrealSignup,
} from '../lib/Surreal';
import {
    type Post,
    type PostID,
    type PostInput,
    type SigninDetails,
    type SignupDetails,
    type User,
    type UserID,
} from './Types';
import {
    processPostRecord,
    processUserRecord,
} from '../lib/ProcessDatabaseRecord';

// Contains wrapper react-query functions to make them easily reusable.

// Helper to extract data from surrealdb v2 query result
// In v2, query() returns an array where each element corresponds to a statement result
// For a single statement query, result[0] contains the data directly (not wrapped in {result: ...})
function extractQueryResult<T>(result: unknown): T[] {
    // Handle both old format [{result: [...]}] and new format [[...]]
    if (Array.isArray(result) && result.length > 0) {
        const first = result[0];
        // Check if it's old format with .result property
        if (first && typeof first === 'object' && 'result' in first) {
            return (first as { result: T[] }).result ?? [];
        }
        // New format - first element is the array of results directly
        if (Array.isArray(first)) {
            return first as T[];
        }
        // Single object result
        if (first && typeof first === 'object') {
            return [first as T];
        }
    }
    return [];
}

export function useAuthenticatedUser() {
    return useQuery({
        queryKey: ['authenticated-user'],
        queryFn: async (): Promise<User | null> => {
            try {
                const result = await surreal.query<[User[]]>(
                    `SELECT * FROM user WHERE id = $auth.id`
                );
                const data = extractQueryResult<User>(result);
                return data.map(processUserRecord).find((a) => !!a) ?? null;
            } catch (error) {
                console.error('Failed to get authenticated user:', error);
                return null;
            }
        },
    });
}

export function useSurrealSignin({
    onSuccess,
    onFailure,
}: {
    onSuccess?: () => unknown;
    onFailure?: () => unknown;
}) {
    const { refetch } = useAuthenticatedUser();
    return useMutation({
        mutationFn: async (auth: SigninDetails) => {
            if (await SurrealSignin(auth)) {
                refetch();
                onSuccess?.();
            } else {
                onFailure?.();
            }
        },
    });
}

export function useSurrealSignup({
    onSuccess,
    onFailure,
}: {
    onSuccess?: () => unknown;
    onFailure?: () => unknown;
}) {
    const { refetch } = useAuthenticatedUser();
    return useMutation({
        mutationFn: async (auth: SignupDetails) => {
            if (await SurrealSignup(auth)) {
                refetch();
                onSuccess?.();
            } else {
                onFailure?.();
            }
        },
    });
}

export function useSurrealSignout({
    onSuccess,
}: {
    onSuccess?: () => unknown;
}) {
    const { refetch } = useAuthenticatedUser();
    return useMutation({
        mutationFn: async () => {
            await SurrealSignout();
            refetch();
            onSuccess?.();
        },
    });
}

////////////////////////
//////// POSTS /////////
////////////////////////

export function usePosts<TAuthorType extends UserID | User>({
    author,
    fetchAuthor,
}: {
    author?: UserID;
    fetchAuthor: TAuthorType extends User ? true : false;
}) {
    return useQuery({
        queryKey: ['posts'],
        queryFn: async (): Promise<Post<TAuthorType>[]> => {
            try {
                const result = await surreal.query<[Post<TAuthorType>[]]>(
                    `SELECT * FROM post ${
                        author ? 'WHERE author = $author' : ''
                    } ORDER BY created DESC ${fetchAuthor ? 'FETCH author' : ''}`,
                    { author }
                );
                const data = extractQueryResult<Post<TAuthorType>>(result);
                return data.map((post) => processPostRecord<TAuthorType>(post));
            } catch (error) {
                console.error('Failed to fetch posts:', error);
                return [];
            }
        },
    });
}

export function usePost<TAuthorType extends UserID | User>({
    id,
    fetchAuthor,
}: {
    id?: PostID;
    fetchAuthor: TAuthorType extends User ? true : false;
}) {
    return useQuery({
        queryKey: ['post', id],
        queryFn: async (): Promise<Post<TAuthorType> | null> => {
            if (!id) return null;
            try {
                const result = await surreal.query<[Post<TAuthorType>[]]>(
                    `SELECT * FROM post WHERE id = $id ${
                        fetchAuthor ? 'FETCH author' : ''
                    }`,
                    { id }
                );
                const data = extractQueryResult<Post<TAuthorType>>(result);
                if (!data[0]) return null;
                return processPostRecord<TAuthorType>(data[0]);
            } catch (error) {
                console.error('Failed to fetch post:', error);
                return null;
            }
        },
    });
}

export function useCreatePost({
    onCreated,
}: {
    onCreated: (post: Post<UserID>) => unknown;
}) {
    return useMutation({
        mutationFn: async (post: PostInput) => {
            const result = await surreal.query<[Post<UserID>[]]>(
                `CREATE post CONTENT {
                title: $title,
                body: $body
            }`,
                post
            );

            const data = extractQueryResult<Post<UserID>>(result);
            if (data[0]) {
                onCreated(data[0]);
            } else {
                throw new Error('Failed to create post');
            }
        },
    });
}

export function useUpdatePost({
    id,
    onUpdated,
}: {
    id?: PostID;
    onUpdated?: (post: Post<UserID>) => unknown;
}) {
    return useMutation({
        mutationFn: async (post: PostInput) => {
            if (!id) return null;
            const result = await surreal.query<[Post[]]>(
                `UPDATE post CONTENT {
                title: $title,
                body: $body
            } WHERE id = $id`,
                {
                    id,
                    ...post,
                }
            );

            const data = extractQueryResult<Post>(result);
            if (data[0]) {
                onUpdated?.(data[0]);
            } else {
                throw new Error('Failed to update post');
            }
        },
    });
}

export function useRemovePost({
    id,
    onRemoved,
}: {
    id: PostID;
    onRemoved?: (id: PostID) => unknown;
}) {
    return useMutation({
        mutationFn: async () => {
            await surreal.query<[Post[]]>(
                `DELETE post WHERE id = $id`,
                { id }
            );
            onRemoved?.(id);
        },
    });
}

export function useUser({ id }: { id?: UserID }) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: async (): Promise<User | null> => {
            if (!id) return null;
            try {
                const result = await surreal.query<[User[]]>(
                    `SELECT * FROM user WHERE id = $id`,
                    { id }
                );
                const data = extractQueryResult<User>(result);
                if (!data[0]) return null;
                return processUserRecord(data[0]);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                return null;
            }
        },
    });
}
