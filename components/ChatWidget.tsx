import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader, Trash2, ChevronDown } from 'react-feather';
import { useAuthenticatedUser } from '../constants/Queries';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created?: string;
    isLoading?: boolean;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { data: user } = useAuthenticatedUser();
    
    // Get stored token
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('usersession') || '';
        }
        return '';
    };
    
    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);
    
    // Load chat history when widget opens
    useEffect(() => {
        if (isOpen && user && messages.length === 0) {
            loadHistory();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]);
    
    const loadHistory = async () => {
        const token = getToken();
        if (!token) return;
        
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/chat-history?limit=50', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map((m: Message) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        created: m.created
                    })));
                } else {
                    // Add welcome message if no history
                    setMessages([{
                        id: 'welcome',
                        role: 'assistant',
                        content: 'Hello! I can help you find employees with specific skills, build dream teams, or answer questions about your workforce. What would you like to know?'
                    }]);
                }
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };
    
    const saveMessage = async (role: 'user' | 'assistant', content: string) => {
        const token = getToken();
        if (!token) return;
        
        try {
            await fetch('/api/chat-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role, content })
            });
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    };
    
    const clearHistory = async () => {
        const token = getToken();
        if (!token) return;
        
        if (!confirm('Clear all chat history?')) return;
        
        try {
            await fetch('/api/chat-history', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'Chat cleared. How can I help you?'
            }]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };
    
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        // Save user message
        await saveMessage('user', userMessage.content);
        
        // Add loading indicator
        const loadingId = `loading-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: loadingId,
            role: 'assistant',
            content: '',
            isLoading: true
        }]);
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });
            
            if (!res.ok) throw new Error('Chat request failed');
            
            const data = await res.json();
            const assistantContent = data.message || 'I apologize, I could not process that request.';
            
            // Replace loading with actual response
            setMessages(prev => prev.map(m => 
                m.id === loadingId 
                    ? { id: `assistant-${Date.now()}`, role: 'assistant', content: assistantContent }
                    : m
            ));
            
            // Save assistant message
            await saveMessage('assistant', assistantContent);
            
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.map(m => 
                m.id === loadingId 
                    ? { id: `error-${Date.now()}`, role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
                    : m
            ));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    // Don't render if not authenticated
    if (!user) return null;
    
    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-6 z-50
                    w-14 h-14 rounded-full
                    bg-gradient-to-r from-indigo-600 to-purple-600
                    text-white shadow-lg
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    hover:scale-110 hover:shadow-xl
                    ${isOpen ? 'rotate-90 scale-90' : ''}
                `}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
            
            {/* Chat Popover */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} />
                            <span className="font-semibold">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearHistory}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title="Clear history"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-gray-50">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <Loader className="animate-spin mr-2" size={20} />
                                Loading history...
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                                            max-w-[85%] px-4 py-2.5 rounded-2xl
                                            ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-br-md'
                                                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                                            }
                                        `}
                                    >
                                        {msg.isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader className="animate-spin" size={16} />
                                                <span className="text-gray-500">Thinking...</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about skills, teams..."
                                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <Loader className="animate-spin" size={18} />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
