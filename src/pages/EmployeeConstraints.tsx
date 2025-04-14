import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { getEmployees, getEmployee, updateEmployeeConstraints } from '@/lib/api/employees';
import { Employee, EmployeeConstraints, ConstraintType, ConstraintSeverity, CustomConstraint } from '@/types/employee';

// קומפוננטת בחירת עובד
const EmployeeSelector: React.FC<{ onSelectEmployee: (employee: Employee) => void }> = ({ onSelectEmployee }) => {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });

  if (isLoading) return <p>טוען עובדים...</p>;

  return (
    <Select onValueChange={(value) => {
      const employee = employees.find(e => e.id === value);
      if (employee) onSelectEmployee(employee);
    }}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="בחר עובד" />
      </SelectTrigger>
      <SelectContent>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.first_name} {employee.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// קומפוננטה להצגת רשימת אילוצים
const ConstraintsList: React.FC<{
  constraints: CustomConstraint[],
  onDelete: (index: number) => void
}> = ({ constraints, onDelete }) => {
  if (!constraints.length) return <p>לא הוגדרו אילוצים מותאמים אישית</p>;

  return (
    <div className="space-y-4">
      {constraints.map((constraint, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{constraint.description}</h4>
                <p className="text-sm text-gray-500">
                  סוג: {constraint.type} | חומרה: {constraint.severity === 'must' ? 'חובה' : 'העדפה'}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(index)}
              >
                הסר
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// דף ניהול אילוצים
const EmployeeConstraintsManager: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [constraintType, setConstraintType] = useState<ConstraintType | string>(ConstraintType.CUSTOM);
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<ConstraintSeverity>('prefer');
  const [parameters, setParameters] = useState<{ [key: string]: any }>({});
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string>('');
  const [previousSeatId, setPreviousSeatId] = useState<string>('');
  const [needsAccessibility, setNeedsAccessibility] = useState<boolean>(false);
  
  const queryClient = useQueryClient();
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });
  
  // שליפת נתוני עובד ספציפי עם הקונסטריינטים הקיימים שלו
  const { data: employeeData, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['employee', selectedEmployee?.id],
    queryFn: () => selectedEmployee ? getEmployee(selectedEmployee.id) : null,
    enabled: !!selectedEmployee
  });

  useEffect(() => {
    if (employeeData) {
      setSelectedEmployee(employeeData);
    }
  }, [employeeData]);

  // מיוטציה לעדכון הקונסטריינטים
  const updateConstraintsMutation = useMutation({
    mutationFn: (data: { id: string; constraints: EmployeeConstraints }) => 
      updateEmployeeConstraints(data.id, data.constraints),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', selectedEmployee?.id] });
      toast.success('האילוצים עודכנו בהצלחה');
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating constraints:', error);
      toast.error('שגיאה בעדכון האילוצים');
    }
  });

  const resetForm = () => {
    setConstraintType(ConstraintType.CUSTOM);
    setDescription('');
    setSeverity('prefer');
    setParameters({});
    setTeamMembers([]);
    setEquipmentNeeded('');
    setPreviousSeatId('');
    setNeedsAccessibility(false);
  };

  const handleAddConstraint = () => {
    if (!selectedEmployee) return;
    if (!description.trim()) {
      toast.error('חובה להזין תיאור לאילוץ');
      return;
    }

    // בניית פרמטרים לפי סוג האילוץ
    let constraintParams = { ...parameters };
    
    switch (constraintType) {
      case ConstraintType.TEAM_PROXIMITY:
        constraintParams.teamMemberIds = teamMembers;
        break;
      case ConstraintType.EQUIPMENT_NEEDS:
        constraintParams.neededEquipment = equipmentNeeded.split(',').map(e => e.trim());
        break;
      case ConstraintType.FIXED_SEAT:
        constraintParams.previousSeatId = previousSeatId;
        break;
      case ConstraintType.ACCESSIBILITY:
        constraintParams.needsAccessibility = needsAccessibility;
        break;
    }

    // יצירת אילוץ חדש
    const newConstraint: CustomConstraint = {
      type: constraintType,
      description,
      severity,
      parameters: constraintParams
    };

    // עדכון האילוצים הקיימים
    const currentConstraints = selectedEmployee.constraints || {
      religious: selectedEmployee.is_religious || false,
      healthConstraints: selectedEmployee.has_health_constraints || false,
      customConstraints: []
    };

    const updatedConstraints: EmployeeConstraints = {
      ...currentConstraints,
      customConstraints: [
        ...(currentConstraints.customConstraints || []),
        newConstraint
      ]
    };

    // קריאה למיוטציה לעדכון הקונסטריינטים
    updateConstraintsMutation.mutate({
      id: selectedEmployee.id,
      constraints: updatedConstraints
    });
  };

  const handleDeleteConstraint = (index: number) => {
    if (!selectedEmployee || !selectedEmployee.constraints?.customConstraints) return;

    const currentConstraints = { ...selectedEmployee.constraints };
    const updatedCustomConstraints = [...currentConstraints.customConstraints];
    updatedCustomConstraints.splice(index, 1);

    const updatedConstraints: EmployeeConstraints = {
      ...currentConstraints,
      customConstraints: updatedCustomConstraints
    };

    updateConstraintsMutation.mutate({
      id: selectedEmployee.id,
      constraints: updatedConstraints
    });
  };

  // רינדור של שדות נוספים בהתאם לסוג האילוץ
  const renderConstraintTypeFields = () => {
    switch (constraintType) {
      case ConstraintType.TEAM_PROXIMITY:
        return (
          <div className="space-y-4">
            <Label>בחר חברי צוות שצריכים לשבת יחד</Label>
            <Select
              onValueChange={(value) => {
                if (!teamMembers.includes(value)) {
                  setTeamMembers([...teamMembers, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר עובדים" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {teamMembers.map((memberId) => {
                  const member = employees?.find(e => e.id === memberId);
                  return (
                    <div key={memberId} className="bg-gray-100 px-2 py-1 rounded-md flex items-center">
                      <span>{member?.first_name} {member?.last_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => setTeamMembers(teamMembers.filter(id => id !== memberId))}
                      >
                        &times;
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      
      case ConstraintType.EQUIPMENT_NEEDS:
        return (
          <div className="space-y-4">
            <Label>ציוד מיוחד נדרש (הפרד באמצעות פסיקים)</Label>
            <Input
              value={equipmentNeeded}
              onChange={(e) => setEquipmentNeeded(e.target.value)}
              placeholder="מסך נוסף, מקלדת ארגונומית, וכו'"
            />
          </div>
        );
      
      case ConstraintType.FIXED_SEAT:
        return (
          <div className="space-y-4">
            <Label>מזהה מקום ישיבה קבוע</Label>
            <Input
              value={previousSeatId}
              onChange={(e) => setPreviousSeatId(e.target.value)}
              placeholder="הזן מזהה של מקום ישיבה"
            />
          </div>
        );
      
      case ConstraintType.ACCESSIBILITY:
        return (
          <div className="space-y-4">
            <Label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={needsAccessibility}
                onChange={(e) => setNeedsAccessibility(e.target.checked)}
                className="h-4 w-4"
              />
              <span>דורש התאמות נגישות מיוחדות</span>
            </Label>
          </div>
        );
      
      case ConstraintType.CUSTOM:
      default:
        return (
          <div className="space-y-4">
            <Label>פרמטרים נוספים (JSON)</Label>
            <Textarea
              value={JSON.stringify(parameters, null, 2)}
              onChange={(e) => {
                try {
                  setParameters(JSON.parse(e.target.value));
                } catch (err) {
                  // אם הקלט לא תקין, נשמור אותו כטקסט רגיל
                  console.log('Invalid JSON input');
                }
              }}
              placeholder={`{"key": "value"}`}
              rows={5}
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 rtl">
      <h1 className="text-3xl font-bold mb-6 text-right">ניהול אילוצים מותאמים אישית</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-right">בחירת עובד</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeSelector onSelectEmployee={setSelectedEmployee} />
        </CardContent>
      </Card>
      
      {selectedEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">
                הוספת אילוץ עבור {selectedEmployee.first_name} {selectedEmployee.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>סוג האילוץ</Label>
                <Select
                  onValueChange={(value: any) => setConstraintType(value)}
                  defaultValue={constraintType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג אילוץ" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ConstraintType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>תיאור האילוץ</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="תאר את האילוץ"
                />
              </div>
              
              <div className="space-y-4">
                <Label>חומרת האילוץ</Label>
                <RadioGroup
                  defaultValue={severity}
                  onValueChange={(value: ConstraintSeverity) => setSeverity(value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="must" id="must" />
                    <Label htmlFor="must">חובה</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer" id="prefer" />
                    <Label htmlFor="prefer">העדפה</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {renderConstraintTypeFields()}
              
              <Button
                onClick={handleAddConstraint}
                className="w-full"
                disabled={updateConstraintsMutation.isPending}
              >
                {updateConstraintsMutation.isPending ? 'שומר...' : 'הוסף אילוץ'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-right">אילוצים קיימים</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEmployee ? (
                <p>טוען אילוצים...</p>
              ) : (
                <ConstraintsList
                  constraints={selectedEmployee.constraints?.customConstraints || []}
                  onDelete={handleDeleteConstraint}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeConstraintsManager;
