import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import Surreal from 'surrealdb';

const openai = new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY || 'sk-NdjwJAxkTlcjWbOH3otMMa0HraiPWe7flFR6y446WxWMlWzA',
    baseURL: 'https://api.opentyphoon.ai/v1',
});

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

// Create server-side SurrealDB connection
async function getServerDB(): Promise<Surreal> {
    const db = new Surreal();
    const endpoint = process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? 'http://localhost:8000/rpc';
    const namespace = process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? 'test';
    const database = process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? 'test';
    
    await db.connect(endpoint);
    await db.use({ namespace, database });
    await db.signin({
        username: process.env.SURREAL_USER || 'root',
        password: process.env.SURREAL_PASS || 'root',
    });
    
    return db;
}

// Extract skills from user prompt using AI
async function extractSkillsFromPrompt(prompt: string): Promise<string[]> {
    const response = await openai.chat.completions.create({
        model: 'typhoon-v2.1-12b-instruct',
        messages: [
            {
                role: 'system',
                content: `You are a skill extraction assistant. Extract skill names from the user's project requirements.
Return ONLY a JSON array of skill names. Match to these known skills when possible:
Python, JavaScript, TypeScript, Rust, React, Next.js, Node.js, Machine Learning, Deep Learning, 
Natural Language Processing, Data Analysis, Docker, Kubernetes, AWS, CI/CD, SurrealDB, PostgreSQL, SQL,
Problem Solving, Communication, Leadership, Smart Contract, Solidity, Web3, Legal, Compliance

Examples:
- "I need a team for React development" -> ["React", "JavaScript"]
- "Web3 project with smart contracts" -> ["Smart Contract", "Solidity", "Web3"]
- "ML recommendation engine" -> ["Machine Learning", "Python", "Data Analysis"]`
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch {
            return [];
        }
    }
    return [];
}

// Find dream team using graph-based scoring
async function findDreamTeam(skills: string[], teamSize: number = 5): Promise<TeamResult> {
    if (skills.length === 0) {
        return {
            team: [],
            requiredSkills: [],
            skillsCovered: [],
            skillsUncovered: [],
            explanation: 'No skills could be extracted from your requirements.'
        };
    }

    const db = await getServerDB();
    
    try {
        // Normalize skill names for matching
        const normalizedSkills = skills.map(s => s.toLowerCase().trim());
        
        // Simpler approach: Get employees with skills, then process in JS
        const employeesWithSkillsQuery = `
            SELECT 
                in.id AS emp_id,
                in.name AS emp_name,
                in.role AS emp_role,
                in.department AS emp_dept,
                out.name AS skill_name,
                proficiency
            FROM has_skill
            WHERE string::lowercase(out.name) IN $skills
        `;
        
        const result = await db.query<[unknown[]]>(employeesWithSkillsQuery, { 
            skills: normalizedSkills
        });
        
        // Process results to group by employee
        const employeeMap = new Map<string, {
            id: string;
            name: string;
            role: string;
            department: string;
            skills: string[];
            totalProficiency: number;
        }>();
        
        if (Array.isArray(result) && result.length > 0) {
            const rows = result[0];
            if (Array.isArray(rows)) {
                for (const row of rows) {
                    const r = row as Record<string, unknown>;
                    const empId = String(r.emp_id || '');
                    
                    if (!employeeMap.has(empId)) {
                        employeeMap.set(empId, {
                            id: empId,
                            name: String(r.emp_name || ''),
                            role: String(r.emp_role || ''),
                            department: String(r.emp_dept || ''),
                            skills: [],
                            totalProficiency: 0
                        });
                    }
                    
                    const emp = employeeMap.get(empId)!;
                    const skillName = String(r.skill_name || '');
                    if (skillName && !emp.skills.includes(skillName)) {
                        emp.skills.push(skillName);
                    }
                    emp.totalProficiency += Number(r.proficiency) || 0;
                }
            }
        }
        
        // Get collaboration counts (if worked_with table exists)
        const collabCounts = new Map<string, number>();
        try {
            const collabResult = await db.query<[{ in: string; count: number }[]]>(`
                SELECT in, count() AS count FROM worked_with GROUP BY in
            `);
            
            if (Array.isArray(collabResult) && collabResult.length > 0) {
                const rows = collabResult[0];
                if (Array.isArray(rows)) {
                    for (const row of rows) {
                        collabCounts.set(String(row.in), Number(row.count) || 0);
                    }
                }
            }
        } catch {
            // worked_with table might not exist yet
            console.log('worked_with table not found, skipping collaboration scores');
        }
        
        await db.close();
        
        // Build team members from aggregated data
        const allCoveredSkills = new Set<string>();
        let candidates: TeamMember[] = [];
        
        for (const emp of Array.from(employeeMap.values())) {
            emp.skills.forEach((s: string) => allCoveredSkills.add(s));
            
            const skillCoverage = emp.skills.length / skills.length;
            const collabCount = collabCounts.get(emp.id) || 0;
            const compatibilityScore = Math.min(collabCount / 3, 1);
            
            candidates.push({
                id: emp.id,
                name: emp.name,
                role: emp.role,
                department: emp.department,
                skills: emp.skills,
                skillCoverage,
                compatibilityScore,
                totalScore: skillCoverage * 0.7 + compatibilityScore * 0.3
            });
        }
        
        // Sort by total score and limit
        candidates.sort((a, b) => b.totalScore - a.totalScore);
        candidates = candidates.slice(0, teamSize);
        
        // Determine uncovered skills
        const coveredLower = Array.from(allCoveredSkills).map(s => s.toLowerCase());
        const uncovered = skills.filter(s => !coveredLower.includes(s.toLowerCase()));
        
        // Generate explanation
        let explanation = '';
        if (candidates.length === 0) {
            explanation = `No employees found with the required skills: ${skills.join(', ')}.`;
        } else if (uncovered.length > 0) {
            explanation = `Found ${candidates.length} team members covering ${skills.length - uncovered.length}/${skills.length} skills. ` +
                `Missing skills: ${uncovered.join(', ')}. Consider hiring or training for these areas.`;
        } else {
            const avgCompat = candidates.length > 0 
                ? Math.round(candidates.reduce((sum, c) => sum + c.compatibilityScore, 0) / candidates.length * 100)
                : 0;
            explanation = `Perfect match! Found ${candidates.length} team members who together cover all ${skills.length} required skills. ` +
                `Team compatibility is ${avgCompat}% based on past collaborations.`;
        }
        
        return {
            team: candidates,
            requiredSkills: skills,
            skillsCovered: Array.from(allCoveredSkills),
            skillsUncovered: uncovered,
            explanation
        };
        
    } catch (error) {
        await db.close();
        throw error;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, skills: providedSkills, teamSize = 5 } = req.body;
        
        if (!prompt && (!providedSkills || providedSkills.length === 0)) {
            return res.status(400).json({ error: 'Either prompt or skills array is required' });
        }

        // Extract skills from prompt if not provided
        const skills = providedSkills && providedSkills.length > 0 
            ? providedSkills 
            : await extractSkillsFromPrompt(prompt);
        
        // Find the dream team
        const result = await findDreamTeam(skills, teamSize);
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('Team builder API error:', error);
        return res.status(500).json({ 
            error: 'Failed to build team',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
