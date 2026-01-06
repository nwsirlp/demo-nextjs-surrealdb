--------------------------------------------
----- Fix Permissions for All Tables -----
--------------------------------------------
-- Run this in Surrealist to fix IAM permission errors
-- This removes and redefines the ACCESS control on each table

-- Fix POST table permissions
REMOVE TABLE post;
DEFINE TABLE post SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD title   ON TABLE post TYPE string;
DEFINE FIELD body    ON TABLE post TYPE string;
DEFINE FIELD author  ON TABLE post TYPE option<record<user>>;
DEFINE FIELD created ON TABLE post VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE post VALUE time::now();

-- Fix USER table permissions
REMOVE TABLE user;
DEFINE TABLE user SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create NONE
        FOR update, delete WHERE id = $auth.id;
DEFINE FIELD name     ON TABLE user TYPE string;
DEFINE FIELD username ON TABLE user TYPE string;
DEFINE FIELD password ON TABLE user TYPE string;
DEFINE FIELD created  ON TABLE user VALUE $before OR time::now();
DEFINE FIELD updated  ON TABLE user VALUE time::now();
DEFINE INDEX username_idx ON TABLE user COLUMNS username UNIQUE;

-- Recreate user ACCESS
DEFINE ACCESS user_access ON DATABASE TYPE RECORD
    SIGNUP (CREATE user SET name = $name, username = $username, password = crypto::argon2::generate($password))
    SIGNIN (SELECT * FROM user WHERE username = $username AND crypto::argon2::compare(password, $password));

-- Fix EMPLOYEE table permissions
REMOVE TABLE employee;
DEFINE TABLE employee SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
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

-- Fix SKILL table permissions
REMOVE TABLE skill;
DEFINE TABLE skill SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD name        ON TABLE skill TYPE string;
DEFINE FIELD category    ON TABLE skill TYPE option<string>;
DEFINE FIELD description ON TABLE skill TYPE option<string>;
DEFINE FIELD tags        ON TABLE skill TYPE option<array<string>>;
DEFINE FIELD embedding   ON TABLE skill TYPE option<array<float>>;
DEFINE FIELD created     ON TABLE skill VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE skill VALUE time::now();
DEFINE INDEX skill_name_idx ON TABLE skill COLUMNS name UNIQUE;
DEFINE INDEX skill_category_idx ON TABLE skill COLUMNS category;

-- Fix PROJECT table permissions
REMOVE TABLE project;
DEFINE TABLE project SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD name        ON TABLE project TYPE string;
DEFINE FIELD description ON TABLE project TYPE option<string>;
DEFINE FIELD status      ON TABLE project TYPE string DEFAULT "planning";
DEFINE FIELD priority    ON TABLE project TYPE string DEFAULT "medium";
DEFINE FIELD metadata    ON TABLE project TYPE option<object> FLEXIBLE;
DEFINE FIELD embedding   ON TABLE project TYPE option<array<float>>;
DEFINE FIELD created     ON TABLE project VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE project VALUE time::now();
DEFINE INDEX project_name_idx ON TABLE project COLUMNS name;
DEFINE INDEX project_status_idx ON TABLE project COLUMNS status;

-- Fix EDGE tables
REMOVE TABLE has_skill;
DEFINE TABLE has_skill TYPE RELATION IN employee OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD proficiency ON TABLE has_skill TYPE int DEFAULT 3;
DEFINE FIELD years       ON TABLE has_skill TYPE option<float>;
DEFINE FIELD certified   ON TABLE has_skill TYPE bool DEFAULT false;
DEFINE FIELD created     ON TABLE has_skill VALUE $before OR time::now();
DEFINE FIELD updated     ON TABLE has_skill VALUE time::now();

REMOVE TABLE related_to;
DEFINE TABLE related_to TYPE RELATION IN skill OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD similarity_score ON TABLE related_to TYPE float DEFAULT 0.5;
DEFINE FIELD type             ON TABLE related_to TYPE string DEFAULT "related";
DEFINE FIELD created          ON TABLE related_to VALUE $before OR time::now();

REMOVE TABLE worked_on;
DEFINE TABLE worked_on TYPE RELATION IN employee OUT project SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD role         ON TABLE worked_on TYPE option<string>;
DEFINE FIELD contribution ON TABLE worked_on TYPE option<string>;
DEFINE FIELD start_date   ON TABLE worked_on TYPE option<datetime>;
DEFINE FIELD end_date     ON TABLE worked_on TYPE option<datetime>;
DEFINE FIELD impact_score ON TABLE worked_on TYPE option<int>;
DEFINE FIELD created      ON TABLE worked_on VALUE $before OR time::now();
DEFINE FIELD updated      ON TABLE worked_on VALUE time::now();

REMOVE TABLE requires_skill;
DEFINE TABLE requires_skill TYPE RELATION IN project OUT skill SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth != NONE;
DEFINE FIELD importance      ON TABLE requires_skill TYPE string DEFAULT "preferred";
DEFINE FIELD min_proficiency ON TABLE requires_skill TYPE int DEFAULT 3;
DEFINE FIELD created         ON TABLE requires_skill VALUE $before OR time::now();
