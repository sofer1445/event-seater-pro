-- Check the structure of the seats table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'seats'
ORDER BY 
    ordinal_position;
