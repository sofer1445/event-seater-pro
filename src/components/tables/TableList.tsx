import React, { useEffect, useState } from 'react';
import { TableCard } from './TableCard';
import { Table, Seat } from '@/types/tables';
import { Employee } from '@/types/employee';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/apiClient'; // Assuming you have an api client set up

export const TableList: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: '',
    gender_restriction: 'none',
    religious_only: false,
    location: 'center',
    noise_level: 'moderate'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tablesData = await apiClient.get('/tables');
        console.log('Tables data:', tablesData);
        setTables(tablesData);
        
        const seatsData = await apiClient.get('/seats');
        console.log('Seats data:', seatsData);
        setSeats(seatsData);
        
        const employeesData = await apiClient.get('/employees');
        console.log('Employees data:', employeesData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSeatClick = async (seat: Seat) => {
    // Handle seat assignment/unassignment here
    console.log('Seat clicked:', seat);
  };

  const getTableSeats = (tableId: string) => {
    if (!Array.isArray(seats)) {
      console.error('Seats is not an array:', seats);
      return [];
    }
    return seats.filter(seat => seat.table_id === tableId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Creating new table:', formData);
    console.log(`Table details: Name: ${formData.name}, Capacity: ${formData.capacity}, Location: ${formData.location}`);
    console.log(`Restrictions: Gender: ${formData.gender_restriction}, Religious only: ${formData.religious_only ? 'Yes' : 'No'}, Noise level: ${formData.noise_level}`);
    
    try {
      console.log('Sending API request to create table...');
      const data = await apiClient.post('/tables', {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        description: formData.description || null,
        gender_restriction: formData.gender_restriction,
        religious_only: formData.religious_only,
        location: formData.location,
        noise_level: formData.noise_level
      });
      console.log('Table created successfully:', data);
      console.log(`Created table with ID: ${data.id}`);
      
      // Create the seats for the table
      console.log(`Creating ${parseInt(formData.capacity)} seats for the new table...`);
      
      setTables([...tables, data]);
      setFormData({ 
        name: '',
        capacity: '',
        description: '',
        gender_restriction: 'none',
        religious_only: false,
        location: 'center',
        noise_level: 'moderate'
      });
      setIsDialogOpen(false);
      
      // Refresh data after creating a new table
      const fetchData = async () => {
        try {
          const tablesData = await apiClient.get('/tables');
          console.log('Tables data:', tablesData);
          setTables(tablesData);
          
          const seatsData = await apiClient.get('/seats');
          console.log('Seats data:', seatsData);
          setSeats(seatsData);
          
          const employeesData = await apiClient.get('/employees');
          console.log('Employees data:', employeesData);
          setEmployees(employeesData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } catch (error) {
      console.error('Error creating table:', error);
      alert(`Error creating table: ${error}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tables</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>Add Table</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="name">Table Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter table name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="Enter number of seats"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  placeholder="Enter table description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gender_restriction">Gender Restriction</Label>
                <select 
                  id="gender_restriction" 
                  value={formData.gender_restriction}
                  onChange={(e) => setFormData({ ...formData, gender_restriction: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <Label htmlFor="religious_only">Religious Only</Label>
                <input 
                  id="religious_only" 
                  type="checkbox"
                  checked={formData.religious_only}
                  onChange={(e) => setFormData({ ...formData, religious_only: e.target.checked })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <select 
                  id="location" 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="center">Center</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                </select>
              </div>
              <div>
                <Label htmlFor="noise_level">Noise Level</Label>
                <select 
                  id="noise_level" 
                  value={formData.noise_level}
                  onChange={(e) => setFormData({ ...formData, noise_level: e.target.value })}
                >
                  <option value="quiet">Quiet</option>
                  <option value="moderate">Moderate</option>
                  <option value="loud">Loud</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Create Table
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            seats={getTableSeats(table.id)}
            employees={employees}
            onSeatClick={handleSeatClick}
          />
        ))}
      </div>
    </div>
  );
};
