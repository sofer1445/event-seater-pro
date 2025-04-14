import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table } from '@/types/tables';
import { apiClient } from '@/lib/api/apiClient';

interface EditTableFormProps {
  table: Table;
  onSave: (updatedTable: Table) => void;
  onCancel: () => void;
}

const EditTableForm: React.FC<EditTableFormProps> = ({ table, onSave, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Table>>({
    name: '',
    description: '',
    capacity: 0,
    gender_restriction: 'none',
    religious_only: false,
    location: 'center',
    noise_level: 'moderate'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize form with table data
    setFormData({
      name: table.name,
      description: table.description || '',
      capacity: table.capacity,
      gender_restriction: table.gender_restriction || 'none',
      religious_only: table.religious_only || false,
      location: table.location || 'center',
      noise_level: table.noise_level || 'moderate'
    });
  }, [table]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.patch(`/tables/${table.id}`, formData);
      toast({
        title: 'השולחן עודכן בהצלחה',
        description: `שולחן ${response.name} עודכן במערכת`,
        variant: 'default',
      });
      onSave(response);
    } catch (error) {
      console.error('שגיאה בעדכון השולחן:', error);
      toast({
        title: 'שגיאה בעדכון השולחן',
        description: 'אירעה שגיאה בעת ניסיון לעדכן את השולחן',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapacityChange = async () => {
    if (!formData.capacity || formData.capacity === table.capacity) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiClient.patch(`/tables/${table.id}/capacity`, {
        capacity: formData.capacity
      });
      toast({
        title: 'קיבולת השולחן עודכנה',
        description: `קיבולת השולחן עודכנה ל-${formData.capacity} מקומות`,
        variant: 'default',
      });
      onSave(response.table);
    } catch (error: any) {
      console.error('שגיאה בעדכון קיבולת השולחן:', error);
      
      // אם יש מושבים תפוסים שמונעים את השינוי
      if (error.response?.status === 400) {
        toast({
          title: 'לא ניתן לעדכן את קיבולת השולחן',
          description: 'לא ניתן להקטין את השולחן כי יש מושבים תפוסים',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'שגיאה בעדכון קיבולת השולחן',
          description: 'אירעה שגיאה בעת ניסיון לעדכן את קיבולת השולחן',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">שם השולחן</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">קיבולת (מספר מושבים)</Label>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Input
            id="capacity"
            type="number"
            min={1}
            max={50}
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
            required
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCapacityChange}
            disabled={isSubmitting || formData.capacity === table.capacity}
          >
            עדכן קיבולת
          </Button>
        </div>
        <p className="text-xs text-gray-500">שינוי קיבולת יוסיף או יסיר מושבים לפי הצורך.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">מיקום</Label>
        <Select
          value={formData.location}
          onValueChange={(value) => handleChange('location', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר מיקום" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="center">מרכז החדר</SelectItem>
            <SelectItem value="window">ליד חלון</SelectItem>
            <SelectItem value="corner">פינתי</SelectItem>
            <SelectItem value="entrance">ליד הכניסה</SelectItem>
            <SelectItem value="air_conditioner">ליד מזגן</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="noise_level">רמת רעש</Label>
        <Select
          value={formData.noise_level}
          onValueChange={(value) => handleChange('noise_level', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר רמת רעש" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quiet">שקט</SelectItem>
            <SelectItem value="moderate">בינוני</SelectItem>
            <SelectItem value="loud">רועש</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender_restriction">הגבלת מגדר</Label>
        <Select
          value={formData.gender_restriction}
          onValueChange={(value) => handleChange('gender_restriction', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר הגבלת מגדר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ללא הגבלה</SelectItem>
            <SelectItem value="male">גברים בלבד</SelectItem>
            <SelectItem value="female">נשים בלבד</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Switch
          id="religious_only"
          checked={formData.religious_only}
          onCheckedChange={(checked) => handleChange('religious_only', checked)}
        />
        <Label htmlFor="religious_only">לדתיים בלבד</Label>
      </div>

      <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
    </form>
  );
};

export default EditTableForm;
