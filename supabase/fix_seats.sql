-- Add status column to seats if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_name='seats' 
                   AND column_name='status') THEN
        ALTER TABLE seats ADD COLUMN status TEXT CHECK (status IN ('available', 'occupied')) DEFAULT 'available';
    END IF;
END $$;
