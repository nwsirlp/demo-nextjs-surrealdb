import React from 'react';
import type { Skill } from '../constants/SkillTypes';

type Props = {
    skills: Skill[];
    selectedSkills?: string[];
    onSelect?: (skillId: string) => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    compact?: boolean;
};

// Group skills by category
function groupByCategory(skills: Skill[]): Record<string, Skill[]> {
    return skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);
}

// Category colors for visual distinction
const categoryColors: Record<string, string> = {
    'Programming Language': '#f59e0b',
    'Frontend Framework': '#3b82f6',
    'Backend Framework': '#6366f1',
    'Database': '#10b981',
    'DevOps': '#ef4444',
    'Cloud Platform': '#8b5cf6',
    'AI/ML': '#ec4899',
    'Data Science': '#14b8a6',
    'Runtime': '#f97316',
    'Query Language': '#06b6d4',
    'Soft Skill': '#84cc16',
};

export default function SkillBrowser({
    skills,
    selectedSkills = [],
    onSelect,
    searchQuery = '',
    onSearchChange,
    compact = false,
}: Props) {
    // Filter skills based on search
    const filteredSkills = skills.filter(skill => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            skill.name.toLowerCase().includes(query) ||
            skill.category?.toLowerCase().includes(query) ||
            skill.description?.toLowerCase().includes(query) ||
            skill.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    });
    
    const groupedSkills = groupByCategory(filteredSkills);
    const categories = Object.keys(groupedSkills).sort();
    
    return (
        <div className={`skill-browser ${compact ? 'compact' : ''}`}>
            {onSearchChange && (
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}
            
            <div className="categories">
                {categories.map(category => (
                    <div key={category} className="category">
                        <h4 style={{ color: categoryColors[category] || '#94a3b8' }}>
                            {category}
                            <span className="count">{groupedSkills[category].length}</span>
                        </h4>
                        <div className="skills-list">
                            {groupedSkills[category].map(skill => (
                                <button
                                    key={skill.id}
                                    className={`skill-btn ${selectedSkills.includes(skill.id) ? 'selected' : ''}`}
                                    onClick={() => onSelect?.(skill.id)}
                                    title={skill.description || skill.name}
                                    style={{ 
                                        '--category-color': categoryColors[category] || '#94a3b8' 
                                    } as React.CSSProperties}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                
                {categories.length === 0 && (
                    <div className="no-results">
                        No skills found matching &quot;{searchQuery}&quot;
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .skill-browser {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 20px;
                    height: 100%;
                    overflow-y: auto;
                }
                
                .skill-browser.compact {
                    padding: 12px;
                }
                
                .search-box {
                    margin-bottom: 20px;
                }
                
                .search-box input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #fff;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s ease;
                }
                
                .search-box input:focus {
                    border-color: #6366f1;
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .search-box input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                
                .categories {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .compact .categories {
                    gap: 12px;
                }
                
                .category h4 {
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .compact .category h4 {
                    font-size: 0.75rem;
                    margin-bottom: 6px;
                }
                
                .count {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 10px;
                }
                
                .skills-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .compact .skills-list {
                    gap: 6px;
                }
                
                .skill-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 8px 14px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .compact .skill-btn {
                    padding: 4px 10px;
                    font-size: 0.7rem;
                }
                
                .skill-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--category-color);
                    color: #fff;
                }
                
                .skill-btn.selected {
                    background: var(--category-color);
                    border-color: var(--category-color);
                    color: #fff;
                    font-weight: 500;
                }
                
                .no-results {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    padding: 40px;
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
}
