-----------------------------
----- Table definitions -----
-----------------------------

-- Employee table with vector embedding for semantic search
DEFINE TABLE employee SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create WHERE $auth != NONE
        FOR update, delete WHERE $auth != NONE;

-- Core employee fields
DEFINE FIELD name        ON TABLE employee TYPE string;
DEFINE FIELD email       ON TABLE employee TYPE string;
DEFINE FIELD department  ON TABLE employee TYPE string;
DEFINE FIELD role        ON TABLE employee TYPE string;
DEFINE FIELD avatar_url  ON TABLE employee TYPE option<string>;

-- Document field for flexible profile data (job history, bio, etc.)
DEFINE FIELD profile     ON TABLE employee TYPE option<object> FLEXIBLE;

-- Vector embedding for semantic search (1536 dimensions for OpenAI, flexible for others)
DEFINE FIELD embedding   ON TABLE employee TYPE option<array<float>>;

-- Timestamps
DEFINE FIELD created     ON TABLE employee VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE employee VALUE time::now();

-- Indexes
DEFINE INDEX email_idx ON TABLE employee COLUMNS email UNIQUE;
DEFINE INDEX dept_idx ON TABLE employee COLUMNS department;
DEFINE INDEX role_idx ON TABLE employee COLUMNS role;

-- M-tree index for vector similarity search (SurrealDB 2.x)
-- Commented out - apply manually as it requires MTREE which may need specific configuration
-- DEFINE INDEX embedding_idx ON TABLE employee FIELDS embedding MTREE DIMENSION 1536 DIST COSINE;

------------------------
----- Demo Content -----
------------------------

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
