import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WorkspaceMap } from '@/components/workspace/WorkspaceMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createWorkspace, getWorkspaces } from '@/lib/api/workspaces';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Workspace } from '@/types/workspace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

const FEATURES = [
  { label: "מסך", value: "monitor" },
  { label: "מקלדת", value: "keyboard" },
  { label: "עכבר", value: "mouse" },
  { label: "שולחן מתכוונן", value: "adjustable_desk" },
  { label: "כיסא ארגונומי", value: "ergonomic_chair" },
];

const RESTRICTIONS = [
  { label: "שקט", value: "quiet_zone" },
  { label: "ללא אוכל", value: "no_food" },
  { label: "ללא שתיה", value: "no_drinks" },
  { label: "ללא טלפונים", value: "no_phones" },
];

const workspaceSchema = z.object({
  name: z.string().min(1, "שם מקום הישיבה הוא שדה חובה"),
  room: z.string().min(1, "חדר הוא שדה חובה"),
  floor: z.coerce.number().min(0, "קומה חייבת להיות מספר חיובי"),
  features: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  coordinates: z.object({
    x: z.number(),
    y: z.number()
  }).required()
}).required();

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const Workspaces = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLocationMode, setIsLocationMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces
  });

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      room: "",
      floor: 0,
      features: [],
      restrictions: [],
      coordinates: { x: 0, y: 0 }
    }
  });

  const handleFormSubmit = async (data: WorkspaceFormData) => {
    // If coordinates are not set, enter location selection mode
    if (data.coordinates.x === 0 && data.coordinates.y === 0) {
      setIsLocationMode(true);
      setIsFormOpen(false); // Close the form dialog to allow map interaction
      toast({
        title: "בחר מיקום",
        description: "לחץ על המפה כדי לבחור את מיקום מקום הישיבה"
      });
      return;
    }

    try {
      // Create a properly typed workspace object
      const workspaceData = {
        name: data.name,
        room: data.room,
        floor: Number(data.floor),
        features: data.features || [],
        restrictions: data.restrictions || [],
        coordinates: {
          x: Number(data.coordinates.x),
          y: Number(data.coordinates.y)
        }
      } as const;
      
      await createWorkspace(workspaceData);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: "מקום ישיבה נוסף בהצלחה",
        description: `מקום הישיבה ${data.name} נוסף בהצלחה`
      });
      resetForm();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת מקום הישיבה",
        variant: "destructive"
      });
    }
  };

  const handleStageClick = (e: any) => {
    if (!isLocationMode) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const coordinates = {
      x: Math.round((pointerPosition.x - stage.x()) / stage.scaleX()),
      y: Math.round((pointerPosition.y - stage.y()) / stage.scaleY())
    };

    // Get current form data and submit with new coordinates
    const formData = form.getValues();
    handleFormSubmit({ ...formData, coordinates });
    setIsLocationMode(false);
  };

  const resetForm = () => {
    form.reset();
    setIsFormOpen(false);
    setIsLocationMode(false);
  };

  const handleDialogChange = (open: boolean) => {
    if (!isLocationMode) {
      setIsFormOpen(open);
      if (!open) {
        resetForm();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">מפת משרד</h1>
        <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button disabled={isLocationMode}>הוסף מקום ישיבה</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת מקום ישיבה חדש</DialogTitle>
              <DialogDescription>
                מלא את הפרטים ולאחר מכן בחר מיקום על המפה
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מקום הישיבה</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>חדר</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>קומה</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תכונות</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={FEATURES}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="בחר תכונות"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מגבלות</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={RESTRICTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="בחר מגבלות"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">
                  המשך לבחירת מיקום
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="h-[calc(100vh-12rem)]">
        <CardContent className="p-6 h-full relative">
          {isLocationMode && (
            <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg">
              <p className="text-sm text-muted-foreground mb-2">
                לחץ על המפה כדי לבחור מיקום
              </p>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="w-full"
              >
                ביטול
              </Button>
            </div>
          )}
          <WorkspaceMap 
            workspaces={workspaces} 
            employees={[]}
            onWorkspaceClick={() => {}}
            onEmployeeMove={() => {}}
            onStageClick={handleStageClick}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Workspaces;
