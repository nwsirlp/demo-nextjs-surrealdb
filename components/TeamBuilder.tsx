import React, { useState } from 'react';
import { Users, Search, Loader, Star, Award, Briefcase, CheckCircle, AlertCircle } from 'react-feather';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    department: string;
    skills: string[];
    skillCoverage: number;
    compatibilityScore: number;
    totalScore: number;
}

interface TeamResult {
    team: TeamMember[];
    requiredSkills: string[];
    skillsCovered: string[];
    skillsUncovered: string[];
    explanation: string;
}

export default function TeamBuilder() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TeamResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/team-builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt.trim(), teamSize: 5 })
            });

            if (!res.ok) throw new Error('Failed to build team');

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const examplePrompts = [
        "I need a team for a React + Python ML project",
        "Build a DevOps team for cloud migration to AWS",
        "Web3 project requiring Smart Contracts and React"
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
                <div className="flex items-center gap-3">
                    <Users size={24} />
                    <div>
                        <h2 className="text-xl font-bold">Dream Team Builder</h2>
                        <p className="text-white/80 text-sm">AI-powered team suggestions based on skills & compatibility</p>
                    </div>
                </div>
            </div>

            {/* Search Form */}
            <div className="p-6 border-b border-neutral-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Describe your project requirements
                        </label>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., I need a team for a Web3 project requiring Smart Contracts, React, and Legal compliance..."
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Example prompts */}
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((ex, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setPrompt(ex)}
                                className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={!prompt.trim() || isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Finding your dream team...
                            </>
                        ) : (
                            <>
                                <Search size={18} />
                                Build Dream Team
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="p-6 space-y-6">
                    {/* Skills Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                <CheckCircle size={18} />
                                Skills Covered ({result.skillsCovered.length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {result.skillsCovered.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {result.skillsUncovered.length > 0 && (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                                    <AlertCircle size={18} />
                                    Skills Gap ({result.skillsUncovered.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {result.skillsUncovered.map((skill, i) => (
                                        <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Explanation */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800">{result.explanation}</p>
                    </div>

                    {/* Team Members */}
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                            Suggested Team ({result.team.length} members)
                        </h3>
                        <div className="space-y-3">
                            {result.team.map((member, index) => (
                                <div
                                    key={member.id}
                                    className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900">{member.name}</h4>
                                                <p className="text-sm text-neutral-600">{member.role}</p>
                                                <p className="text-xs text-neutral-500">{member.department}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-sm font-medium">{Math.round(member.totalScore * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Matching Skills */}
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {member.skills.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Scores */}
                                    <div className="mt-3 flex gap-4 text-xs text-neutral-500">
                                        <div className="flex items-center gap-1">
                                            <Award size={12} />
                                            Skill Coverage: {Math.round(member.skillCoverage * 100)}%
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Briefcase size={12} />
                                            Compatibility: {Math.round(member.compatibilityScore * 100)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
