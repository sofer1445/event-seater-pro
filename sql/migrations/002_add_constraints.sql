-- Add constraints columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_religious BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_health_constraints BOOLEAN DEFAULT false;
