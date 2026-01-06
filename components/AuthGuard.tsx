import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticatedUser } from '../constants/Queries';

interface AuthGuardProps {
    children: React.ReactNode;
}

// Pages that don't require authentication
const publicPages = ['/signin', '/signup'];

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const { data: user, isLoading } = useAuthenticatedUser();

    useEffect(() => {
        // Skip if still loading or on a public page
        if (isLoading) return;
        if (publicPages.includes(router.pathname)) return;

        // Redirect to signin if not authenticated
        if (!user) {
            router.push('/signin');
        }
    }, [user, isLoading, router]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
                    <p className="text-neutral-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Allow public pages to render without auth
    if (publicPages.includes(router.pathname)) {
        return <>{children}</>;
    }

    // Don't render protected content if not authenticated (will redirect)
    if (!user) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
                    <p className="text-neutral-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // User is authenticated, render the protected content
    return <>{children}</>;
}
