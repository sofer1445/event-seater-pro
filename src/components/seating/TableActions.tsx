import { useCallback } from 'react'
import { Seat } from '@/types'
import { useToast } from '../ui/use-toast'
import { supabase } from '../../integrations/supabase/client'
import { Button } from '../ui/button'

interface TableActionsProps {
    eventId: string
    seats: Seat[]
    onSeatsChange: (seats: Seat[]) => void
}

export const TableActions = ({
    eventId,
    seats,
    onSeatsChange,
}: TableActionsProps) => {
    const { toast } = useToast()

    const addNewTable = useCallback(async () => {
        try {
            // Find the highest table number
            const maxTableNumber = Math.max(...seats.map(s => s.table_number), 0)
            const newTableNumber = maxTableNumber + 1

            // Create 8 new seats for the table
            const newSeats = Array.from({ length: 8 }).map((_, index) => ({
                event_id: eventId,
                table_number: newTableNumber,
                seat_number: index + 1,
            }))

            console.log('📝 Adding new table with seats:', newSeats)
            
            const { data, error } = await supabase
                .from('seats')
                .insert(newSeats)
                .select()

            if (error) {
                console.error('Insert error:', error)
                toast({
                    title: "שגיאה",
                    description: "אירעה שגיאה בהוספת שולחן חדש",
                    variant: "destructive",
                })
                return
            }
            
            if (data) {
                onSeatsChange([...seats, ...data])
                toast({
                    title: "הצלחה",
                    description: "שולחן חדש נוסף בהצלחה",
                })
            }
        } catch (error) {
            console.error('Error adding new table:', error)
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בהוספת שולחן חדש",
                variant: "destructive",
            })
        }
    }, [eventId, seats, onSeatsChange, toast])

    return (
        <div className="space-y-4">
            <Button 
                variant="outline" 
                onClick={addNewTable}
                className="w-full"
            >
                Add Table (8 seats)
            </Button>
        </div>
    )
}
