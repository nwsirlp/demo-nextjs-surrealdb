-----------------------------
----- Table definitions -----
-----------------------------

-- Skill table representing capabilities/technologies
DEFINE TABLE skill SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;

-- Core skill fields
DEFINE FIELD name        ON TABLE skill TYPE string;
DEFINE FIELD category    ON TABLE skill TYPE string;
DEFINE FIELD description ON TABLE skill TYPE option<string>;

-- Tags for filtering and grouping
DEFINE FIELD tags        ON TABLE skill TYPE option<array<string>> DEFAULT [];

-- Vector embedding for semantic similarity
DEFINE FIELD embedding   ON TABLE skill TYPE option<array<float>>;

-- Timestamps
DEFINE FIELD created     ON TABLE skill VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE skill VALUE time::now();

-- Indexes
DEFINE INDEX name_idx ON TABLE skill COLUMNS name UNIQUE;
DEFINE INDEX category_idx ON TABLE skill COLUMNS category;

------------------------
----- Demo Content -----
------------------------

-- Programming Languages
CREATE skill:python SET
    name = "Python",
    category = "Programming Language",
    description = "General-purpose programming language known for readability and extensive libraries",
    tags = ["backend", "data-science", "scripting", "automation"],
    created = time::now(),
    updated = time::now();

CREATE skill:javascript SET
    name = "JavaScript",
    category = "Programming Language",
    description = "Dynamic programming language essential for web development",
    tags = ["frontend", "backend", "web", "nodejs"],
    created = time::now(),
    updated = time::now();

CREATE skill:typescript SET
    name = "TypeScript",
    category = "Programming Language",
    description = "Typed superset of JavaScript for large-scale applications",
    tags = ["frontend", "backend", "web", "type-safety"],
    created = time::now(),
    updated = time::now();

CREATE skill:rust SET
    name = "Rust",
    category = "Programming Language",
    description = "Systems programming language focused on safety and performance",
    tags = ["systems", "performance", "memory-safe"],
    created = time::now(),
    updated = time::now();

-- Frameworks & Libraries
CREATE skill:react SET
    name = "React",
    category = "Frontend Framework",
    description = "JavaScript library for building user interfaces",
    tags = ["frontend", "ui", "component-based", "spa"],
    created = time::now(),
    updated = time::now();

CREATE skill:nextjs SET
    name = "Next.js",
    category = "Frontend Framework",
    description = "React framework for production with SSR and SSG",
    tags = ["frontend", "fullstack", "react", "ssr"],
    created = time::now(),
    updated = time::now();

CREATE skill:nodejs SET
    name = "Node.js",
    category = "Runtime",
    description = "JavaScript runtime for server-side development",
    tags = ["backend", "javascript", "server"],
    created = time::now(),
    updated = time::now();

-- Data Science & ML
CREATE skill:machine_learning SET
    name = "Machine Learning",
    category = "AI/ML",
    description = "Building predictive models and pattern recognition systems",
    tags = ["ai", "data-science", "modeling", "prediction"],
    created = time::now(),
    updated = time::now();

CREATE skill:deep_learning SET
    name = "Deep Learning",
    category = "AI/ML",
    description = "Neural networks and advanced AI architectures",
    tags = ["ai", "neural-networks", "tensorflow", "pytorch"],
    created = time::now(),
    updated = time::now();

CREATE skill:nlp SET
    name = "Natural Language Processing",
    category = "AI/ML",
    description = "Processing and analyzing human language data",
    tags = ["ai", "text", "language", "transformers"],
    created = time::now(),
    updated = time::now();

CREATE skill:data_analysis SET
    name = "Data Analysis",
    category = "Data Science",
    description = "Extracting insights from data using statistical methods",
    tags = ["data-science", "analytics", "statistics"],
    created = time::now(),
    updated = time::now();

-- DevOps & Infrastructure
CREATE skill:docker SET
    name = "Docker",
    category = "DevOps",
    description = "Container platform for application deployment",
    tags = ["devops", "containers", "deployment"],
    created = time::now(),
    updated = time::now();

CREATE skill:kubernetes SET
    name = "Kubernetes",
    category = "DevOps",
    description = "Container orchestration platform",
    tags = ["devops", "containers", "orchestration", "cloud"],
    created = time::now(),
    updated = time::now();

CREATE skill:aws SET
    name = "AWS",
    category = "Cloud Platform",
    description = "Amazon Web Services cloud infrastructure",
    tags = ["cloud", "infrastructure", "services"],
    created = time::now(),
    updated = time::now();

CREATE skill:cicd SET
    name = "CI/CD",
    category = "DevOps",
    description = "Continuous integration and deployment pipelines",
    tags = ["devops", "automation", "deployment", "testing"],
    created = time::now(),
    updated = time::now();

-- Databases
CREATE skill:surrealdb SET
    name = "SurrealDB",
    category = "Database",
    description = "Multi-model database with graph, document, and relational capabilities",
    tags = ["database", "nosql", "graph", "multi-model"],
    created = time::now(),
    updated = time::now();

CREATE skill:postgresql SET
    name = "PostgreSQL",
    category = "Database",
    description = "Advanced open-source relational database",
    tags = ["database", "sql", "relational"],
    created = time::now(),
    updated = time::now();

CREATE skill:sql SET
    name = "SQL",
    category = "Query Language",
    description = "Structured Query Language for database management",
    tags = ["database", "query", "data"],
    created = time::now(),
    updated = time::now();

-- Soft Skills
CREATE skill:problem_solving SET
    name = "Problem Solving",
    category = "Soft Skill",
    description = "Analytical thinking and creative solution development",
    tags = ["soft-skill", "analytical", "critical-thinking"],
    created = time::now(),
    updated = time::now();

CREATE skill:communication SET
    name = "Communication",
    category = "Soft Skill",
    description = "Clear and effective verbal and written communication",
    tags = ["soft-skill", "teamwork", "presentation"],
    created = time::now(),
    updated = time::now();

CREATE skill:leadership SET
    name = "Leadership",
    category = "Soft Skill",
    description = "Leading teams and driving initiatives",
    tags = ["soft-skill", "management", "mentoring"],
    created = time::now(),
    updated = time::now();
