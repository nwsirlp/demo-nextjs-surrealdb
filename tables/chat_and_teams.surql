--------------------------------------------
----- CHAT MESSAGE TABLE WITH RLS -----
--------------------------------------------
-- User-scoped chat history with Row-Level Security

DEFINE TABLE message SCHEMAFULL
    PERMISSIONS 
        FOR select WHERE user = $auth.id
        FOR create WHERE $auth != NONE
        FOR update, delete WHERE user = $auth.id;

-- Fields
DEFINE FIELD user      ON TABLE message TYPE record<user>;
DEFINE FIELD role      ON TABLE message TYPE string;  -- 'user' | 'assistant' | 'system'
DEFINE FIELD content   ON TABLE message TYPE string;
DEFINE FIELD metadata  ON TABLE message TYPE option<object> FLEXIBLE;
DEFINE FIELD created   ON TABLE message VALUE $before OR time::now();

-- Indexes for efficient querying
DEFINE INDEX msg_user_idx ON TABLE message COLUMNS user;
DEFINE INDEX msg_created_idx ON TABLE message COLUMNS created;

--------------------------------------------
----- WORKED_WITH EDGE (TEAM COMPATIBILITY) -----
--------------------------------------------
-- Tracks which employees have worked together on projects

DEFINE TABLE worked_with TYPE RELATION IN employee OUT employee SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth != NONE;

DEFINE FIELD project       ON TABLE worked_with TYPE option<record<project>>;
DEFINE FIELD collaboration ON TABLE worked_with TYPE string DEFAULT "good";  -- good, excellent, challenging
DEFINE FIELD notes         ON TABLE worked_with TYPE option<string>;
DEFINE FIELD created       ON TABLE worked_with VALUE $before OR time::now();

-- Demo worked_with relationships (based on shared project work)
-- Alice & Emma worked together on E-Commerce Platform
RELATE employee:alice->worked_with->employee:emma SET 
    project = project:ecommerce_platform, 
    collaboration = "excellent",
    notes = "Great frontend collaboration";

RELATE employee:emma->worked_with->employee:alice SET 
    project = project:ecommerce_platform, 
    collaboration = "excellent",
    notes = "Strong technical leadership from Alice";

-- Bob & David worked together on ML Recommendation
RELATE employee:bob->worked_with->employee:david SET 
    project = project:ml_recommendation, 
    collaboration = "good",
    notes = "Effective data-to-model pipeline";

RELATE employee:david->worked_with->employee:bob SET 
    project = project:ml_recommendation, 
    collaboration = "good",
    notes = "Clear ML requirements from Bob";

-- Verify new tables
SELECT count() FROM message GROUP ALL;
SELECT count() FROM worked_with GROUP ALL;
