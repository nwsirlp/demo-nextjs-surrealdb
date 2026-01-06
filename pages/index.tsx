import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/employees');
    }, [router]);
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-600">Redirecting...</p>
            </div>
        </div>
    );
}
