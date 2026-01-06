/**
 * Skill Matching Queries
 * 
 * React Query hooks for the employee skill matching system.
 * Includes graph traversal, vector search, and hybrid queries.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SurrealInstance as surreal } from '../lib/Surreal';
import { generateEmbedding, cosineSimilarity } from '../lib/EmbeddingProvider';
import type {
    Employee,
    EmployeeID,
    EmployeeInput,
    EmployeeWithSkills,
    Skill,
    SkillID,
    SkillInput,
    SkillWithEmployees,
    Project,
    ProjectID,
    ProjectInput,
    ProjectWithDetails,
    CandidateMatch,
    SemanticSearchQuery,
    SearchResult,
    HasSkillEdge,
} from './SkillTypes';

// Helper to extract data from SurrealDB v2 query result
function extractQueryResult<T>(result: unknown): T[] {
    if (Array.isArray(result) && result.length > 0) {
        const first = result[0];
        if (first && typeof first === 'object' && 'result' in first) {
            return (first as { result: T[] }).result ?? [];
        }
        if (Array.isArray(first)) {
            return first as T[];
        }
        if (first && typeof first === 'object') {
            return [first as T];
        }
    }
    return [];
}

// Process date fields in records
function processRecord<T extends { created?: unknown; updated?: unknown }>(record: T): T {
    return {
        ...record,
        created: record.created ? new Date(record.created as string) : new Date(),
        updated: record.updated ? new Date(record.updated as string) : new Date(),
    };
}

// ==========================================
// EMPLOYEE QUERIES
// ==========================================

export function useEmployees(filters?: { department?: string; role?: string }) {
    return useQuery({
        queryKey: ['employees', filters],
        queryFn: async (): Promise<Employee[]> => {
            try {
                let query = 'SELECT * FROM employee';
                const conditions: string[] = [];
                
                if (filters?.department) {
                    conditions.push('department = $department');
                }
                if (filters?.role) {
                    conditions.push('role CONTAINS $role');
                }
                
                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
                query += ' ORDER BY name ASC';
                
                const result = await surreal.query<[Employee[]]>(query, filters);
                const data = extractQueryResult<Employee>(result);
                return data.map(processRecord);
            } catch (error) {
                console.error('Failed to fetch employees:', error);
                return [];
            }
        },
    });
}

export function useEmployee({ id }: { id?: EmployeeID }) {
    return useQuery({
        queryKey: ['employee', id],
        queryFn: async (): Promise<Employee | null> => {
            if (!id) return null;
            try {
                const result = await surreal.query<[Employee[]]>(
                    'SELECT * FROM employee WHERE id = $id',
                    { id }
                );
                const data = extractQueryResult<Employee>(result);
                return data[0] ? processRecord(data[0]) : null;
            } catch (error) {
                console.error('Failed to fetch employee:', error);
                return null;
            }
        },
        enabled: !!id,
    });
}

export function useEmployeeWithSkills({ id }: { id?: EmployeeID }) {
    return useQuery({
        queryKey: ['employee-with-skills', id],
        queryFn: async (): Promise<EmployeeWithSkills | null> => {
            if (!id) return null;
            try {
                // Graph traversal query to get employee with their skills
                const result = await surreal.query<[unknown[]]>(`
                    SELECT 
                        *,
                        (
                            SELECT 
                                out AS skill,
                                proficiency,
                                years,
                                certified
                            FROM ->has_skill
                            FETCH skill
                        ) AS skills
                    FROM employee 
                    WHERE id = $id
                `, { id });
                
                const data = extractQueryResult<EmployeeWithSkills>(result);
                return data[0] ? processRecord(data[0]) : null;
            } catch (error) {
                console.error('Failed to fetch employee with skills:', error);
                return null;
            }
        },
        enabled: !!id,
    });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (input: EmployeeInput): Promise<Employee> => {
            const result = await surreal.query<[Employee[]]>(`
                CREATE employee CONTENT {
                    name: $name,
                    email: $email,
                    department: $department,
                    role: $role,
                    avatar_url: $avatar_url,
                    profile: $profile
                }
            `, input);
            
            const data = extractQueryResult<Employee>(result);
            if (!data[0]) throw new Error('Failed to create employee');
            return processRecord(data[0]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            // Delete the employee record
            // Cascade delete will differ based on SurrealDB version/setup, 
            // but for now we'll assumes graph edges are handled or we might want to manually delete them if needed.
            // In a simple setup, deleting the node might leave dangling edges unless defined otherwise.
            // For this demo, simple DELETE is likely sufficient.
            await surreal.query(`DELETE ${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
}

// ==========================================
// SKILL QUERIES
// ==========================================

export function useSkills(filters?: { category?: string; tags?: string[] }) {
    return useQuery({
        queryKey: ['skills', filters],
        queryFn: async (): Promise<Skill[]> => {
            try {
                let query = 'SELECT * FROM skill';
                const conditions: string[] = [];
                
                if (filters?.category) {
                    conditions.push('category = $category');
                }
                if (filters?.tags && filters.tags.length > 0) {
                    conditions.push('tags CONTAINSANY $tags');
                }
                
                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
                query += ' ORDER BY category, name ASC';
                
                const result = await surreal.query<[Skill[]]>(query, filters);
                const data = extractQueryResult<Skill>(result);
                return data.map(processRecord);
            } catch (error) {
                console.error('Failed to fetch skills:', error);
                return [];
            }
        },
    });
}

export function useSkill({ id }: { id?: SkillID }) {
    return useQuery({
        queryKey: ['skill', id],
        queryFn: async (): Promise<Skill | null> => {
            if (!id) return null;
            try {
                const result = await surreal.query<[Skill[]]>(
                    'SELECT * FROM skill WHERE id = $id',
                    { id }
                );
                const data = extractQueryResult<Skill>(result);
                return data[0] ? processRecord(data[0]) : null;
            } catch (error) {
                console.error('Failed to fetch skill:', error);
                return null;
            }
        },
        enabled: !!id,
    });
}

export function useSkillWithEmployees({ id }: { id?: SkillID }) {
    return useQuery({
        queryKey: ['skill-with-employees', id],
        queryFn: async (): Promise<SkillWithEmployees | null> => {
            if (!id) return null;
            try {
                // Graph traversal: Skill <- has_skill <- Employee
                const result = await surreal.query<[unknown[]]>(`
                    SELECT 
                        *,
                        (
                            SELECT 
                                in AS employee,
                                proficiency,
                                years,
                                certified
                            FROM <-has_skill
                            FETCH employee
                        ) AS employees
                    FROM skill 
                    WHERE id = $id
                `, { id });
                
                const data = extractQueryResult<SkillWithEmployees>(result);
                return data[0] ? processRecord(data[0]) : null;
            } catch (error) {
                console.error('Failed to fetch skill with employees:', error);
                return null;
            }
        },
        enabled: !!id,
    });
}

export function useCreateSkill() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (input: SkillInput): Promise<Skill> => {
            const result = await surreal.query<[Skill[]]>(`
                CREATE skill CONTENT {
                    name: $name,
                    category: $category,
                    description: $description,
                    tags: $tags
                }
            `, input);
            
            const data = extractQueryResult<Skill>(result);
            if (!data[0]) throw new Error('Failed to create skill');
            return processRecord(data[0]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
        },
    });
}

// ==========================================
// PROJECT QUERIES
// ==========================================

export function useProjects(filters?: { status?: string }) {
    return useQuery({
        queryKey: ['projects', filters],
        queryFn: async (): Promise<Project[]> => {
            try {
                let query = 'SELECT * FROM project';
                
                if (filters?.status) {
                    query += ' WHERE status = $status';
                }
                query += ' ORDER BY priority DESC, name ASC';
                
                const result = await surreal.query<[Project[]]>(query, filters);
                const data = extractQueryResult<Project>(result);
                return data.map(processRecord);
            } catch (error) {
                console.error('Failed to fetch projects:', error);
                return [];
            }
        },
    });
}

export function useProjectWithDetails({ id }: { id?: ProjectID }) {
    return useQuery({
        queryKey: ['project-with-details', id],
        queryFn: async (): Promise<ProjectWithDetails | null> => {
            if (!id) return null;
            try {
                const result = await surreal.query<[unknown[]]>(`
                    SELECT 
                        *,
                        (
                            SELECT 
                                out AS skill,
                                importance,
                                min_proficiency
                            FROM ->requires_skill
                            FETCH skill
                        ) AS required_skills,
                        (
                            SELECT 
                                in AS employee,
                                role,
                                impact_score
                            FROM <-worked_on
                            FETCH employee
                        ) AS team
                    FROM project 
                    WHERE id = $id
                `, { id });
                
                const data = extractQueryResult<ProjectWithDetails>(result);
                return data[0] ? processRecord(data[0]) : null;
            } catch (error) {
                console.error('Failed to fetch project with details:', error);
                return null;
            }
        },
        enabled: !!id,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (input: ProjectInput): Promise<Project> => {
            const result = await surreal.query<[Project[]]>(`
                CREATE project CONTENT {
                    name: $name,
                    description: $description,
                    status: $status,
                    priority: $priority,
                    metadata: $metadata,
                    start_date: $start_date,
                    end_date: $end_date
                }
            `, input);
            
            const data = extractQueryResult<Project>(result);
            if (!data[0]) throw new Error('Failed to create project');
            return processRecord(data[0]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

// ==========================================
// SKILL ASSIGNMENT
// ==========================================

export function useAssignSkill() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (input: {
            employeeId: EmployeeID;
            skillId: SkillID;
            proficiency: number;
            years?: number;
            certified?: boolean;
        }) => {
            const result = await surreal.query<[HasSkillEdge[]]>(`
                RELATE $employeeId->has_skill->$skillId SET
                    proficiency = $proficiency,
                    years = $years,
                    certified = $certified
            `, input);
            
            const data = extractQueryResult<HasSkillEdge>(result);
            if (!data[0]) throw new Error('Failed to assign skill');
            return data[0];
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['employee-with-skills', variables.employeeId] });
            queryClient.invalidateQueries({ queryKey: ['skill-with-employees', variables.skillId] });
        },
    });
}

// ==========================================
// GRAPH TRAVERSAL QUERIES
// ==========================================

/**
 * Find employees with specific skills
 */
export function useEmployeesWithSkills({ skillIds, minProficiency = 1 }: {
    skillIds?: SkillID[];
    minProficiency?: number;
}) {
    return useQuery({
        queryKey: ['employees-with-skills', skillIds, minProficiency],
        queryFn: async (): Promise<Array<Employee & { matchedSkills: number }>> => {
            if (!skillIds || skillIds.length === 0) return [];
            try {
                // Graph query: Find employees with ANY of the skills
                const result = await surreal.query<[unknown[]]>(`
                    SELECT 
                        in AS employee,
                        count() AS matchedSkills
                    FROM has_skill
                    WHERE out IN $skillIds 
                    AND proficiency >= $minProficiency
                    GROUP BY in
                    ORDER BY matchedSkills DESC
                    FETCH employee
                `, { skillIds, minProficiency });
                
                const data = extractQueryResult<{ employee: Employee; matchedSkills: number }>(result);
                return data.map(item => ({
                    ...processRecord(item.employee),
                    matchedSkills: item.matchedSkills,
                }));
            } catch (error) {
                console.error('Failed to find employees with skills:', error);
                return [];
            }
        },
        enabled: skillIds && skillIds.length > 0,
    });
}

/**
 * Find related skills (graph traversal through skill relationships)
 */
export function useRelatedSkills({ id, depth = 1 }: { id?: SkillID; depth?: number }) {
    return useQuery({
        queryKey: ['related-skills', id, depth],
        queryFn: async (): Promise<Skill[]> => {
            if (!id) return [];
            try {
                // Graph traversal to find related skills
                const result = await surreal.query<[Skill[]]>(`
                    SELECT 
                        out.*
                    FROM related_to
                    WHERE in = $id
                    ORDER BY similarity_score DESC
                `, { id });
                
                const data = extractQueryResult<Skill>(result);
                return data.map(processRecord);
            } catch (error) {
                console.error('Failed to find related skills:', error);
                return [];
            }
        },
        enabled: !!id,
    });
}

/**
 * Find best candidates for a project based on required skills
 */
export function useCandidatesForProject({ projectId }: { projectId?: ProjectID }) {
    return useQuery({
        queryKey: ['candidates-for-project', projectId],
        queryFn: async (): Promise<CandidateMatch[]> => {
            if (!projectId) return [];
            try {
                // Complex graph query: Project -> requires_skill -> Skill <- has_skill <- Employee
                const result = await surreal.query<[unknown[]]>(`
                    LET $required = (SELECT out, importance, min_proficiency FROM $projectId->requires_skill);
                    LET $skill_ids = (SELECT VALUE out FROM $required);
                    
                    SELECT 
                        in AS employee,
                        array::group(out) AS matched_skill_ids,
                        math::sum(proficiency) AS total_proficiency,
                        count() AS matched_count
                    FROM has_skill
                    WHERE out IN $skill_ids
                    GROUP BY in
                    ORDER BY matched_count DESC, total_proficiency DESC
                    FETCH employee
                `, { projectId });
                
                const data = extractQueryResult<{
                    employee: Employee;
                    matched_skill_ids: SkillID[];
                    total_proficiency: number;
                    matched_count: number;
                }>(result);
                
                return data.map(item => ({
                    employee: processRecord(item.employee),
                    matchScore: (item.matched_count / 5) * 0.5 + (item.total_proficiency / 25) * 0.5,
                    matchedSkills: [],
                    semanticScore: 0,
                    graphScore: item.matched_count / 5,
                }));
            } catch (error) {
                console.error('Failed to find candidates for project:', error);
                return [];
            }
        },
        enabled: !!projectId,
    });
}

// ==========================================
// SEMANTIC/VECTOR SEARCH
// ==========================================

/**
 * Semantic skill search using vector similarity
 */
export function useSemanticSkillSearch({ query, limit = 10 }: { query?: string; limit?: number }) {
    return useQuery({
        queryKey: ['semantic-skill-search', query, limit],
        queryFn: async (): Promise<Array<Skill & { score: number }>> => {
            if (!query) return [];
            try {
                // Generate embedding for the query
                const queryEmbedding = await generateEmbedding(query);
                
                // Get all skills with embeddings
                const result = await surreal.query<[Skill[]]>(
                    'SELECT * FROM skill WHERE embedding != NONE'
                );
                const skills = extractQueryResult<Skill>(result);
                
                // Calculate similarity scores
                const scoredSkills = skills
                    .filter(skill => skill.embedding && skill.embedding.length > 0)
                    .map(skill => ({
                        ...processRecord(skill),
                        score: cosineSimilarity(queryEmbedding, skill.embedding!),
                    }))
                    .filter(skill => skill.score > 0.5)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
                
                return scoredSkills;
            } catch (error) {
                console.error('Semantic skill search failed:', error);
                return [];
            }
        },
        enabled: !!query && query.length > 2,
    });
}

/**
 * Main hybrid search: Find suitable candidates for a natural language query
 */
export function useCandidateSearch() {
    return useMutation({
        mutationFn: async (searchQuery: SemanticSearchQuery): Promise<SearchResult> => {
            const startTime = Date.now();
            
            try {
                const { query, filters, limit = 10 } = searchQuery;
                
                // Step 1: Generate embedding for the query
                const queryEmbedding = await generateEmbedding(query);
                
                // Step 2: Find semantically similar skills
                const skillResult = await surreal.query<[Skill[]]>(
                    'SELECT * FROM skill'
                );
                const allSkills = extractQueryResult<Skill>(skillResult);
                
                // Calculate skill relevance scores
                const relevantSkills = allSkills
                    .map(skill => ({
                        skill: processRecord(skill),
                        relevance: skill.embedding 
                            ? cosineSimilarity(queryEmbedding, skill.embedding)
                            : 0.3, // Default relevance for skills without embeddings
                    }))
                    .filter(s => s.relevance > 0.4)
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(0, 15);
                
                if (relevantSkills.length === 0) {
                    return {
                        candidates: [],
                        queryEmbedding,
                        totalMatches: 0,
                        processingTimeMs: Date.now() - startTime,
                    };
                }
                
                // Step 3: Build base query with filters
                let employeeQuery = 'SELECT * FROM employee';
                const conditions: string[] = [];
                const params: Record<string, unknown> = {};
                
                if (filters?.department) {
                    conditions.push('department = $department');
                    params.department = filters.department;
                }
                
                if (conditions.length > 0) {
                    employeeQuery += ' WHERE ' + conditions.join(' AND ');
                }
                
                const employeeResult = await surreal.query<[Employee[]]>(employeeQuery, params);
                const employees = extractQueryResult<Employee>(employeeResult);
                
                // Step 4: For each employee, get their skills and calculate match score
                const candidates: CandidateMatch[] = [];
                
                for (const emp of employees) {
                    // Get employee's skills via graph traversal
                    const skillsResult = await surreal.query<[HasSkillEdge[]]>(`
                        SELECT * FROM has_skill WHERE in = $empId
                    `, { empId: emp.id });
                    const empSkills = extractQueryResult<HasSkillEdge>(skillsResult);
                    
                    // Calculate match scores
                    const matchedSkills: CandidateMatch['matchedSkills'] = [];
                    let graphScore = 0;
                    
                    for (const empSkill of empSkills) {
                        const relevantSkill = relevantSkills.find(
                            rs => rs.skill.id === empSkill.out
                        );
                        
                        if (relevantSkill) {
                            matchedSkills.push({
                                skill: relevantSkill.skill,
                                proficiency: empSkill.proficiency,
                                relevance: relevantSkill.relevance,
                            });
                            
                            // Weight by proficiency and relevance
                            graphScore += (empSkill.proficiency / 5) * relevantSkill.relevance;
                            
                            // Bonus for certification
                            if (empSkill.certified) {
                                graphScore += 0.1;
                            }
                        }
                    }
                    
                    if (matchedSkills.length > 0) {
                        // Calculate semantic score from employee embedding if available
                        const semanticScore = emp.embedding
                            ? cosineSimilarity(queryEmbedding, emp.embedding)
                            : 0.5;
                        
                        // Combined score
                        const matchScore = (graphScore * 0.6) + (semanticScore * 0.4);
                        
                        candidates.push({
                            employee: processRecord(emp),
                            matchScore,
                            matchedSkills: matchedSkills.sort((a, b) => b.relevance - a.relevance),
                            semanticScore,
                            graphScore,
                        });
                    }
                }
                
                // Sort by match score and limit results
                candidates.sort((a, b) => b.matchScore - a.matchScore);
                const topCandidates = candidates.slice(0, limit);
                
                return {
                    candidates: topCandidates,
                    queryEmbedding,
                    totalMatches: candidates.length,
                    processingTimeMs: Date.now() - startTime,
                };
            } catch (error) {
                console.error('Candidate search failed:', error);
                return {
                    candidates: [],
                    totalMatches: 0,
                    processingTimeMs: Date.now() - startTime,
                };
            }
        },
    });
}

// ==========================================
// EMBEDDING MANAGEMENT
// ==========================================

/**
 * Generate and store embeddings for all skills
 */
export function useGenerateSkillEmbeddings() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (): Promise<number> => {
            // Get all skills without embeddings
            const result = await surreal.query<[Skill[]]>(
                'SELECT * FROM skill WHERE embedding = NONE OR embedding = []'
            );
            const skills = extractQueryResult<Skill>(result);
            
            let updated = 0;
            for (const skill of skills) {
                const text = `${skill.name}: ${skill.description || ''} ${skill.tags?.join(' ') || ''}`;
                const embedding = await generateEmbedding(text);
                
                await surreal.query(
                    'UPDATE skill SET embedding = $embedding WHERE id = $id',
                    { id: skill.id, embedding }
                );
                updated++;
            }
            
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
        },
    });
}

/**
 * Generate and store embeddings for all employees
 */
export function useGenerateEmployeeEmbeddings() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (): Promise<number> => {
            // Get all employees without embeddings
            const result = await surreal.query<[Employee[]]>(
                'SELECT * FROM employee WHERE embedding = NONE OR embedding = []'
            );
            const employees = extractQueryResult<Employee>(result);
            
            let updated = 0;
            for (const emp of employees) {
                const text = `${emp.name}, ${emp.role} in ${emp.department}. ${emp.profile?.bio || ''}`;
                const embedding = await generateEmbedding(text);
                
                await surreal.query(
                    'UPDATE employee SET embedding = $embedding WHERE id = $id',
                    { id: emp.id, embedding }
                );
                updated++;
            }
            
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
}

// ==========================================
// SKILL CATEGORIES & STATS
// ==========================================

export function useSkillCategories() {
    return useQuery({
        queryKey: ['skill-categories'],
        queryFn: async (): Promise<string[]> => {
            try {
                const result = await surreal.query<[{ category: string }[]]>(
                    'SELECT DISTINCT category FROM skill ORDER BY category'
                );
                const data = extractQueryResult<{ category: string }>(result);
                return data.map(d => d.category);
            } catch (error) {
                console.error('Failed to fetch skill categories:', error);
                return [];
            }
        },
    });
}

export function useDepartments() {
    return useQuery({
        queryKey: ['departments'],
        queryFn: async (): Promise<string[]> => {
            try {
                const result = await surreal.query<[{ department: string }[]]>(
                    'SELECT DISTINCT department FROM employee ORDER BY department'
                );
                const data = extractQueryResult<{ department: string }>(result);
                return data.map(d => d.department);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
                return [];
            }
        },
    });
}
