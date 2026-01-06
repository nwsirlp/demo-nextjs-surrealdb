import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import Surreal from 'surrealdb';

// Disable body parsing to handle raw file upload
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

const openai = new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY || 'sk-NdjwJAxkTlcjWbOH3otMMa0HraiPWe7flFR6y446WxWMlWzA',
    baseURL: 'https://api.opentyphoon.ai/v1',
});

interface ParsedResume {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    department?: string;
    skills: string[];
    experience?: string;
    education?: string;
}

interface CreatedEmployee {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    skillsLinked: string[];
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

// Extract structured data from resume text using Typhoon AI
async function extractResumeData(text: string): Promise<ParsedResume> {
    const response = await openai.chat.completions.create({
        model: 'typhoon-v2.1-12b-instruct',
        messages: [
            {
                role: 'system',
                content: `You are a resume parser. Extract structured information from the resume text.
Return ONLY a valid JSON object with these fields:
{
    "name": "Full name",
    "email": "email@example.com",
    "phone": "phone number if found",
    "role": "Current or target job title",
    "department": "Suggested department (Engineering, Data Science, DevOps, etc.)",
    "skills": ["skill1", "skill2", ...],
    "experience": "Brief summary of experience",
    "education": "Highest education"
}

For skills, match to these when possible:
Python, JavaScript, TypeScript, Rust, React, Next.js, Node.js, Machine Learning, 
Deep Learning, Natural Language Processing, Data Analysis, Docker, Kubernetes, 
AWS, CI/CD, SurrealDB, PostgreSQL, SQL, Problem Solving, Communication, Leadership

If a field is not found, use null or empty array for skills.`
            },
            { role: 'user', content: `Parse this resume:\n\n${text.slice(0, 4000)}` }
        ],
        temperature: 0.2,
        max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                name: parsed.name || 'Unknown',
                email: parsed.email || '',
                phone: parsed.phone || undefined,
                role: parsed.role || 'Employee',
                department: parsed.department || 'General',
                skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                experience: parsed.experience || undefined,
                education: parsed.education || undefined,
            };
        } catch {
            throw new Error('Failed to parse AI response as JSON');
        }
    }
    
    throw new Error('No valid JSON found in AI response');
}

// Create employee and skill relationships in SurrealDB
async function createEmployeeWithSkills(
    data: ParsedResume, 
    skillProficiencies?: { name: string; proficiency: number }[]
): Promise<CreatedEmployee> {
    const db = await getServerDB();
    
    // Build proficiency map for quick lookup
    const proficiencyMap = new Map<string, number>();
    if (skillProficiencies) {
        for (const sp of skillProficiencies) {
            proficiencyMap.set(sp.name.toLowerCase(), sp.proficiency);
        }
    }
    
    try {
        // Create employee record
        const createResult = await db.query<[{ id: string }[]]>(`
            CREATE employee CONTENT {
                name: $name,
                email: $email,
                department: $department,
                role: $role,
                profile: {
                    experience: $experience,
                    education: $education,
                    phone: $phone
                }
            }
        `, {
            name: data.name,
            email: data.email,
            department: data.department || 'General',
            role: data.role || 'Employee',
            experience: data.experience || null,
            education: data.education || null,
            phone: data.phone || null,
        });
        
        let employeeId = '';
        if (Array.isArray(createResult) && createResult.length > 0) {
            const records = createResult[0];
            if (Array.isArray(records) && records.length > 0) {
                employeeId = String(records[0].id);
            }
        }
        
        if (!employeeId) {
            throw new Error('Failed to create employee record');
        }
        
        // Link skills to employee
        const linkedSkills: string[] = [];
        
        for (const skillName of data.skills) {
            // Get proficiency from map or use default 3
            const proficiency = proficiencyMap.get(skillName.toLowerCase()) || 3;
            
            try {
                // First, try to find existing skill
                const findResult = await db.query<[{ id: string }[]]>(`
                    SELECT id FROM skill WHERE string::lowercase(name) = string::lowercase($name) LIMIT 1
                `, { name: skillName });

                let skillId: string | null = null;

                // Check if skill exists
                if (Array.isArray(findResult) && findResult.length > 0) {
                    const records = findResult[0];
                    if (Array.isArray(records) && records.length > 0 && records[0]?.id) {
                        skillId = String(records[0].id);
                    }
                }

                // If skill doesn't exist, create it
                if (!skillId) {
                    const createSkillResult = await db.query<[{ id: string }[]]>(`
                        CREATE skill CONTENT { name: $name, category: 'General' }
                    `, { name: skillName });

                    if (Array.isArray(createSkillResult) && createSkillResult.length > 0) {
                        const records = createSkillResult[0];
                        if (Array.isArray(records) && records.length > 0 && records[0]?.id) {
                            skillId = String(records[0].id);
                        }
                    }
                }

                if (skillId) {
                    // Create has_skill edge using RELATE with direct record IDs
                    // Ensure the IDs are in the format "employee:xxx" and "skill:xxx"
                    const empRecordId = employeeId.startsWith('employee:') ? employeeId : `employee:${employeeId}`;
                    const skillRecordId = skillId.startsWith('skill:') ? skillId : `skill:${skillId}`;
                    
                    await db.query(`
                        RELATE ${empRecordId}->has_skill->${skillRecordId} SET 
                            proficiency = $proficiency,
                            years = 1,
                            certified = false
                    `, { proficiency });
                    linkedSkills.push(skillName);
                }
            } catch (skillError) {
                console.error(`Failed to link skill "${skillName}":`, skillError);
            }
        }
        
        await db.close();
        
        return {
            id: employeeId,
            name: data.name,
            email: data.email,
            role: data.role || 'Employee',
            department: data.department || 'General',
            skillsLinked: linkedSkills,
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
        const { resumeText, createEmployee = false, skillProficiencies } = req.body;
        
        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({ error: 'resumeText is required' });
        }

        // Extract structured data from resume
        const parsedData = await extractResumeData(resumeText);
        
        // Optionally create employee and skill relationships
        let createdEmployee: CreatedEmployee | null = null;
        if (createEmployee) {
            if (!parsedData.email) {
                return res.status(400).json({ 
                    error: 'Cannot create employee without email',
                    parsed: parsedData 
                });
            }
            createdEmployee = await createEmployeeWithSkills(parsedData, skillProficiencies);
        }
        
        return res.status(200).json({
            parsed: parsedData,
            created: createdEmployee,
        });
        
    } catch (error) {
        console.error('Resume parser API error:', error);
        return res.status(500).json({ 
            error: 'Failed to parse resume',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
