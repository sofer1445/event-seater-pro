import { QueryResult } from 'pg';

async function query(queryText: string, values: any[] = []): Promise<any> {
  try {
    // Validate input
    if (!queryText || !Array.isArray(values)) {
      throw new Error('Invalid query parameters');
    }

    // Sanitize values to prevent potential injection
    const sanitizedValues = values.map(val => 
      val === undefined || val === null ? null : 
      typeof val === 'string' ? val.trim() : val
    );

    // Determine the appropriate route based on the query
    const baseUrl = 'http://localhost:4000';
    const route = `${baseUrl}/api/generic-query`;

    console.log('Sending query to:', route);
    console.log('Query text:', queryText);
    console.log('Query params:', sanitizedValues);

    async function fetchFromApi(query: string) {
      try {
        const baseUrl = 'http://localhost:4000';
        const response = await fetch(`${baseUrl}/api/generic-query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: queryText, 
            params: sanitizedValues 
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server responded with error:', errorText);
          throw new Error(`Database query failed: ${errorText}`);
        }

        const result = await response.json();
        return { rows: result };
      } catch (error) {
        console.error('Comprehensive database query error:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          queryText,
          values,
          serverUrl: 'http://localhost:4000'
        });
        throw error;
      }
    }

    return await fetchFromApi(queryText);
  } catch (error) {
    console.error('Comprehensive database query error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      queryText,
      values,
      serverUrl: 'http://localhost:4000'
    });
    throw error;
  }
}

export const db = {
  query
};
