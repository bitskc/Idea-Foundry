ALTER TABLE projects ADD COLUMN IF NOT EXISTS idea_classification JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS development_difficulty JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS difficulty_roi_ratio JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pivot_suggestions JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS specialist_assessments JSONB;
