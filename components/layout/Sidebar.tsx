import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
    Users, 
    Zap, 
    GitBranch, 
    LogOut, 
    ChevronLeft, 
    ChevronRight,
    Lock,
    Unlock,
    Menu
} from 'react-feather';
import { useAuthenticatedUser, useSurrealSignout } from '../../constants/Queries';

// Navigation items
const navItems = [
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/project-ai', label: 'Project with AI', icon: Zap },
    { href: '/knowledge-graph', label: 'Knowledge Graph', icon: GitBranch },
];

export default function Sidebar() {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPinned, setIsPinned] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    
    const { isLoading: isUserLoading, data: user } = useAuthenticatedUser();
    const { mutate: signout } = useSurrealSignout({
        onSuccess: () => router.push('/signin'),
    });

    // Load pin state from localStorage
    useEffect(() => {
        const savedPinned = localStorage.getItem('sidebar-pinned');
        if (savedPinned !== null) {
            setIsPinned(savedPinned === 'true');
            setIsExpanded(savedPinned === 'true');
        }
    }, []);

    // Save pin state to localStorage
    const togglePin = () => {
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        setIsExpanded(newPinned);
        localStorage.setItem('sidebar-pinned', String(newPinned));
    };

    // Handle hover expand when unpinned
    const handleMouseEnter = () => {
        setIsHovering(true);
        if (!isPinned) setIsExpanded(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (!isPinned) setIsExpanded(false);
    };

    // Don't show sidebar on auth pages
    if (router.pathname === '/signin' || router.pathname === '/signup') {
        return null;
    }

    const sidebarWidth = isExpanded ? 'w-60' : 'w-16';

    return (
        <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                fixed left-0 top-0 h-screen bg-slate-900 text-white
                flex flex-col z-50 transition-all duration-300 ease-in-out
                ${sidebarWidth}
            `}
        >
            {/* Logo/Header */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                    <Image
                        src="/icon.svg"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="flex-shrink-0"
                    />
                    {isExpanded && (
                        <span className="font-bold text-lg whitespace-nowrap">
                            SurrealDB
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = router.pathname === item.href;
                        const Icon = item.icon;
                        
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                                        transition-all duration-200
                                        ${isActive 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                    title={!isExpanded ? item.label : undefined}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    {isExpanded && (
                                        <span className="whitespace-nowrap overflow-hidden">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Pin/Collapse Controls */}
            <div className="px-2 py-2 border-t border-slate-800">
                <button
                    onClick={togglePin}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        text-slate-400 hover:bg-slate-800 hover:text-white
                        transition-colors duration-200
                    `}
                    title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                >
                    {isPinned ? (
                        <Unlock size={18} className="flex-shrink-0" />
                    ) : (
                        <Lock size={18} className="flex-shrink-0" />
                    )}
                    {isExpanded && (
                        <span className="whitespace-nowrap text-sm">
                            {isPinned ? 'Unpin' : 'Pin'} sidebar
                        </span>
                    )}
                </button>
            </div>

            {/* User section */}
            <div className="px-2 py-3 border-t border-slate-800">
                {isUserLoading ? (
                    <div className="px-3 py-2 text-slate-500 text-sm">
                        Loading...
                    </div>
                ) : user ? (
                    <div className="space-y-2">
                        {isExpanded && (
                            <div className="px-3 py-1">
                                <p className="text-sm font-medium text-white truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    @{user.username}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => signout()}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                text-red-400 hover:bg-red-500/10 hover:text-red-300
                                transition-colors duration-200
                            `}
                            title="Sign out"
                        >
                            <LogOut size={18} className="flex-shrink-0" />
                            {isExpanded && (
                                <span className="whitespace-nowrap text-sm">
                                    Sign out
                                </span>
                            )}
                        </button>
                    </div>
                ) : null}
            </div>
        </aside>
    );
}
