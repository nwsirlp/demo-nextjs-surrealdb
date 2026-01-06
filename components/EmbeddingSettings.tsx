import React, { useState, useEffect } from 'react';
import { Settings, Check, Zap, Cloud, Cpu } from 'react-feather';
import { 
    setEmbeddingConfig, 
    getEmbeddingConfig, 
    type EmbeddingProviderType 
} from '../lib/EmbeddingProvider';

type Props = {
    onConfigChange?: () => void;
};

export default function EmbeddingSettings({ onConfigChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [provider, setProvider] = useState<EmbeddingProviderType>('mock');
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    
    useEffect(() => {
        const config = getEmbeddingConfig();
        setProvider(config.provider);
        setApiKey(config.openaiApiKey || '');
    }, []);
    
    const handleSave = () => {
        setEmbeddingConfig({
            provider,
            openaiApiKey: apiKey || undefined,
        });
        setSaved(true);
        onConfigChange?.();
        setTimeout(() => setSaved(false), 2000);
    };
    
    const providers: { id: EmbeddingProviderType; name: string; icon: React.ReactNode; desc: string }[] = [
        { 
            id: 'mock', 
            name: 'Mock', 
            icon: <Zap size={18} />,
            desc: 'Fast, deterministic, for demo purposes'
        },
        { 
            id: 'local', 
            name: 'Local', 
            icon: <Cpu size={18} />,
            desc: 'Runs in browser via transformers.js'
        },
        { 
            id: 'openai', 
            name: 'OpenAI', 
            icon: <Cloud size={18} />,
            desc: 'Best quality, requires API key'
        },
    ];
    
    return (
        <div className="embedding-settings">
            <button 
                className="settings-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Embedding Settings"
            >
                <Settings size={18} />
            </button>
            
            {isOpen && (
                <div className="settings-panel">
                    <h4>Embedding Provider</h4>
                    
                    <div className="providers">
                        {providers.map(p => (
                            <button
                                key={p.id}
                                className={`provider-btn ${provider === p.id ? 'active' : ''}`}
                                onClick={() => setProvider(p.id)}
                            >
                                {p.icon}
                                <div className="provider-info">
                                    <span className="provider-name">{p.name}</span>
                                    <span className="provider-desc">{p.desc}</span>
                                </div>
                                {provider === p.id && <Check size={16} className="check" />}
                            </button>
                        ))}
                    </div>
                    
                    {provider === 'openai' && (
                        <div className="api-key-section">
                            <label>OpenAI API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                            />
                        </div>
                    )}
                    
                    <button className="save-btn" onClick={handleSave}>
                        {saved ? (
                            <>
                                <Check size={16} />
                                Saved!
                            </>
                        ) : (
                            'Save Settings'
                        )}
                    </button>
                </div>
            )}
            
            <style jsx>{`
                .embedding-settings {
                    position: relative;
                }
                
                .settings-toggle {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                    padding: 10px;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .settings-toggle:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: #fff;
                }
                
                .settings-panel {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    background: linear-gradient(145deg, #1e293b, #0f172a);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    padding: 20px;
                    min-width: 300px;
                    z-index: 100;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                    animation: slideIn 0.2s ease;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .settings-panel h4 {
                    margin: 0 0 16px 0;
                    font-size: 0.9rem;
                    color: #fff;
                    font-weight: 600;
                }
                
                .providers {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .provider-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: rgba(255, 255, 255, 0.8);
                    text-align: left;
                }
                
                .provider-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .provider-btn.active {
                    background: rgba(99, 102, 241, 0.2);
                    border-color: #6366f1;
                }
                
                .provider-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .provider-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #fff;
                }
                
                .provider-desc {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-top: 2px;
                }
                
                .check {
                    color: #6366f1;
                }
                
                .api-key-section {
                    margin-bottom: 16px;
                }
                
                .api-key-section label {
                    display: block;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 8px;
                }
                
                .api-key-section input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    padding: 10px 12px;
                    color: #fff;
                    font-size: 0.85rem;
                    outline: none;
                }
                
                .api-key-section input:focus {
                    border-color: #6366f1;
                }
                
                .save-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    border-radius: 10px;
                    padding: 12px;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .save-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                }
            `}</style>
        </div>
    );
}
