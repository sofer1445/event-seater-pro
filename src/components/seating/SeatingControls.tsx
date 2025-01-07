import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface SeatingControlsProps {
    showGrid: boolean
    setShowGrid: (show: boolean) => void
    setAutoArrange: (arrange: boolean) => void
    isAddingTable: boolean
    setIsAddingTable: (adding: boolean) => void
    addNewTable: () => Promise<void>
}

export const SeatingControls = ({
    showGrid,
    setShowGrid,
    setAutoArrange,
    isAddingTable,
    setIsAddingTable,
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
                className="w-full bg-primary"
            >
                Auto-arrange Restaurant Layout
            </Button>
            <Button 
                variant="outline" 
                onClick={addNewTable}
                className="w-full"
            >
                Add Table (6 seats)
            </Button>
        </div>
    )
}