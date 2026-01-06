import React, { useState, useCallback } from 'react';
import { 
    Upload, 
    FileText, 
    Check, 
    AlertCircle, 
    Loader, 
    User, 
    Mail, 
    Briefcase, 
    Award,
    Edit2,
    Plus,
    Minus,
    Users
} from 'react-feather';

interface SkillEntry {
    name: string;
    proficiency: number;
}

interface ParsedPerson {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    department?: string;
    skills: SkillEntry[];
    experience?: string;
    education?: string;
    isCreated: boolean;
    isCreating: boolean;
}

interface Props {
    onParsed?: (data: ParsedPerson) => void;
    onEmployeeCreated?: (employee: { id: string; name: string }) => void;
}

export default function ResumeUpload({ onParsed, onEmployeeCreated }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedPeople, setParsedPeople] = useState<ParsedPerson[]>([]);
    const [isCreatingAll, setIsCreatingAll] = useState(false);

    const parseResumeText = async (text: string): Promise<ParsedPerson[]> => {
        // Try to split by common resume separators
        const separators = [
            /\n{3,}/, // Multiple blank lines
            /---+/, // Horizontal lines
            /===+/, // Equal signs
        ];
        
        let sections = [text];
        for (const sep of separators) {
            const newSections: string[] = [];
            for (const section of sections) {
                newSections.push(...section.split(sep).filter(s => s.trim().length > 100));
            }
            if (newSections.length > sections.length) {
                sections = newSections;
            }
        }

        // Also try to detect by email pattern
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailPattern) || [];
        
        // If multiple emails found, try to split by each name/email block
        if (emails.length > 1) {
            const personBlocks: string[] = [];
            let lastIndex = 0;
            
            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                const emailIndex = text.indexOf(email, lastIndex);
                
                if (i > 0) {
                    // Find where this person's info starts (look for name before email)
                    const searchStart = Math.max(0, emailIndex - 200);
                    const beforeEmail = text.slice(searchStart, emailIndex);
                    const lines = beforeEmail.split('\n').filter(l => l.trim());
                    
                    // Find potential name line (usually the last non-empty line before or line with caps)
                    let nameLineIndex = -1;
                    for (let j = lines.length - 1; j >= 0; j--) {
                        if (lines[j].match(/^[A-Z][a-z]+ [A-Z][a-z]+/) || 
                            lines[j].match(/^[A-Z\s]+$/)) {
                            nameLineIndex = beforeEmail.lastIndexOf(lines[j]);
                            break;
                        }
                    }
                    
                    if (nameLineIndex > 0) {
                        personBlocks.push(text.slice(lastIndex, searchStart + nameLineIndex));
                        lastIndex = searchStart + nameLineIndex;
                    }
                }
            }
            // Add remaining text
            if (lastIndex < text.length) {
                personBlocks.push(text.slice(lastIndex));
            }
            
            if (personBlocks.length > 1) {
                sections = personBlocks.filter(b => b.trim().length > 50);
            }
        }

        // Parse each section
        const people: ParsedPerson[] = [];
        
        for (const section of sections) {
            if (section.trim().length < 50) continue;
            
            try {
                const response = await fetch('/api/parse-resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resumeText: section }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.parsed && data.parsed.name && data.parsed.name !== 'Unknown') {
                        people.push({
                            ...data.parsed,
                            skills: (data.parsed.skills || []).map((s: string) => ({ name: s, proficiency: 3 })),
                            isCreated: false,
                            isCreating: false,
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to parse section:', e);
            }
        }

        return people;
    };

    const handleFile = async (file: File) => {
        if (!file) return;
        
        setIsLoading(true);
        setError(null);
        setParsedPeople([]);

        try {
            let text = '';
            
            if (file.type === 'application/pdf') {
                text = await file.text();
                if (text.startsWith('%PDF') || text.includes('\x00')) {
                    throw new Error('Binary PDF detected. Please paste the resume text instead.');
                }
            } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                text = await file.text();
            } else {
                throw new Error('Please upload a PDF or TXT file');
            }

            if (!text.trim()) {
                throw new Error('Could not extract text from file');
            }

            const people = await parseResumeText(text);
            
            if (people.length === 0) {
                throw new Error('Could not parse any valid resumes from the file');
            }

            setParsedPeople(people);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handlePasteText = async () => {
        const text = prompt('Paste resume text (can include multiple people):');
        if (!text?.trim()) return;

        setIsLoading(true);
        setError(null);
        setParsedPeople([]);

        try {
            const people = await parseResumeText(text);
            
            if (people.length === 0) {
                throw new Error('Could not parse any valid resume data');
            }

            setParsedPeople(people);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process text');
        } finally {
            setIsLoading(false);
        }
    };

    // Update a person's data
    const updatePerson = (index: number, updates: Partial<ParsedPerson>) => {
        setParsedPeople(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
    };

    // Update a skill
    const updateSkill = (personIndex: number, skillIndex: number, updates: Partial<SkillEntry>) => {
        setParsedPeople(prev => prev.map((p, i) => {
            if (i !== personIndex) return p;
            return {
                ...p,
                skills: p.skills.map((s, si) => si === skillIndex ? { ...s, ...updates } : s)
            };
        }));
    };

    // Add a skill
    const addSkill = (personIndex: number, skillName: string) => {
        if (!skillName.trim()) return;
        setParsedPeople(prev => prev.map((p, i) => {
            if (i !== personIndex) return p;
            if (p.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) return p;
            return {
                ...p,
                skills: [...p.skills, { name: skillName.trim(), proficiency: 3 }]
            };
        }));
    };

    // Remove a skill
    const removeSkill = (personIndex: number, skillIndex: number) => {
        setParsedPeople(prev => prev.map((p, i) => {
            if (i !== personIndex) return p;
            return {
                ...p,
                skills: p.skills.filter((_, si) => si !== skillIndex)
            };
        }));
    };

    // Create a single employee
    const createEmployee = async (index: number) => {
        const person = parsedPeople[index];
        if (!person.email) {
            setError('Email is required to create employee');
            return;
        }

        updatePerson(index, { isCreating: true });

        try {
            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeText: JSON.stringify({
                        name: person.name,
                        email: person.email,
                        role: person.role || 'Employee',
                        department: person.department || 'General',
                        skills: person.skills.map(s => s.name),
                    }),
                    createEmployee: true,
                    skillProficiencies: person.skills,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create employee');
            }

            const data = await response.json();
            updatePerson(index, { isCreated: true, isCreating: false });
            onEmployeeCreated?.(data.created);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create employee');
            updatePerson(index, { isCreating: false });
        }
    };

    // Create all employees
    const createAllEmployees = async () => {
        setIsCreatingAll(true);
        setError(null);

        for (let i = 0; i < parsedPeople.length; i++) {
            if (!parsedPeople[i].isCreated && parsedPeople[i].email) {
                await createEmployee(i);
            }
        }

        setIsCreatingAll(false);
    };

    const uncreatedCount = parsedPeople.filter(p => !p.isCreated && p.email).length;

    return (
        <div className="space-y-6">
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all
                    ${isDragging 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-neutral-300 hover:border-emerald-400 hover:bg-neutral-50'
                    }
                    ${isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                `}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader className="animate-spin text-emerald-600" size={40} />
                        <p className="text-neutral-600">Analyzing resume(s) with AI...</p>
                    </div>
                ) : (
                    <>
                        <Upload className="mx-auto text-neutral-400 mb-4" size={40} />
                        <p className="text-neutral-700 font-medium mb-2">
                            Drag & drop resume(s) here
                        </p>
                        <p className="text-neutral-500 text-sm mb-4">
                            Supports PDF and TXT files • Can parse multiple people
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <label className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors">
                                Browse Files
                                <input
                                    type="file"
                                    accept=".pdf,.txt"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                            </label>
                            <button
                                onClick={handlePasteText}
                                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                            >
                                Paste Text
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Parsed Results */}
            {parsedPeople.length > 0 && (
                <div className="space-y-4">
                    {/* Header with bulk actions */}
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                            <Users size={18} className="text-emerald-600" />
                            Parsed {parsedPeople.length} Person{parsedPeople.length > 1 ? 's' : ''}
                        </h3>
                        {uncreatedCount > 0 && (
                            <button
                                onClick={createAllEmployees}
                                disabled={isCreatingAll}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {isCreatingAll ? (
                                    <>
                                        <Loader className="animate-spin" size={16} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Create All ({uncreatedCount})
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Person cards */}
                    {parsedPeople.map((person, personIndex) => (
                        <div 
                            key={personIndex}
                            className={`p-4 rounded-lg border ${
                                person.isCreated 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-white border-neutral-200'
                            }`}
                        >
                            {/* Person header */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={person.name}
                                        onChange={(e) => updatePerson(personIndex, { name: e.target.value })}
                                        disabled={person.isCreated}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm disabled:bg-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={person.email}
                                        onChange={(e) => updatePerson(personIndex, { email: e.target.value })}
                                        disabled={person.isCreated}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm disabled:bg-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
                                    <input
                                        type="text"
                                        value={person.role || ''}
                                        onChange={(e) => updatePerson(personIndex, { role: e.target.value })}
                                        disabled={person.isCreated}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm disabled:bg-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={person.department || ''}
                                        onChange={(e) => updatePerson(personIndex, { department: e.target.value })}
                                        disabled={person.isCreated}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm disabled:bg-neutral-100"
                                    />
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-neutral-500 mb-2">
                                    Skills & Proficiency
                                </label>
                                <div className="space-y-2">
                                    {person.skills.map((skill, skillIndex) => (
                                        <div 
                                            key={skillIndex}
                                            className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg"
                                        >
                                            <span className="min-w-[120px] text-sm font-medium text-neutral-700">
                                                {skill.name}
                                            </span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={skill.proficiency}
                                                onChange={(e) => updateSkill(personIndex, skillIndex, { proficiency: Number(e.target.value) })}
                                                disabled={person.isCreated}
                                                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                            />
                                            <span className="w-6 text-center text-sm font-bold text-emerald-600">
                                                {skill.proficiency}
                                            </span>
                                            {!person.isCreated && (
                                                <button
                                                    onClick={() => removeSkill(personIndex, skillIndex)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* Add skill */}
                                    {!person.isCreated && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add skill..."
                                                className="flex-1 px-3 py-1.5 border border-neutral-200 rounded-lg text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addSkill(personIndex, (e.target as HTMLInputElement).value);
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {person.isCreated ? (
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <Check size={16} />
                                    Employee created successfully!
                                </div>
                            ) : (
                                <button
                                    onClick={() => createEmployee(personIndex)}
                                    disabled={person.isCreating || !person.email}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                    {person.isCreating ? (
                                        <>
                                            <Loader className="animate-spin" size={16} />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <User size={16} />
                                            Create Employee & Link {person.skills.length} Skills
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
