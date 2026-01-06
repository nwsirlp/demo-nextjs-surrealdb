import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from '../components/layout/Sidebar';
import AuthGuard from '../components/AuthGuard';
import ChatWidget from '../components/ChatWidget';
import Head from '../components/Head';
import '../styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
    const [sidebarPinned, setSidebarPinned] = useState(true);

    // Listen for sidebar pin state changes
    useEffect(() => {
        const checkPinState = () => {
            const pinned = localStorage.getItem('sidebar-pinned');
            setSidebarPinned(pinned !== 'false');
        };
        
        checkPinState();
        window.addEventListener('storage', checkPinState);
        
        // Check periodically for changes (localStorage events don't fire in same tab)
        const interval = setInterval(checkPinState, 500);
        
        return () => {
            window.removeEventListener('storage', checkPinState);
            clearInterval(interval);
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {/* Nested head elements will overwrite this */}
            <Head />
            <AuthGuard>
                <div className="flex min-h-screen bg-slate-50">
                    <Sidebar />
                    <main 
                        className={`
                            flex-1 transition-all duration-300
                            ${sidebarPinned ? 'ml-60' : 'ml-16'}
                        `}
                    >
                        <Component {...pageProps} />
                    </main>
                    <ChatWidget />
                </div>
            </AuthGuard>
        </QueryClientProvider>
    );
}
