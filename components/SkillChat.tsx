import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader, Star, User, MessageCircle } from 'react-feather';
import type { CandidateMatch, ChatMessage } from '../constants/SkillTypes';
import CandidateCard from './CandidateCard';

type Props = {
    onResultsChange?: (results: CandidateMatch[]) => void;
};

// API chat history for context
type ApiMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export default function SkillChat({ onResultsChange }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'system',
            content: 'Hello! I\'m your AI assistant powered by Typhoon. Ask me to find employees with specific skills. Try: "I need someone who knows Python and machine learning" or "Who can help with React development?"',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<ApiMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        try {
            // Call the Typhoon AI API
            const chatResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: chatHistory,
                }),
            });
            
            if (!chatResponse.ok) {
                throw new Error('Failed to get AI response');
            }
            
            const chatData = await chatResponse.json();
            
            // Update chat history for context
            setChatHistory(prev => [
                ...prev.slice(-8), // Keep last 8 messages
                { role: 'user', content: userMessage.content },
                { role: 'assistant', content: chatData.message },
            ]);
            
            // Use candidates returned directly from the API (database search results)
            const searchResults: CandidateMatch[] = chatData.candidates || [];
            if (searchResults.length > 0) {
                onResultsChange?.(searchResults);
            }
            
            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: chatData.message,
                timestamp: new Date(),
                searchResults: searchResults.length > 0 ? searchResults : undefined,
            };
            
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, chatHistory, onResultsChange]);
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <div className="skill-chat">
            <div className="chat-header">
                <MessageCircle size={20} />
                <span>Typhoon AI Assistant</span>
                <div className="powered-by">Powered by Typhoon</div>
            </div>
            
            <div className="chat-messages">
                {messages.map(message => (
                    <div 
                        key={message.id} 
                        className={`chat-message ${message.role}`}
                    >
                        <div className="message-avatar">
                            {message.role === 'user' ? (
                                <User size={16} />
                            ) : (
                                <MessageCircle size={16} />
                            )}
                        </div>
                        <div className="message-content">
                            <p>{message.content}</p>
                            {message.searchResults && message.searchResults.length > 0 && (
                                <div className="search-results">
                                    <div className="results-header">
                                        <Star size={14} />
                                        <span>Found {message.searchResults.length} matching candidates:</span>
                                    </div>
                                    {message.searchResults.map((candidate, idx) => (
                                        <CandidateCard 
                                            key={candidate.employee.id} 
                                            candidate={candidate}
                                            rank={idx + 1}
                                            compact
                                        />
                                    ))}
                                </div>
                            )}
                            <span className="message-time">
                                {message.timestamp.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="chat-message assistant loading">
                        <div className="message-avatar">
                            <MessageCircle size={16} />
                        </div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about finding employees with specific skills..."
                    rows={1}
                    disabled={isLoading}
                />
                <button 
                    className="send-button"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? (
                        <Loader className="spinner" size={18} />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
            
            <style jsx>{`
                .skill-chat {
                    display: flex;
                    flex-direction: column;
                    height: 600px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .chat-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 16px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    font-weight: 600;
                    font-size: 1rem;
                }
                
                .powered-by {
                    margin-left: auto;
                    font-size: 0.75rem;
                    font-weight: 400;
                    color: rgba(255, 255, 255, 0.5);
                    background: rgba(255, 255, 255, 0.1);
                    padding: 4px 10px;
                    border-radius: 12px;
                }
                
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .chat-message {
                    display: flex;
                    gap: 12px;
                    max-width: 90%;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .chat-message.user {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }
                
                .chat-message.system,
                .chat-message.assistant {
                    align-self: flex-start;
                }
                
                .message-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .chat-message.user .message-avatar {
                    background: #4f46e5;
                    color: #fff;
                }
                
                .chat-message.system .message-avatar,
                .chat-message.assistant .message-avatar {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: #fff;
                }
                
                .message-content {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 12px 16px;
                    border-radius: 16px;
                    color: #e0e0e0;
                }
                
                .chat-message.user .message-content {
                    background: #4f46e5;
                    color: #fff;
                    border-bottom-right-radius: 4px;
                }
                
                .chat-message.assistant .message-content,
                .chat-message.system .message-content {
                    border-bottom-left-radius: 4px;
                }
                
                .message-content p {
                    margin: 0 0 8px 0;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }
                
                .message-time {
                    font-size: 0.7rem;
                    opacity: 0.6;
                }
                
                .search-results {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .results-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #fbbf24;
                    margin-bottom: 8px;
                }
                
                .typing-indicator {
                    display: flex;
                    gap: 4px;
                    padding: 4px 0;
                }
                
                .typing-indicator span {
                    width: 8px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                
                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                .typing-indicator span:nth-child(3) { animation-delay: 0s; }
                
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
                
                .spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .chat-input-container {
                    display: flex;
                    gap: 12px;
                    padding: 16px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .chat-input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #fff;
                    font-size: 0.95rem;
                    resize: none;
                    outline: none;
                    transition: all 0.2s ease;
                }
                
                .chat-input:focus {
                    border-color: #10b981;
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .chat-input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .chat-input:disabled {
                    opacity: 0.6;
                }
                
                .send-button {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .send-button:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
                }
                
                .send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
