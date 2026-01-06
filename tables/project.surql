-----------------------------
----- Table definitions -----
-----------------------------

-- Project table for tracking work and required skills
DEFINE TABLE project SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;

-- Core project fields
DEFINE FIELD name        ON TABLE project TYPE string;
DEFINE FIELD description ON TABLE project TYPE option<string>;
DEFINE FIELD status      ON TABLE project TYPE string DEFAULT "active";
DEFINE FIELD priority    ON TABLE project TYPE option<string>;

-- Project metadata as flexible document
DEFINE FIELD metadata    ON TABLE project TYPE option<object> FLEXIBLE;

-- Vector embedding for semantic matching
DEFINE FIELD embedding   ON TABLE project TYPE option<array<float>>;

-- Timestamps
DEFINE FIELD start_date  ON TABLE project TYPE option<datetime>;
DEFINE FIELD end_date    ON TABLE project TYPE option<datetime>;
DEFINE FIELD created     ON TABLE project VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE project VALUE time::now();

-- Indexes
DEFINE INDEX name_idx ON TABLE project COLUMNS name;
DEFINE INDEX status_idx ON TABLE project COLUMNS status;

------------------------
----- Demo Content -----
------------------------

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
