-- MOMENTUM — Sample Seed Data for Supabase
-- Populates initial testbed goals, projects, tasks, and habits

-- Note: In production Supabase, profiles are linked to auth.users.
-- This script provides demo entity inserts for a bootstrapped user.

INSERT INTO life_areas (name, slug, color, is_default) VALUES
('Education', 'education', '#D2925B', true),
('Career', 'career', '#64432B', true),
('Health', 'health', '#868A7A', true),
('Fitness', 'fitness', '#5B8C67', true),
('Personal Development', 'personal_development', '#D2925B', true)
ON CONFLICT DO NOTHING;
