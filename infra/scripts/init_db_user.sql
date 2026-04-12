-- Run once at DB init via docker-entrypoint-initdb.d

-- Migration user: DDL for Alembic only
CREATE USER drafter_migrate WITH PASSWORD 'MIGRATE_PASSWORD';
GRANT CONNECT ON DATABASE ember_drafter TO drafter_migrate;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drafter_migrate;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drafter_migrate;

-- App runtime user: DML only — cannot DROP or ALTER anything
CREATE USER drafter_app WITH PASSWORD 'APP_PASSWORD';
GRANT CONNECT ON DATABASE ember_drafter TO drafter_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO drafter_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drafter_app;

-- Auto-grant on future tables. Default privileges only apply to objects
-- created by the role specified in FOR ROLE — since Alembic runs as
-- drafter_migrate, we must set defaults for that role (and the superuser
-- fallback) so drafter_app picks up DML rights on newly created site tables.
ALTER DEFAULT PRIVILEGES FOR ROLE drafter_migrate IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO drafter_app;
ALTER DEFAULT PRIVILEGES FOR ROLE drafter_migrate IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO drafter_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO drafter_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO drafter_app;
