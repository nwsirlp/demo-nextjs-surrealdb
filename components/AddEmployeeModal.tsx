import React, { useState } from 'react';
import { X, Loader, User, Mail, Briefcase, Plus, Minus } from 'react-feather';

interface SkillEntry {
    name: string;
    proficiency: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const departments = [
    'Engineering',
    'Data Science',
    'DevOps',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'HR',
    'Legal',
    'Finance',
];

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        department: 'Engineering',
    });
    const [skills, setSkills] = useState<SkillEntry[]>([]);
    const [newSkillName, setNewSkillName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addSkill = () => {
        if (!newSkillName.trim()) return;
        if (skills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase().trim())) {
            setError('Skill already added');
            return;
        }
        setSkills(prev => [...prev, { name: newSkillName.trim(), proficiency: 3 }]);
        setNewSkillName('');
        setError(null);
    };

    const removeSkill = (index: number) => {
        setSkills(prev => prev.filter((_, i) => i !== index));
    };

    const updateProficiency = (index: number, proficiency: number) => {
        setSkills(prev => prev.map((s, i) => i === index ? { ...s, proficiency } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Name and email are required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create employee via the parse-resume API
            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeText: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        role: formData.role || 'Employee',
                        department: formData.department,
                        skills: skills.map(s => s.name),
                        skillProficiencies: skills, // Pass proficiency data
                    }),
                    createEmployee: true,
                    skillProficiencies: skills, // Also pass at top level
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create employee');
            }

            // Reset form and close
            setFormData({
                name: '',
                email: '',
                role: '',
                department: 'Engineering',
            });
            setSkills([]);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-xl font-semibold text-neutral-900">Add Employee</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-neutral-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Name *
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="John Smith"
                                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Email *
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="john@company.com"
                                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Role
                        </label>
                        <div className="relative">
                            <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                placeholder="Software Engineer"
                                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Department
                        </label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Skills with Proficiency */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Skills & Proficiency
                        </label>
                        
                        {/* Add skill input */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newSkillName}
                                onChange={(e) => setNewSkillName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Add a skill (e.g., Python, React)"
                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Skills list */}
                        {skills.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {skills.map((skill, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                                    >
                                        <span className="font-medium text-neutral-700 min-w-[100px]">
                                            {skill.name}
                                        </span>
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className="text-xs text-neutral-500">1</span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={skill.proficiency}
                                                onChange={(e) => updateProficiency(index, Number(e.target.value))}
                                                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <span className="text-xs text-neutral-500">5</span>
                                            <span className="w-8 text-center font-bold text-indigo-600">
                                                {skill.proficiency}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Minus size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {skills.length === 0 && (
                            <p className="text-sm text-neutral-500 italic">
                                No skills added yet. Type a skill name and press Enter or click +
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Creating...
                                </>
                            ) : (
                                `Create Employee${skills.length > 0 ? ` (${skills.length} skills)` : ''}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
