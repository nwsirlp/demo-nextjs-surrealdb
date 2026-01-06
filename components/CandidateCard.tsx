import React from 'react';
import { User, Award, Briefcase, Star } from 'react-feather';
import type { CandidateMatch } from '../constants/SkillTypes';

type Props = {
    candidate: CandidateMatch;
    rank?: number;
    compact?: boolean;
    onClick?: () => void;
};

function getProficiencyLabel(level: number): string {
    switch (level) {
        case 1: return 'Beginner';
        case 2: return 'Basic';
        case 3: return 'Intermediate';
        case 4: return 'Advanced';
        case 5: return 'Expert';
        default: return 'Unknown';
    }
}

function getProficiencyColor(level: number): string {
    switch (level) {
        case 1: return '#94a3b8';
        case 2: return '#60a5fa';
        case 3: return '#34d399';
        case 4: return '#a78bfa';
        case 5: return '#fbbf24';
        default: return '#94a3b8';
    }
}

export default function CandidateCard({ candidate, rank, compact = false, onClick }: Props) {
    const { employee, matchScore, matchedSkills, semanticScore, graphScore } = candidate;
    const scorePercent = Math.round(matchScore * 100);
    
    if (compact) {
        return (
            <div className="candidate-card compact" onClick={onClick}>
                <div className="card-header">
                    <div className="avatar">
                        {employee.avatar_url ? (
                            <img src={employee.avatar_url} alt={employee.name} />
                        ) : (
                            <User size={16} />
                        )}
                    </div>
                    <div className="info">
                        <h4>{employee.name}</h4>
                        <span className="role">{employee.role}</span>
                    </div>
                    <div className="score">
                        <div className="score-value">{scorePercent}%</div>
                    </div>
                </div>
                
                <div className="skills-preview">
                    {matchedSkills.slice(0, 3).map(({ skill, proficiency }) => (
                        <span 
                            key={skill.id} 
                            className="skill-tag"
                            style={{ borderColor: getProficiencyColor(proficiency) }}
                        >
                            {skill.name}
                        </span>
                    ))}
                    {matchedSkills.length > 3 && (
                        <span className="more-skills">+{matchedSkills.length - 3}</span>
                    )}
                </div>
                
                <style jsx>{`
                    .candidate-card.compact {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        padding: 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .candidate-card.compact:hover {
                        background: rgba(255, 255, 255, 0.1);
                        transform: translateY(-2px);
                    }
                    
                    .card-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    
                    .avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        overflow: hidden;
                    }
                    
                    .avatar img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    
                    .info {
                        flex: 1;
                        min-width: 0;
                    }
                    
                    .info h4 {
                        font-size: 0.9rem;
                        font-weight: 600;
                        margin: 0;
                        color: #fff;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .role {
                        font-size: 0.75rem;
                        color: rgba(255, 255, 255, 0.6);
                        display: block;
                    }
                    
                    .score {
                        text-align: right;
                    }
                    
                    .score-value {
                        font-size: 1.1rem;
                        font-weight: 700;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    .skills-preview {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                    }
                    
                    .skill-tag {
                        font-size: 0.7rem;
                        padding: 3px 8px;
                        border-radius: 12px;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid;
                        color: rgba(255, 255, 255, 0.8);
                    }
                    
                    .more-skills {
                        font-size: 0.7rem;
                        color: rgba(255, 255, 255, 0.5);
                        padding: 3px 8px;
                    }
                `}</style>
            </div>
        );
    }
    
    return (
        <div className="candidate-card" onClick={onClick}>
            {rank && (
                <div className="rank-badge">#{rank}</div>
            )}
            
            <div className="card-content">
                <div className="profile-section">
                    <div className="avatar">
                        {employee.avatar_url ? (
                            <img src={employee.avatar_url} alt={employee.name} />
                        ) : (
                            <User size={28} />
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{employee.name}</h3>
                        <div className="meta">
                            <span className="role">
                                <Briefcase size={14} />
                                {employee.role}
                            </span>
                            <span className="department">{employee.department}</span>
                        </div>
                        {employee.profile?.bio && (
                            <p className="bio">{employee.profile.bio}</p>
                        )}
                    </div>
                </div>
                
                <div className="score-section">
                    <div className="overall-score">
                        <div className="score-circle">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path
                                    className="circle-bg"
                                    d="M18 2.0845
                                       a 15.9155 15.9155 0 0 1 0 31.831
                                       a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="circle"
                                    strokeDasharray={`${scorePercent}, 100`}
                                    d="M18 2.0845
                                       a 15.9155 15.9155 0 0 1 0 31.831
                                       a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="percentage">{scorePercent}%</span>
                        </div>
                        <span className="score-label">Match Score</span>
                    </div>
                    
                    <div className="score-breakdown">
                        <div className="breakdown-item">
                            <label>Skills Match</label>
                            <div className="progress-bar">
                                <div 
                                    className="progress" 
                                    style={{ width: `${graphScore * 100}%` }}
                                />
                            </div>
                            <span>{Math.round(graphScore * 100)}%</span>
                        </div>
                        <div className="breakdown-item">
                            <label>Semantic Fit</label>
                            <div className="progress-bar">
                                <div 
                                    className="progress semantic" 
                                    style={{ width: `${semanticScore * 100}%` }}
                                />
                            </div>
                            <span>{Math.round(semanticScore * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <div className="skills-section">
                    <h4>
                        <Award size={16} />
                        Matching Skills
                    </h4>
                    <div className="skills-grid">
                        {matchedSkills.map(({ skill, proficiency, relevance }) => (
                            <div 
                                key={skill.id} 
                                className="skill-item"
                                style={{ '--prof-color': getProficiencyColor(proficiency) } as React.CSSProperties}
                            >
                                <div className="skill-header">
                                    <span className="skill-name">{skill.name}</span>
                                    <div className="proficiency-stars">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <Star 
                                                key={level}
                                                size={12}
                                                fill={level <= proficiency ? getProficiencyColor(proficiency) : 'transparent'}
                                                color={level <= proficiency ? getProficiencyColor(proficiency) : 'rgba(255,255,255,0.2)'}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="skill-meta">
                                    <span className="proficiency-label">{getProficiencyLabel(proficiency)}</span>
                                    <span className="relevance">
                                        {Math.round(relevance * 100)}% relevant
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .candidate-card {
                    background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                    cursor: ${onClick ? 'pointer' : 'default'};
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .candidate-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    border-color: rgba(99, 102, 241, 0.3);
                }
                
                .rank-badge {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: #fff;
                    font-weight: 700;
                    font-size: 0.9rem;
                    padding: 6px 12px;
                    border-radius: 20px;
                    z-index: 1;
                }
                
                .card-content {
                    padding: 24px;
                }
                
                .profile-section {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                
                .avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .profile-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .profile-info h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }
                
                .meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 8px;
                }
                
                .role {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                }
                
                .department {
                    background: rgba(99, 102, 241, 0.2);
                    color: #a5b4fc;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .bio {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.85rem;
                    line-height: 1.5;
                    margin: 8px 0 0 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .score-section {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 24px;
                    align-items: center;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 16px;
                    margin-bottom: 24px;
                }
                
                .overall-score {
                    text-align: center;
                }
                
                .score-circle {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto;
                }
                
                .circular-chart {
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }
                
                .circle-bg {
                    fill: none;
                    stroke: rgba(255, 255, 255, 0.1);
                    stroke-width: 3;
                }
                
                .circle {
                    fill: none;
                    stroke: url(#scoreGradient);
                    stroke-width: 3;
                    stroke-linecap: round;
                    stroke: #8b5cf6;
                }
                
                .percentage {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #fff;
                }
                
                .score-label {
                    display: block;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 8px;
                }
                
                .score-breakdown {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .breakdown-item {
                    display: grid;
                    grid-template-columns: 100px 1fr 40px;
                    gap: 12px;
                    align-items: center;
                }
                
                .breakdown-item label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .progress-bar {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .progress {
                    height: 100%;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
                
                .progress.semantic {
                    background: linear-gradient(90deg, #14b8a6, #22d3ee);
                }
                
                .breakdown-item span:last-child {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.8);
                    text-align: right;
                }
                
                .skills-section h4 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #fff;
                    margin: 0 0 16px 0;
                }
                
                .skills-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                }
                
                .skill-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 12px;
                    border-left: 3px solid var(--prof-color);
                }
                
                .skill-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }
                
                .skill-name {
                    font-weight: 600;
                    color: #fff;
                    font-size: 0.9rem;
                }
                
                .proficiency-stars {
                    display: flex;
                    gap: 2px;
                }
                
                .skill-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                }
                
                .proficiency-label {
                    color: var(--prof-color);
                }
                
                .relevance {
                    color: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    );
}
