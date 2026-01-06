--------------------------------------------
----- Complete Setup Script -----
--------------------------------------------
-- Run this in Surrealist to fix all permissions and recreate demo users
-- Make sure you're connected to the correct namespace/database

-- 1. Fix USER table and ACCESS method
REMOVE TABLE user;
DEFINE TABLE user SCHEMAFULL
    PERMISSIONS 
        FOR select FULL
        FOR create NONE
        FOR update, delete WHERE id = $auth.id;

DEFINE FIELD name     ON TABLE user TYPE string;
DEFINE FIELD username ON TABLE user TYPE string;
DEFINE FIELD password ON TABLE user TYPE string
    PERMISSIONS 
        FOR select NONE
        FOR update, delete WHERE id = $auth.id;
DEFINE FIELD created  ON TABLE user VALUE $before OR time::now();
DEFINE FIELD updated  ON TABLE user VALUE time::now();
DEFINE INDEX username_idx ON TABLE user COLUMNS username UNIQUE;

-- 2. Define ACCESS method (MUST match what Surreal.ts uses: 'user_access')
REMOVE ACCESS user_access ON DATABASE;
DEFINE ACCESS user_access ON DATABASE TYPE RECORD
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

-- 3. Recreate demo users with proper password hashes
CREATE user:demo1 CONTENT {
    name: "John Doe",
    username: "johndoe",
    password: crypto::argon2::generate("Password1!"),
    created: time::now(),
    updated: time::now()
};

CREATE user:demo2 CONTENT {
    name: "Micha de Vries",
    username: "michadevries",
    password: crypto::argon2::generate("Password1!"),
    created: time::now(),
    updated: time::now()
};

-- 4. Fix POST table
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

-- 5. Create demo posts
CREATE post:demo1 CONTENT {
    title: "Welcome to SurrealDB!",
    body: "This is a demo post to show the application working.",
    author: user:demo1,
    created: time::now(),
    updated: time::now()
};

-- 6. Verify setup
SELECT * FROM user;
SELECT * FROM post;
INFO FOR DB;
