import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Users, Grid, Zap, RefreshCw, Check, AlertCircle, ArrowLeft } from 'react-feather';
import SkillChat from '../components/SkillChat';
import SkillBrowser from '../components/SkillBrowser';
import EmbeddingSettings from '../components/EmbeddingSettings';
import CandidateCard from '../components/CandidateCard';
import { 
    useSkills, 
    useDepartments,
    useGenerateSkillEmbeddings,
    useGenerateEmployeeEmbeddings 
} from '../constants/SkillQueries';
import type { CandidateMatch, SkillID } from '../constants/SkillTypes';

export default function SkillMatchPage() {
    const [view, setView] = useState<'chat' | 'browse'>('chat');
    const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<SkillID[]>([]);
    const [skillSearch, setSkillSearch] = useState('');
    const [department, setDepartment] = useState('');
    
    const { data: skills = [] } = useSkills();
    const { data: departments = [] } = useDepartments();
    const generateSkillEmbeddings = useGenerateSkillEmbeddings();
    const generateEmployeeEmbeddings = useGenerateEmployeeEmbeddings();
    
    const handleGenerateEmbeddings = async () => {
        try {
            await generateSkillEmbeddings.mutateAsync();
            await generateEmployeeEmbeddings.mutateAsync();
        } catch (error) {
            console.error('Failed to generate embeddings:', error);
        }
    };
    
    const toggleSkill = (skillId: string) => {
        setSelectedSkills(prev => 
            prev.includes(skillId as SkillID)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId as SkillID]
        );
    };
    
    return (
        <>
            <Head>
                <title>Skill Match | Employee Skill Matching System</title>
                <meta name="description" content="Find the right candidates using AI-powered skill matching" />
            </Head>
            
            <div className="skill-match-page">
                <header className="page-header">
                    <div className="header-left">
                        <Link href="/" className="back-link">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="title-section">
                            <h1>Skill Match</h1>
                            <p>AI-powered employee skill matching</p>
                        </div>
                    </div>
                    
                    <div className="header-actions">
                        <Link href="/employees" className="nav-link">
                            <Users size={16} />
                            Employees
                        </Link>
                        <Link href="/skills" className="nav-link">
                            <Grid size={16} />
                            Skills
                        </Link>
                        
                        <button 
                            className={`generate-btn ${generateSkillEmbeddings.isPending || generateEmployeeEmbeddings.isPending ? 'loading' : ''}`}
                            onClick={handleGenerateEmbeddings}
                            disabled={generateSkillEmbeddings.isPending || generateEmployeeEmbeddings.isPending}
                            title="Generate embeddings for all skills and employees"
                        >
                            {generateSkillEmbeddings.isPending || generateEmployeeEmbeddings.isPending ? (
                                <RefreshCw size={16} className="spin" />
                            ) : generateSkillEmbeddings.isSuccess && generateEmployeeEmbeddings.isSuccess ? (
                                <Check size={16} />
                            ) : (
                                <Zap size={16} />
                            )}
                            {generateSkillEmbeddings.isPending || generateEmployeeEmbeddings.isPending 
                                ? 'Generating...' 
                                : 'Generate Embeddings'}
                        </button>
                        
                        <EmbeddingSettings />
                    </div>
                </header>
                
                <div className="view-tabs">
                    <button 
                        className={`tab ${view === 'chat' ? 'active' : ''}`}
                        onClick={() => setView('chat')}
                    >
                        <Zap size={16} />
                        Natural Language Search
                    </button>
                    <button 
                        className={`tab ${view === 'browse' ? 'active' : ''}`}
                        onClick={() => setView('browse')}
                    >
                        <Grid size={16} />
                        Browse Skills
                    </button>
                </div>
                
                <main className="main-content">
                    {view === 'chat' ? (
                        <div className="chat-layout">
                            <div className="chat-panel">
                                <SkillChat onResultsChange={setCandidates} />
                            </div>
                            
                            {candidates.length > 0 && (
                                <div className="results-panel">
                                    <h3>Top Candidates</h3>
                                    <div className="candidates-list">
                                        {candidates.map((candidate, idx) => (
                                            <CandidateCard 
                                                key={candidate.employee.id}
                                                candidate={candidate}
                                                rank={idx + 1}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="browse-layout">
                            <aside className="filters-sidebar">
                                <h3>Filters</h3>
                                
                                <div className="filter-group">
                                    <label>Department</label>
                                    <select 
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedSkills.length > 0 && (
                                    <div className="selected-skills">
                                        <h4>Selected Skills ({selectedSkills.length})</h4>
                                        <div className="skill-tags">
                                            {selectedSkills.map(skillId => {
                                                const skill = skills.find(s => s.id === skillId);
                                                return (
                                                    <span 
                                                        key={skillId} 
                                                        className="skill-tag"
                                                        onClick={() => toggleSkill(skillId)}
                                                    >
                                                        {skill?.name || skillId}
                                                        <span className="remove">×</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <button 
                                            className="clear-btn"
                                            onClick={() => setSelectedSkills([])}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </aside>
                            
                            <div className="skills-panel">
                                <SkillBrowser 
                                    skills={skills}
                                    selectedSkills={selectedSkills}
                                    onSelect={toggleSkill}
                                    searchQuery={skillSearch}
                                    onSearchChange={setSkillSearch}
                                />
                            </div>
                        </div>
                    )}
                </main>
                
                {skills.length === 0 && (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>No Skills Found</h3>
                        <p>Import the schema files to create skills and employees.</p>
                        <code>
                            surreal import --conn http://localhost:8000 --user root --pass root --ns test --db test tables/*.surql
                        </code>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .skill-match-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
                    color: #fff;
                }
                
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 40px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.2);
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .back-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.7);
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                
                .back-link:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: #fff;
                }
                
                .title-section h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(135deg, #fff, #a5b4fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .title-section p {
                    margin: 4px 0 0 0;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.8);
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                
                .nav-link:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .generate-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .generate-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                }
                
                .generate-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .generate-btn .spin {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .view-tabs {
                    display: flex;
                    padding: 0 40px;
                    gap: 8px;
                    margin-top: 20px;
                }
                
                .tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 12px 12px 0 0;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-bottom: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .tab.active {
                    background: rgba(99, 102, 241, 0.2);
                    border-color: rgba(99, 102, 241, 0.3);
                    color: #fff;
                }
                
                .main-content {
                    padding: 40px;
                }
                
                .chat-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                
                .chat-panel {
                    height: 70vh;
                    min-height: 500px;
                }
                
                .results-panel h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0 0 20px 0;
                    color: #fff;
                }
                
                .candidates-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    max-height: 70vh;
                    overflow-y: auto;
                    padding-right: 10px;
                }
                
                .browse-layout {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 40px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .filters-sidebar {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 24px;
                    height: fit-content;
                    position: sticky;
                    top: 20px;
                }
                
                .filters-sidebar h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 20px 0;
                }
                
                .filter-group {
                    margin-bottom: 20px;
                }
                
                .filter-group label {
                    display: block;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 8px;
                }
                
                .filter-group select {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    padding: 10px 12px;
                    color: #fff;
                    font-size: 0.9rem;
                    outline: none;
                }
                
                .filter-group select:focus {
                    border-color: #6366f1;
                }
                
                .selected-skills h4 {
                    font-size: 0.85rem;
                    margin: 0 0 12px 0;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .skill-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .skill-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(99, 102, 241, 0.2);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 16px;
                    padding: 6px 10px;
                    font-size: 0.75rem;
                    color: #a5b4fc;
                    cursor: pointer;
                }
                
                .skill-tag:hover {
                    background: rgba(99, 102, 241, 0.3);
                }
                
                .skill-tag .remove {
                    font-size: 1rem;
                    line-height: 1;
                    opacity: 0.6;
                }
                
                .clear-btn {
                    background: none;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 8px 16px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s ease;
                }
                
                .clear-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .skills-panel {
                    min-height: 60vh;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 40px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .empty-state h3 {
                    font-size: 1.25rem;
                    color: #fff;
                    margin: 20px 0 12px 0;
                }
                
                .empty-state p {
                    margin: 0 0 20px 0;
                }
                
                .empty-state code {
                    display: block;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    max-width: 700px;
                    margin: 0 auto;
                    word-break: break-all;
                }
                
                @media (max-width: 1200px) {
                    .chat-layout {
                        grid-template-columns: 1fr;
                    }
                    
                    .results-panel {
                        max-height: 50vh;
                    }
                    
                    .candidates-list {
                        max-height: none;
                    }
                }
                
                @media (max-width: 768px) {
                    .page-header {
                        flex-direction: column;
                        gap: 16px;
                        padding: 16px 20px;
                    }
                    
                    .header-actions {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    
                    .main-content {
                        padding: 20px;
                    }
                    
                    .browse-layout {
                        grid-template-columns: 1fr;
                    }
                    
                    .filters-sidebar {
                        position: static;
                    }
                }
            `}</style>
        </>
    );
}
