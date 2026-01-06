-----------------------------
----- Edge definitions -----
-----------------------------
-- Graph edges for knowledge graph relationships
-- SurrealDB 2.x uses TYPE RELATION for edge tables

-- First, remove any existing tables that might conflict
REMOVE TABLE IF EXISTS has_skill;
REMOVE TABLE IF EXISTS related_to;
REMOVE TABLE IF EXISTS worked_on;
REMOVE TABLE IF EXISTS requires_skill;

---------------------------------
-- HAS_SKILL: Employee -> Skill
---------------------------------
-- Links employees to their skills with proficiency metadata

DEFINE TABLE has_skill TYPE RELATION IN employee OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;

DEFINE FIELD proficiency ON TABLE has_skill TYPE int DEFAULT 3;          -- 1-5 scale
DEFINE FIELD years       ON TABLE has_skill TYPE option<float>;           -- Years of experience
DEFINE FIELD certified   ON TABLE has_skill TYPE bool DEFAULT false;
DEFINE FIELD endorsed_by ON TABLE has_skill TYPE option<array<record<employee>>>;
DEFINE FIELD notes       ON TABLE has_skill TYPE option<string>;
DEFINE FIELD created     ON TABLE has_skill VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE has_skill VALUE time::now();

-- Indexes for efficient querying
DEFINE INDEX hs_proficiency_idx ON TABLE has_skill COLUMNS proficiency;

---------------------------------
-- RELATED_TO: Skill -> Skill
---------------------------------
-- Links related skills for taxonomy and similarity

DEFINE TABLE related_to TYPE RELATION IN skill OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;

DEFINE FIELD similarity_score ON TABLE related_to TYPE float DEFAULT 0.5; -- 0-1 scale
DEFINE FIELD type             ON TABLE related_to TYPE string DEFAULT "related"; -- parent, child, synonym, prerequisite, commonly_used_with
DEFINE FIELD created          ON TABLE related_to VALUE $before OR time::now();

DEFINE INDEX rt_type_idx ON TABLE related_to COLUMNS type;

---------------------------------
-- WORKED_ON: Employee -> Project
---------------------------------
-- Tracks which employees worked on which projects

DEFINE TABLE worked_on TYPE RELATION IN employee OUT project SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;

DEFINE FIELD role         ON TABLE worked_on TYPE option<string>;       -- Role in the project
DEFINE FIELD contribution ON TABLE worked_on TYPE option<string>;       -- What they contributed
DEFINE FIELD start_date   ON TABLE worked_on TYPE option<datetime>;
DEFINE FIELD end_date     ON TABLE worked_on TYPE option<datetime>;
DEFINE FIELD impact_score ON TABLE worked_on TYPE option<int>;          -- 1-5 scale
DEFINE FIELD created      ON TABLE worked_on VALUE $before OR time::now();
DEFINE FIELD updated      ON TABLE worked_on VALUE time::now();

---------------------------------
-- REQUIRES_SKILL: Project -> Skill
---------------------------------
-- Defines which skills a project needs

DEFINE TABLE requires_skill TYPE RELATION IN project OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;

DEFINE FIELD importance      ON TABLE requires_skill TYPE string DEFAULT "preferred"; -- required, preferred, nice_to_have
DEFINE FIELD min_proficiency ON TABLE requires_skill TYPE int DEFAULT 3;              -- Minimum proficiency needed
DEFINE FIELD created         ON TABLE requires_skill VALUE $before OR time::now();

------------------------
----- Demo Content -----
------------------------

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
