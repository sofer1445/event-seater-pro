-- Check the structure of the events table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'events'
ORDER BY 
    ordinal_position;
