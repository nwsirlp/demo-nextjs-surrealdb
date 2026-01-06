--------------------------------------------
----- RESET DATABASE SCRIPT -----
--------------------------------------------
-- Run this to completely wipe the database
-- WARNING: This will DELETE ALL DATA!

-- Remove all edge/relation tables first (they depend on other tables)
REMOVE TABLE IF EXISTS has_skill;
REMOVE TABLE IF EXISTS related_to;
REMOVE TABLE IF EXISTS worked_on;
REMOVE TABLE IF EXISTS requires_skill;

-- Remove all entity tables
REMOVE TABLE IF EXISTS post;
REMOVE TABLE IF EXISTS employee;
REMOVE TABLE IF EXISTS skill;
REMOVE TABLE IF EXISTS project;
REMOVE TABLE IF EXISTS user;

-- Remove access methods
REMOVE ACCESS IF EXISTS user ON DATABASE;
REMOVE ACCESS IF EXISTS user_access ON DATABASE;

-- Verify cleanup
INFO FOR DB;
