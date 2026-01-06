--------------------------------------------
----- REBUILD DATABASE SCRIPT -----
--------------------------------------------
-- Run this AFTER reset_db.surql to rebuild all tables with demo data
-- Execute in order: 1) reset_db.surql  2) rebuild_db.surql

--------------------------------------------
----- 1. USER TABLE & ACCESS -----
--------------------------------------------

DEFINE TABLE user SCHEMAFULL
    PERMISSIONS 
        FOR select WHERE $auth != NONE
        FOR create NONE
        FOR update, delete WHERE id = $auth.id;

DEFINE FIELD name       ON TABLE user TYPE string;
DEFINE FIELD username   ON TABLE user TYPE string;
DEFINE FIELD password   ON TABLE user TYPE string
    PERMISSIONS 
        FOR select NONE
        FOR update, delete WHERE id = $auth.id;
DEFINE FIELD created    ON TABLE user VALUE $before OR time::now();
DEFINE FIELD updated    ON TABLE user VALUE time::now();

DEFINE INDEX username ON TABLE user COLUMNS username UNIQUE;

-- Define access method for user authentication (SurrealDB 2.x syntax)
DEFINE ACCESS user ON DATABASE TYPE RECORD
    SIGNUP (
        CREATE user SET 
            name = $name, 
            username = $username, 
            password = crypto::argon2::generate($password)
    )
    SIGNIN (
        SELECT * FROM user 
        WHERE username = $username 
        AND crypto::argon2::compare(password, $password)
    )
    DURATION FOR SESSION 7d;

-- Demo users
CREATE user:cld0r5z5q000008mg803v0dhe CONTENT {
    name: "Micha de Vries",
    username: "michadevries",
    password: crypto::argon2::generate("Password1!"),
    created: time::now(),
    updated: time::now()
};

CREATE user:cld0r7j69000108mg39w4fs4d CONTENT {
    name: "John Doe",
    username: "johndoe",
    password: crypto::argon2::generate("Password1!"),
    created: time::now(),
    updated: time::now()
};

--------------------------------------------
----- 2. POST TABLE -----
--------------------------------------------

DEFINE TABLE post SCHEMAFULL
    PERMISSIONS 
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD title   ON TABLE post TYPE string;
DEFINE FIELD body    ON TABLE post TYPE string;
DEFINE FIELD author  ON TABLE post TYPE option<record<user>> VALUE $value OR $before OR IF $auth != NONE THEN $auth.id ELSE NONE END;
DEFINE FIELD created ON TABLE post VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE post VALUE time::now();

-- Demo posts
CREATE post CONTENT {
    title: "SurrealDB is awesome!",
    author: user:cld0r7j69000108mg39w4fs4d,
    body: "Are you getting tired of serverless? Well, the next big thing is around the corner. Get buckled up!

SurrealDB allows to you write backendless applications, as I like to call it.",
    created: time::now(),
    updated: time::now()
};

CREATE post CONTENT {
    title: "This blog was written with SurrealDB",
    author: user:cld0r5z5q000008mg803v0dhe,
    body: "It was actually quite easy, and in total it took me about an hour and 30 minutes.

I ran a SurrealDB instance locally, migrate the database with the table & field definitions. This took around 2 minutes.

Now, I was able to spend the rest of my 88 minutes on writing the frontend. In this time I learned how to use tailwind and how to use react query too!

This is absolutely a bless",
    created: time::now(),
    updated: time::now()
};

CREATE post CONTENT {
    title: "Introducing: authentication!",
    author: user:cld0r7j69000108mg39w4fs4d,
    body: "You can now create an account and signin to create & manage posts!
    
We use some cool js & react-query magic here to make it work flawlessly. Check it out!",
    created: time::now(),
    updated: time::now()
};

--------------------------------------------
----- 3. EMPLOYEE TABLE -----
--------------------------------------------

DEFINE TABLE employee SCHEMAFULL
    PERMISSIONS 
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD name        ON TABLE employee TYPE string;
DEFINE FIELD email       ON TABLE employee TYPE string;
DEFINE FIELD department  ON TABLE employee TYPE string;
DEFINE FIELD role        ON TABLE employee TYPE string;
DEFINE FIELD avatar_url  ON TABLE employee TYPE option<string>;
DEFINE FIELD profile     ON TABLE employee TYPE option<object> FLEXIBLE;
DEFINE FIELD embedding   ON TABLE employee TYPE option<array<float>>;
DEFINE FIELD created     ON TABLE employee VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE employee VALUE time::now();

DEFINE INDEX email_idx ON TABLE employee COLUMNS email UNIQUE;
DEFINE INDEX dept_idx ON TABLE employee COLUMNS department;
DEFINE INDEX role_idx ON TABLE employee COLUMNS role;

-- Demo employees
CREATE employee:alice SET
    name = "Alice Chen",
    email = "alice.chen@company.com",
    department = "Engineering",
    role = "Senior Full-Stack Developer",
    profile = {
        bio: "Experienced developer with 8 years in web technologies. Passionate about clean code and scalable architectures.",
        location: "San Francisco, CA",
        years_experience: 8,
        languages: ["English", "Mandarin"]
    },
    created = time::now(),
    updated = time::now();

CREATE employee:bob SET
    name = "Bob Smith",
    email = "bob.smith@company.com",
    department = "Data Science",
    role = "ML Engineer",
    profile = {
        bio: "Machine learning specialist focused on NLP and recommendation systems. PhD in Computer Science.",
        location: "New York, NY",
        years_experience: 6,
        education: "PhD Computer Science, MIT"
    },
    created = time::now(),
    updated = time::now();

CREATE employee:carol SET
    name = "Carol Davis",
    email = "carol.davis@company.com",
    department = "Engineering",
    role = "DevOps Engineer",
    profile = {
        bio: "Infrastructure expert with deep experience in cloud platforms and CI/CD pipelines.",
        location: "Austin, TX",
        years_experience: 5,
        certifications: ["AWS Solutions Architect", "Kubernetes Administrator"]
    },
    created = time::now(),
    updated = time::now();

CREATE employee:david SET
    name = "David Lee",
    email = "david.lee@company.com",
    department = "Data Science",
    role = "Data Analyst",
    profile = {
        bio: "Data-driven analyst with strong visualization skills and business acumen.",
        location: "Chicago, IL",
        years_experience: 4
    },
    created = time::now(),
    updated = time::now();

CREATE employee:emma SET
    name = "Emma Wilson",
    email = "emma.wilson@company.com",
    department = "Engineering",
    role = "Frontend Developer",
    profile = {
        bio: "UI/UX focused developer who loves creating beautiful, accessible web experiences.",
        location: "Seattle, WA",
        years_experience: 5
    },
    created = time::now(),
    updated = time::now();

--------------------------------------------
----- 4. SKILL TABLE -----
--------------------------------------------

DEFINE TABLE skill SCHEMAFULL
    PERMISSIONS 
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD name        ON TABLE skill TYPE string;
DEFINE FIELD category    ON TABLE skill TYPE string;
DEFINE FIELD description ON TABLE skill TYPE option<string>;
DEFINE FIELD tags        ON TABLE skill TYPE option<array<string>> DEFAULT [];
DEFINE FIELD embedding   ON TABLE skill TYPE option<array<float>>;
DEFINE FIELD created     ON TABLE skill VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE skill VALUE time::now();

DEFINE INDEX name_idx ON TABLE skill COLUMNS name UNIQUE;
DEFINE INDEX category_idx ON TABLE skill COLUMNS category;

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

--------------------------------------------
----- 5. PROJECT TABLE -----
--------------------------------------------

DEFINE TABLE project SCHEMAFULL
    PERMISSIONS 
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD name        ON TABLE project TYPE string;
DEFINE FIELD description ON TABLE project TYPE option<string>;
DEFINE FIELD status      ON TABLE project TYPE string DEFAULT "active";
DEFINE FIELD priority    ON TABLE project TYPE option<string>;
DEFINE FIELD metadata    ON TABLE project TYPE option<object> FLEXIBLE;
DEFINE FIELD embedding   ON TABLE project TYPE option<array<float>>;
DEFINE FIELD start_date  ON TABLE project TYPE option<datetime>;
DEFINE FIELD end_date    ON TABLE project TYPE option<datetime>;
DEFINE FIELD created     ON TABLE project VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE project VALUE time::now();

DEFINE INDEX name_idx ON TABLE project COLUMNS name;
DEFINE INDEX status_idx ON TABLE project COLUMNS status;

-- Demo projects
CREATE project:ecommerce_platform SET
    name = "E-Commerce Platform Redesign",
    description = "Complete overhaul of the customer-facing e-commerce platform with modern UI/UX and improved performance",
    status = "active",
    priority = "high",
    metadata = {
        team_size: 5,
        budget: "150000",
        client: "Internal"
    },
    start_date = time::now(),
    created = time::now(),
    updated = time::now();

CREATE project:ml_recommendation SET
    name = "ML Recommendation Engine",
    description = "Build a machine learning system for personalized product recommendations based on user behavior",
    status = "active",
    priority = "high",
    metadata = {
        team_size: 3,
        model_type: "collaborative filtering"
    },
    start_date = time::now(),
    created = time::now(),
    updated = time::now();

CREATE project:devops_migration SET
    name = "Cloud Infrastructure Migration",
    description = "Migrate legacy on-premise infrastructure to AWS with Kubernetes orchestration",
    status = "planning",
    priority = "medium",
    metadata = {
        target_cloud: "AWS",
        estimated_duration: "6 months"
    },
    created = time::now(),
    updated = time::now();

CREATE project:analytics_dashboard SET
    name = "Executive Analytics Dashboard",
    description = "Real-time analytics dashboard for C-level executives with KPI tracking and data visualization",
    status = "active",
    priority = "medium",
    metadata = {
        stakeholders: ["CEO", "CFO", "CTO"],
        data_sources: ["sales", "marketing", "operations"]
    },
    start_date = time::now(),
    created = time::now(),
    updated = time::now();

--------------------------------------------
----- 6. EDGE TABLES (RELATIONS) -----
--------------------------------------------

-- HAS_SKILL: Employee -> Skill
DEFINE TABLE has_skill TYPE RELATION IN employee OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD proficiency ON TABLE has_skill TYPE int DEFAULT 3;
DEFINE FIELD years       ON TABLE has_skill TYPE option<float>;
DEFINE FIELD certified   ON TABLE has_skill TYPE bool DEFAULT false;
DEFINE FIELD endorsed_by ON TABLE has_skill TYPE option<array<record<employee>>>;
DEFINE FIELD notes       ON TABLE has_skill TYPE option<string>;
DEFINE FIELD created     ON TABLE has_skill VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE has_skill VALUE time::now();

DEFINE INDEX hs_proficiency_idx ON TABLE has_skill COLUMNS proficiency;

-- RELATED_TO: Skill -> Skill
DEFINE TABLE related_to TYPE RELATION IN skill OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD similarity_score ON TABLE related_to TYPE float DEFAULT 0.5;
DEFINE FIELD type             ON TABLE related_to TYPE string DEFAULT "related";
DEFINE FIELD created          ON TABLE related_to VALUE $before OR time::now();

DEFINE INDEX rt_type_idx ON TABLE related_to COLUMNS type;

-- WORKED_ON: Employee -> Project
DEFINE TABLE worked_on TYPE RELATION IN employee OUT project SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD role         ON TABLE worked_on TYPE option<string>;
DEFINE FIELD contribution ON TABLE worked_on TYPE option<string>;
DEFINE FIELD start_date   ON TABLE worked_on TYPE option<datetime>;
DEFINE FIELD end_date     ON TABLE worked_on TYPE option<datetime>;
DEFINE FIELD impact_score ON TABLE worked_on TYPE option<int>;
DEFINE FIELD created      ON TABLE worked_on VALUE $before OR time::now();
DEFINE FIELD updated      ON TABLE worked_on VALUE time::now();

-- REQUIRES_SKILL: Project -> Skill
DEFINE TABLE requires_skill TYPE RELATION IN project OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD importance      ON TABLE requires_skill TYPE string DEFAULT "preferred";
DEFINE FIELD min_proficiency ON TABLE requires_skill TYPE int DEFAULT 3;
DEFINE FIELD created         ON TABLE requires_skill VALUE $before OR time::now();

--------------------------------------------
----- 7. DEMO RELATIONSHIPS -----
--------------------------------------------

-- Alice's skills (Senior Full-Stack Developer)
RELATE employee:alice->has_skill->skill:python SET proficiency = 5, years = 6, certified = false;
RELATE employee:alice->has_skill->skill:javascript SET proficiency = 5, years = 8, certified = false;
RELATE employee:alice->has_skill->skill:typescript SET proficiency = 5, years = 4, certified = false;
RELATE employee:alice->has_skill->skill:react SET proficiency = 5, years = 5, certified = false;
RELATE employee:alice->has_skill->skill:nextjs SET proficiency = 4, years = 3, certified = false;
RELATE employee:alice->has_skill->skill:nodejs SET proficiency = 4, years = 6, certified = false;
RELATE employee:alice->has_skill->skill:postgresql SET proficiency = 4, years = 5, certified = false;
RELATE employee:alice->has_skill->skill:docker SET proficiency = 3, years = 3, certified = false;
RELATE employee:alice->has_skill->skill:problem_solving SET proficiency = 5, years = 8, certified = false;
RELATE employee:alice->has_skill->skill:communication SET proficiency = 4, years = 8, certified = false;

-- Bob's skills (ML Engineer)
RELATE employee:bob->has_skill->skill:python SET proficiency = 5, years = 6, certified = true;
RELATE employee:bob->has_skill->skill:machine_learning SET proficiency = 5, years = 5, certified = true;
RELATE employee:bob->has_skill->skill:deep_learning SET proficiency = 5, years = 4, certified = true;
RELATE employee:bob->has_skill->skill:nlp SET proficiency = 5, years = 4, certified = false;
RELATE employee:bob->has_skill->skill:data_analysis SET proficiency = 4, years = 5, certified = false;
RELATE employee:bob->has_skill->skill:sql SET proficiency = 4, years = 4, certified = false;
RELATE employee:bob->has_skill->skill:docker SET proficiency = 3, years = 2, certified = false;
RELATE employee:bob->has_skill->skill:problem_solving SET proficiency = 5, years = 6, certified = false;

-- Carol's skills (DevOps Engineer)
RELATE employee:carol->has_skill->skill:docker SET proficiency = 5, years = 5, certified = true;
RELATE employee:carol->has_skill->skill:kubernetes SET proficiency = 5, years = 4, certified = true;
RELATE employee:carol->has_skill->skill:aws SET proficiency = 5, years = 5, certified = true;
RELATE employee:carol->has_skill->skill:cicd SET proficiency = 5, years = 5, certified = false;
RELATE employee:carol->has_skill->skill:python SET proficiency = 3, years = 3, certified = false;
RELATE employee:carol->has_skill->skill:postgresql SET proficiency = 3, years = 3, certified = false;
RELATE employee:carol->has_skill->skill:problem_solving SET proficiency = 4, years = 5, certified = false;
RELATE employee:carol->has_skill->skill:leadership SET proficiency = 3, years = 2, certified = false;

-- David's skills (Data Analyst)
RELATE employee:david->has_skill->skill:python SET proficiency = 4, years = 4, certified = false;
RELATE employee:david->has_skill->skill:sql SET proficiency = 5, years = 4, certified = false;
RELATE employee:david->has_skill->skill:data_analysis SET proficiency = 5, years = 4, certified = false;
RELATE employee:david->has_skill->skill:postgresql SET proficiency = 4, years = 3, certified = false;
RELATE employee:david->has_skill->skill:machine_learning SET proficiency = 2, years = 1, certified = false;
RELATE employee:david->has_skill->skill:communication SET proficiency = 4, years = 4, certified = false;

-- Emma's skills (Frontend Developer)
RELATE employee:emma->has_skill->skill:javascript SET proficiency = 5, years = 5, certified = false;
RELATE employee:emma->has_skill->skill:typescript SET proficiency = 4, years = 3, certified = false;
RELATE employee:emma->has_skill->skill:react SET proficiency = 5, years = 5, certified = false;
RELATE employee:emma->has_skill->skill:nextjs SET proficiency = 4, years = 2, certified = false;
RELATE employee:emma->has_skill->skill:nodejs SET proficiency = 3, years = 2, certified = false;
RELATE employee:emma->has_skill->skill:communication SET proficiency = 5, years = 5, certified = false;
RELATE employee:emma->has_skill->skill:problem_solving SET proficiency = 4, years = 5, certified = false;

-- Skill relationships (taxonomy)
RELATE skill:typescript->related_to->skill:javascript SET similarity_score = 0.9, type = "parent";
RELATE skill:react->related_to->skill:javascript SET similarity_score = 0.8, type = "prerequisite";
RELATE skill:nextjs->related_to->skill:react SET similarity_score = 0.9, type = "parent";
RELATE skill:deep_learning->related_to->skill:machine_learning SET similarity_score = 0.9, type = "parent";
RELATE skill:nlp->related_to->skill:machine_learning SET similarity_score = 0.7, type = "parent";
RELATE skill:python->related_to->skill:machine_learning SET similarity_score = 0.7, type = "commonly_used_with";
RELATE skill:kubernetes->related_to->skill:docker SET similarity_score = 0.8, type = "commonly_used_with";
RELATE skill:aws->related_to->skill:kubernetes SET similarity_score = 0.6, type = "commonly_used_with";
RELATE skill:surrealdb->related_to->skill:postgresql SET similarity_score = 0.5, type = "alternative";
RELATE skill:data_analysis->related_to->skill:sql SET similarity_score = 0.7, type = "commonly_used_with";

-- Project skill requirements
RELATE project:ecommerce_platform->requires_skill->skill:react SET importance = "required", min_proficiency = 4;
RELATE project:ecommerce_platform->requires_skill->skill:typescript SET importance = "required", min_proficiency = 3;
RELATE project:ecommerce_platform->requires_skill->skill:nextjs SET importance = "preferred", min_proficiency = 3;
RELATE project:ecommerce_platform->requires_skill->skill:nodejs SET importance = "required", min_proficiency = 3;
RELATE project:ecommerce_platform->requires_skill->skill:postgresql SET importance = "required", min_proficiency = 3;

RELATE project:ml_recommendation->requires_skill->skill:python SET importance = "required", min_proficiency = 4;
RELATE project:ml_recommendation->requires_skill->skill:machine_learning SET importance = "required", min_proficiency = 4;
RELATE project:ml_recommendation->requires_skill->skill:deep_learning SET importance = "preferred", min_proficiency = 3;
RELATE project:ml_recommendation->requires_skill->skill:sql SET importance = "required", min_proficiency = 3;

RELATE project:devops_migration->requires_skill->skill:aws SET importance = "required", min_proficiency = 4;
RELATE project:devops_migration->requires_skill->skill:kubernetes SET importance = "required", min_proficiency = 4;
RELATE project:devops_migration->requires_skill->skill:docker SET importance = "required", min_proficiency = 4;
RELATE project:devops_migration->requires_skill->skill:cicd SET importance = "required", min_proficiency = 3;

RELATE project:analytics_dashboard->requires_skill->skill:data_analysis SET importance = "required", min_proficiency = 4;
RELATE project:analytics_dashboard->requires_skill->skill:sql SET importance = "required", min_proficiency = 4;
RELATE project:analytics_dashboard->requires_skill->skill:react SET importance = "preferred", min_proficiency = 3;

-- Employee project assignments
RELATE employee:alice->worked_on->project:ecommerce_platform SET role = "Tech Lead", contribution = "Architecture and frontend development", impact_score = 5, start_date = time::now();
RELATE employee:emma->worked_on->project:ecommerce_platform SET role = "Frontend Developer", contribution = "UI components and design system", impact_score = 4, start_date = time::now();

RELATE employee:bob->worked_on->project:ml_recommendation SET role = "ML Lead", contribution = "Model development and training pipeline", impact_score = 5, start_date = time::now();
RELATE employee:david->worked_on->project:ml_recommendation SET role = "Data Analyst", contribution = "Data preparation and feature engineering", impact_score = 4, start_date = time::now();

RELATE employee:carol->worked_on->project:devops_migration SET role = "DevOps Lead", contribution = "Infrastructure design and migration planning", impact_score = 5, start_date = time::now();

RELATE employee:david->worked_on->project:analytics_dashboard SET role = "Lead Analyst", contribution = "KPI definition and dashboard design", impact_score = 5, start_date = time::now();

--------------------------------------------
----- 8. VERIFY SETUP -----
--------------------------------------------

SELECT count() FROM user GROUP ALL;
SELECT count() FROM post GROUP ALL;
SELECT count() FROM employee GROUP ALL;
SELECT count() FROM skill GROUP ALL;
SELECT count() FROM project GROUP ALL;
SELECT count() FROM has_skill GROUP ALL;
SELECT count() FROM related_to GROUP ALL;
SELECT count() FROM worked_on GROUP ALL;
SELECT count() FROM requires_skill GROUP ALL;

INFO FOR DB;
