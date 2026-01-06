import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import Surreal from 'surrealdb';

const openai = new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY || 'sk-NdjwJAxkTlcjWbOH3otMMa0HraiPWe7flFR6y446WxWMlWzA',
    baseURL: 'https://api.opentyphoon.ai/v1',
});

// System prompt for the skill search assistant
const SYSTEM_PROMPT = `You are a helpful HR assistant that helps find employees based on their skills.
When a user asks about finding someone with specific skills, you should:
1. Identify the skills mentioned in the query
2. Extract skill keywords that match common technical skills

IMPORTANT: Always include a JSON block at the END of your response with extracted skills:
\`\`\`json
{"skills": ["skill1", "skill2"]}
\`\`\`

Match skills to these exact names when possible:
- Python, JavaScript, TypeScript, Rust (programming languages)
- React, Next.js, Node.js (frameworks)
- Machine Learning, Deep Learning, Natural Language Processing, Data Analysis (AI/ML)
- Docker, Kubernetes, AWS, CI/CD (DevOps)
- SurrealDB, PostgreSQL, SQL (databases)
- Problem Solving, Communication, Leadership (soft skills)

Examples:
- "I need someone who knows JS" -> extract ["JavaScript"]
- "Looking for ML expertise" -> extract ["Machine Learning"]
- "Need React developer" -> extract ["React", "JavaScript"]

Be conversational but always include the JSON block with skills.`;

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
}

interface SkillMatch {
    employee: Employee;
    skill_name: string;
    proficiency: number;
    certified: boolean;
}

// Create a server-side SurrealDB connection
async function getServerDB(): Promise<Surreal> {
    const db = new Surreal();
    const endpoint = process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? 'http://localhost:8000/rpc';
    const namespace = process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? 'test';
    const database = process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? 'test';
    
    await db.connect(endpoint);
    await db.use({ namespace, database });
    
    // Use root access for API queries
    await db.signin({
        username: process.env.SURREAL_USER || 'root',
        password: process.env.SURREAL_PASS || 'root',
    });
    
    return db;
}

// Search for employees by skill names
async function searchEmployeesBySkills(skillNames: string[]): Promise<SkillMatch[]> {
    if (skillNames.length === 0) return [];
    
    try {
        const db = await getServerDB();
        
        // Normalize skill names for matching
        const normalizedSkills = skillNames.map(s => s.toLowerCase().trim());
        
        // Query employees with matching skills using graph traversal
        const query = `
            SELECT 
                in.id AS employee_id,
                in.name AS employee_name,
                in.email AS employee_email,
                in.department AS employee_department,
                in.role AS employee_role,
                out.name AS skill_name,
                proficiency,
                certified
            FROM has_skill
            WHERE string::lowercase(out.name) IN $skills
            ORDER BY proficiency DESC
        `;
        
        const result = await db.query<[SkillMatch[]]>(query, { skills: normalizedSkills });
        await db.close();
        
        // Extract results from SurrealDB response format
        if (Array.isArray(result) && result.length > 0) {
            const data = result[0];
            if (Array.isArray(data)) {
                // Transform to proper format - data is from SurrealDB raw query
                return (data as unknown[]).map((row) => {
                    const r = row as Record<string, unknown>;
                    return {
                        employee: {
                            id: String(r.employee_id || ''),
                            name: String(r.employee_name || ''),
                            email: String(r.employee_email || ''),
                            department: String(r.employee_department || ''),
                            role: String(r.employee_role || ''),
                        },
                        skill_name: String(r.skill_name || ''),
                        proficiency: Number(r.proficiency || 0),
                        certified: Boolean(r.certified),
                    };
                });
            }
        }
        
        return [];
    } catch (error) {
        console.error('Database search error:', error);
        return [];
    }
}

// Format search results into a readable message
function formatSearchResults(matches: SkillMatch[], skills: string[]): string {
    if (matches.length === 0) {
        return `\n\nI searched our database but couldn't find any employees with ${skills.join(' or ')} skills.`;
    }
    
    // Group by employee
    const byEmployee = new Map<string, { employee: Employee; skills: { name: string; proficiency: number; certified: boolean }[] }>();
    
    for (const match of matches) {
        const key = match.employee.id;
        if (!byEmployee.has(key)) {
            byEmployee.set(key, { employee: match.employee, skills: [] });
        }
        byEmployee.get(key)!.skills.push({
            name: match.skill_name,
            proficiency: match.proficiency,
            certified: match.certified,
        });
    }
    
    // Format output
    let output = `\n\n**Found ${byEmployee.size} employee(s) with ${skills.join(', ')} skills:**\n\n`;
    
    let rank = 1;
    const entries = Array.from(byEmployee.entries());
    for (const [, data] of entries) {
        const skillsText = data.skills
            .map((s: { name: string; proficiency: number; certified: boolean }) => `${s.name} (${s.proficiency}/5)${s.certified ? ' ✓' : ''}`)
            .join(', ');
        
        output += `${rank}. **${data.employee.name}** - ${data.employee.role} (${data.employee.department})\n`;
        output += `   Skills: ${skillsText}\n\n`;
        rank++;
    }
    
    return output;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history = [] } = req.body as {
            message: string;
            history?: ChatMessage[];
        };

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build messages array with system prompt and history
        const messages: ChatMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message },
        ];

        const response = await openai.chat.completions.create({
            model: 'typhoon-v2.1-12b-instruct',
            messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not process your request.';

        // Extract skills from the response if present
        let extractedSkills: string[] = [];
        const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                extractedSkills = parsed.skills || [];
            } catch {
                // JSON parsing failed, no skills extracted
            }
        }

        // Search database for employees with these skills
        const skillMatches = await searchEmployeesBySkills(extractedSkills);

        // Clean response by removing the JSON block for display
        let cleanResponse = assistantMessage.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
        
        // Append search results to the response
        if (extractedSkills.length > 0) {
            cleanResponse += formatSearchResults(skillMatches, extractedSkills);
        }

        // Build candidate data for the frontend
        const candidates = Array.from(
            new Map(skillMatches.map(m => [m.employee.id, m])).values()
        ).map(match => ({
            employee: match.employee,
            matchScore: match.proficiency / 5,
            matchedSkills: skillMatches
                .filter(m => m.employee.id === match.employee.id)
                .map(m => ({
                    skill: { id: '', name: m.skill_name, category: '', tags: [] },
                    proficiency: m.proficiency,
                    relevance: 1,
                })),
            semanticScore: 0.8,
            graphScore: match.proficiency / 5,
        }));

        return res.status(200).json({
            message: cleanResponse,
            skills: extractedSkills,
            candidates,
            raw: assistantMessage,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ 
            error: 'Failed to process chat request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
