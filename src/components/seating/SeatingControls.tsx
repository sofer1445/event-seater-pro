import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

interface SeatingControlsProps {
    showGrid: boolean
    setShowGrid: (show: boolean) => void
    setAutoArrange: (arrange: boolean) => void
    isAddingTable: boolean
    setIsAddingTable: (adding: boolean) => void
    newTableNumber: number
    setNewTableNumber: (number: number) => void
    newSeatsCount: number
    setNewSeatsCount: (count: number) => void
    addNewTable: () => Promise<void>
}

export const SeatingControls = ({
    showGrid,
    setShowGrid,
    setAutoArrange,
    isAddingTable,
    setIsAddingTable,
    newTableNumber,
    setNewTableNumber,
    newSeatsCount,
    setNewSeatsCount,
    addNewTable
}: SeatingControlsProps) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Switch
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                />
                <Label>Show grid</Label>
            </div>
            <Button
                onClick={() => setAutoArrange(true)}
                className="w-full"
            >
                Auto-arrange seats
            </Button>
            <Button 
                variant="outline" 
                onClick={() => setIsAddingTable(true)}
            >
                Add Table
            </Button>

            {isAddingTable && (
                <Card className="p-4 space-y-4">
                    <CardHeader>
                        <CardTitle>Add New Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Table Number</Label>
                                <Input
                                    type="number"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Number of Seats</Label>
                                <Input
                                    type="number"
                                    value={newSeatsCount}
                                    onChange={(e) => setNewSeatsCount(parseInt(e.target.value))}
                                />
                            </div>
                            <Button onClick={addNewTable}>Create Table</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}