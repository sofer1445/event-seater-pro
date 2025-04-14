import React from 'react';
import { Workspace } from '@/types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoomWorkspacesProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  roomName: string;
  onWorkspaceSelect?: (workspace: Workspace) => void;
}

export const RoomWorkspaces: React.FC<RoomWorkspacesProps> = ({
  isOpen,
  onClose,
  workspaces,
  roomName,
  onWorkspaceSelect,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>כיסאות בחדר {roomName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] w-full pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {workspaces.map((workspace) => (
              <Card 
                key={workspace.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onWorkspaceSelect?.(workspace)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{workspace.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workspace.features.additionalFeatures && workspace.features.additionalFeatures.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">תכונות:</h4>
                        <div className="flex flex-wrap gap-1">
                          {workspace.features.additionalFeatures.map((feature, index) => (
                            <Badge key={index} variant="secondary">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">מאפיינים:</h4>
                      <div className="flex flex-wrap gap-1">
                        {workspace.features.hasErgonomicChair && (
                          <Badge variant="secondary">כסא ארגונומי</Badge>
                        )}
                        {workspace.features.hasAdjustableDesk && (
                          <Badge variant="secondary">שולחן מתכוונן</Badge>
                        )}
                        {workspace.features.isNearWindow && (
                          <Badge variant="secondary">ליד חלון</Badge>
                        )}
                        {workspace.features.isNearAC && (
                          <Badge variant="secondary">ליד מזגן</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">מגבלות:</h4>
                      <div className="flex flex-wrap gap-1">
                        {workspace.restrictions.genderRestriction !== 'none' && (
                          <Badge variant="destructive">
                            {workspace.restrictions.genderRestriction === 'male' ? 'גברים בלבד' : 'נשים בלבד'}
                          </Badge>
                        )}
                        {workspace.restrictions.religiousOnly && (
                          <Badge variant="destructive">דתיים בלבד</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
