import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Search, Tag, Users } from 'react-feather';
import { useSkills, useSkillCategories, useSkillWithEmployees } from '../constants/SkillQueries';
import type { SkillID } from '../constants/SkillTypes';

export default function SkillsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [expandedId, setExpandedId] = useState<SkillID | null>(null);
    
    const { data: skills = [], isLoading } = useSkills();
    const { data: categories = [] } = useSkillCategories();
    const { data: expandedSkill } = useSkillWithEmployees({ id: expandedId ?? undefined });
    
    const filteredSkills = skills.filter(skill => {
        const matchesSearch = !search || 
            skill.name.toLowerCase().includes(search.toLowerCase()) ||
            skill.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCat = !selectedCategory || skill.category === selectedCategory;
        return matchesSearch && matchesCat;
    });
    
    const groupedSkills = filteredSkills.reduce((acc, skill) => {
        const cat = skill.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
    }, {} as Record<string, typeof skills>);
    
    return (
        <>
            <Head>
                <title>Skills | Skill Matching</title>
            </Head>
            
            <div className="page">
                <header>
                    <Link href="/skill-match" className="back">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1>Skills</h1>
                    <span>{filteredSkills.length} skills</span>
                </header>
                
                <div className="filters">
                    <div className="search">
                        <Search size={18} />
                        <input
                            placeholder="Search skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                <main>
                    {isLoading ? (
                        <p className="center">Loading...</p>
                    ) : filteredSkills.length === 0 ? (
                        <p className="center">No skills found</p>
                    ) : (
                        Object.entries(groupedSkills).sort(([a], [b]) => a.localeCompare(b)).map(([category, catSkills]) => (
                            <div key={category} className="category">
                                <h2>{category} <span>({catSkills.length})</span></h2>
                                <div className="grid">
                                    {catSkills.map(skill => (
                                        <div 
                                            key={skill.id}
                                            className={`card ${expandedId === skill.id ? 'expanded' : ''}`}
                                            onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                                        >
                                            <h3>{skill.name}</h3>
                                            {skill.description && (
                                                <p className="desc">{skill.description}</p>
                                            )}
                                            {skill.tags && skill.tags.length > 0 && (
                                                <div className="tags">
                                                    {skill.tags.slice(0, 4).map(tag => (
                                                        <span key={tag} className="tag">
                                                            <Tag size={10} /> {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {expandedId === skill.id && expandedSkill?.employees && (
                                                <div className="employees">
                                                    <h4><Users size={14} /> {expandedSkill.employees.length} Employees</h4>
                                                    <div className="emp-list">
                                                        {expandedSkill.employees.map(({ employee, proficiency }) => (
                                                            <div key={employee.id} className="emp">
                                                                <span className="name">{employee.name}</span>
                                                                <span className="role">{employee.role}</span>
                                                                <div className="bars">
                                                                    {[1,2,3,4,5].map(n => <span key={n} className={n <= proficiency ? 'on' : ''} />)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </main>
            </div>
            
            <style jsx>{`
                .page { min-height: 100vh; background: linear-gradient(135deg, #0f172a, #1e1b4b); color: #fff; }
                header { display: flex; align-items: center; gap: 16px; padding: 20px 40px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); }
                header h1 { flex: 1; margin: 0; font-size: 1.3rem; }
                header span { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
                .back { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; text-decoration: none; }
                .filters { display: flex; gap: 12px; padding: 20px 40px; }
                .search { flex: 1; max-width: 300px; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0 14px; color: rgba(255,255,255,0.5); }
                .search input { flex: 1; background: none; border: none; padding: 10px 0; color: #fff; outline: none; }
                .filters select { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 14px; color: #fff; outline: none; }
                main { padding: 20px 40px 40px; }
                .center { text-align: center; padding: 60px; color: rgba(255,255,255,0.5); }
                .category { margin-bottom: 32px; }
                .category h2 { font-size: 1rem; margin: 0 0 16px; color: rgba(255,255,255,0.8); }
                .category h2 span { color: rgba(255,255,255,0.4); font-weight: normal; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
                .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }
                .card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
                .card.expanded { border-color: #6366f1; }
                .card h3 { margin: 0 0 8px; font-size: 0.95rem; }
                .desc { color: rgba(255,255,255,0.5); font-size: 0.8rem; line-height: 1.4; margin: 0 0 10px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                .tags { display: flex; gap: 6px; flex-wrap: wrap; }
                .tag { display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 4px 8px; font-size: 0.7rem; color: rgba(255,255,255,0.6); }
                .employees { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
                .employees h4 { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; font-size: 0.8rem; color: rgba(255,255,255,0.7); }
                .emp-list { display: flex; flex-direction: column; gap: 8px; }
                .emp { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); border-radius: 6px; padding: 8px 10px; font-size: 0.75rem; }
                .emp .name { font-weight: 500; }
                .emp .role { color: rgba(255,255,255,0.5); }
                .bars { display: flex; gap: 2px; }
                .bars span { width: 8px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.15); }
                .bars span.on { background: #6366f1; }
            `}</style>
        </>
    );
}
