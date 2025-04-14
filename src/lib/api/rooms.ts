import { db } from '@/lib/api/db';
import { Table, Seat } from '@/types/tables';
import { Room } from '@/types/workspace';

export async function getRooms(): Promise<Room[]> {
  try {
    console.log('Fetching tables from PostgreSQL...');
    const queryText = 'SELECT id, name, capacity, description, created_at, updated_at FROM tables ORDER BY name';
    console.log('Query:', queryText);
    
    const result = await db.query(queryText, []);
    console.log('Raw result:', result);

    if (!result || !result.rows) {
      console.warn('No tables found');
      return [];
    }
    
    // Transform Table objects into Room objects
    const rooms: Room[] = result.rows.map(table => ({
      ...table,
      floor: 1, // Default floor
      features: [], // Default empty features array
      x: 0, // Default x coordinate
      y: 0, // Default y coordinate
      gender_restriction: null // Default gender restriction
    }));
    
    return rooms;
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    throw error;
  }
}

export async function createRoom(table: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<Table> {
  try {
    console.log('Creating table in PostgreSQL...');
    const { name, capacity, description } = table;
    
    // Start transaction
    await db.query('BEGIN');

    // Create table
    const tableResult = await db.query(
      'INSERT INTO tables (name, capacity, description) VALUES ($1, $2, $3) RETURNING *',
      [name, capacity, description]
    );

    // Create seats for the table
    const seatPromises = Array.from({ length: capacity }, (_, i) => {
      return db.query(
        'INSERT INTO seats (table_id, position, status) VALUES ($1, $2, $3)',
        [tableResult.rows[0].id, i + 1, 'available']
      );
    });

    await Promise.all(seatPromises);
    await db.query('COMMIT');

    return tableResult.rows[0];
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Failed to create table:', error);
    throw error;
  }
}

export async function getTableSeats(tableId: string): Promise<Seat[]> {
  try {
    const result = await db.query(
      'SELECT * FROM seats WHERE table_id = $1 ORDER BY position',
      [tableId]
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch table seats:', error);
    throw error;
  }
}
