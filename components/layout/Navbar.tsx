import Image from 'next/image';
import React from 'react';
import {
    useAuthenticatedUser,
    useSurrealSignout,
} from '../../constants/Queries';
import Link from 'next/link';
import Button from '../form/Button';
import { User, LogOut, FileText, Users, MessageCircle, GitBranch, Zap } from 'react-feather';
import { useRouter } from 'next/router';

// Tab configuration
const tabs = [
    // { href: '/', label: 'Posts', icon: FileText },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/project-ai', label: 'Project with AI', icon: Zap },
    { href: '/knowledge-graph', label: 'Knowledge Graph', icon: GitBranch },
];

export default function Navbar() {
    const router = useRouter();
    const { isLoading: isUserLoading, data: user } = useAuthenticatedUser();
    const { mutate: signout } = useSurrealSignout({
        onSuccess: () => router.push('/signin'),
    });

    // Don't show navbar on auth pages
    if (router.pathname === '/signin' || router.pathname === '/signup') {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 w-screen z-40">
            <div className="bg-white pt-4 mx-4 rounded-b-xl">
                {/* Top bar with logo and user info */}
                <div className="h-16 px-6 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-t-xl flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo-full.svg"
                            alt="Logo"
                            width={160}
                            height={40}
                        />
                    </Link>
                    
                    {!isUserLoading && user && (
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-white/90">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                <span className="font-medium">{user.name}</span>
                            </div>
                            <Button 
                                onClick={() => signout()}
                                className="!bg-white/10 hover:!bg-white/20 !text-white !border-0 flex items-center gap-2"
                            >
                                <LogOut size={16} />
                                Sign out
                            </Button>
                        </div>
                    )}
                </div>
                
                {/* Tab navigation */}
                <div className="h-12 px-4 bg-neutral-100 rounded-b-xl flex items-center gap-1">
                    {tabs.map((tab) => {
                        const isActive = router.pathname === tab.href || 
                            (tab.href !== '/' && router.pathname.startsWith(tab.href));
                        const Icon = tab.icon;
                        
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                                    ${isActive 
                                        ? 'bg-white text-neutral-900 shadow-sm' 
                                        : 'text-neutral-600 hover:bg-white/50 hover:text-neutral-800'
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
