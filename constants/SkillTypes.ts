////////////////////////
//////// EMPLOYEES ///////
////////////////////////

export type EmployeeID = `employee:${string}`;

export type EmployeeProfile = {
    bio?: string;
    location?: string;
    years_experience?: number;
    education?: string;
    certifications?: string[];
    languages?: string[];
};

export type Employee = {
    id: EmployeeID;
    name: string;
    email: string;
    department: string;
    role: string;
    avatar_url?: string;
    profile?: EmployeeProfile;
    embedding?: number[];
    created: Date;
    updated: Date;
};

export type EmployeeInput = Pick<Employee, 'name' | 'email' | 'department' | 'role'> & {
    avatar_url?: string;
    profile?: EmployeeProfile;
};

////////////////////////
//////// SKILLS /////////
////////////////////////

export type SkillID = `skill:${string}`;

export type SkillCategory =
    | 'Programming Language'
    | 'Frontend Framework'
    | 'Backend Framework'
    | 'Database'
    | 'DevOps'
    | 'Cloud Platform'
    | 'AI/ML'
    | 'Data Science'
    | 'Query Language'
    | 'Runtime'
    | 'Soft Skill'
    | string;

export type Skill = {
    id: SkillID;
    name: string;
    category: SkillCategory;
    description?: string;
    tags?: string[];
    embedding?: number[];
    created: Date;
    updated: Date;
};

export type SkillInput = Pick<Skill, 'name' | 'category'> & {
    description?: string;
    tags?: string[];
};

////////////////////////
//////// PROJECTS ///////
////////////////////////

export type ProjectID = `project:${string}`;

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';

export type ProjectMetadata = {
    team_size?: number;
    budget?: string;
    client?: string;
    target_cloud?: string;
    estimated_duration?: string;
    stakeholders?: string[];
    data_sources?: string[];
    [key: string]: unknown;
};

export type Project = {
    id: ProjectID;
    name: string;
    description?: string;
    status: ProjectStatus;
    priority?: string;
    metadata?: ProjectMetadata;
    embedding?: number[];
    start_date?: Date;
    end_date?: Date;
    created: Date;
    updated: Date;
};

export type ProjectInput = Pick<Project, 'name' | 'status'> & {
    description?: string;
    priority?: string;
    metadata?: ProjectMetadata;
    start_date?: Date;
    end_date?: Date;
};

////////////////////////
//////// EDGES //////////
////////////////////////

// has_skill: Employee -> Skill
export type HasSkillEdge = {
    id: string;
    in: EmployeeID;
    out: SkillID;
    proficiency: number; // 1-5
    years?: number;
    certified: boolean;
    endorsed_by?: EmployeeID[];
    notes?: string;
    created: Date;
    updated: Date;
};

// related_to: Skill -> Skill
export type SkillRelationType = 
    | 'parent' 
    | 'child' 
    | 'synonym' 
    | 'prerequisite' 
    | 'commonly_used_with' 
    | 'alternative'
    | 'related';

export type RelatedToEdge = {
    id: string;
    in: SkillID;
    out: SkillID;
    similarity_score: number; // 0-1
    type: SkillRelationType;
    created: Date;
};

// worked_on: Employee -> Project
export type WorkedOnEdge = {
    id: string;
    in: EmployeeID;
    out: ProjectID;
    role?: string;
    contribution?: string;
    start_date?: Date;
    end_date?: Date;
    impact_score?: number; // 1-5
    created: Date;
    updated: Date;
};

// requires_skill: Project -> Skill
export type SkillImportance = 'required' | 'preferred' | 'nice_to_have';

export type RequiresSkillEdge = {
    id: string;
    in: ProjectID;
    out: SkillID;
    importance: SkillImportance;
    min_proficiency: number; // 1-5
    created: Date;
};

////////////////////////
// ENRICHED TYPES ///////
////////////////////////

// Employee with their skills populated
export type EmployeeWithSkills = Employee & {
    skills: Array<{
        skill: Skill;
        proficiency: number;
        years?: number;
        certified: boolean;
    }>;
};

// Skill with employees who have it
export type SkillWithEmployees = Skill & {
    employees: Array<{
        employee: Employee;
        proficiency: number;
        years?: number;
        certified: boolean;
    }>;
};

// Project with required skills and team
export type ProjectWithDetails = Project & {
    required_skills: Array<{
        skill: Skill;
        importance: SkillImportance;
        min_proficiency: number;
    }>;
    team: Array<{
        employee: Employee;
        role?: string;
        impact_score?: number;
    }>;
};

////////////////////////
// SEARCH TYPES /////////
////////////////////////

export type SemanticSearchQuery = {
    query: string;
    filters?: {
        department?: string;
        minProficiency?: number;
        skills?: SkillID[];
        certified?: boolean;
    };
    limit?: number;
};

export type CandidateMatch = {
    employee: Employee;
    matchScore: number;
    matchedSkills: Array<{
        skill: Skill;
        proficiency: number;
        relevance: number;
    }>;
    semanticScore: number;
    graphScore: number;
};

export type SearchResult = {
    candidates: CandidateMatch[];
    queryEmbedding?: number[];
    totalMatches: number;
    processingTimeMs: number;
};

////////////////////////
// CHAT TYPES ///////////
////////////////////////

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    searchResults?: CandidateMatch[];
};

export type ChatSession = {
    id: string;
    messages: ChatMessage[];
    created: Date;
    updated: Date;
};
