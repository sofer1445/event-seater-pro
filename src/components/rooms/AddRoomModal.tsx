import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Room } from '@/types/workspace';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roomData: Partial<Room>) => void;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [roomData, setRoomData] = useState({
    name: '',
    capacity: 1,
    floor: 1,
    gender_restriction: null as 'male' | 'female' | null,
    religious_only: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(roomData);
    setRoomData({ 
      name: '', 
      capacity: 1, 
      floor: 1, 
      gender_restriction: null,
      religious_only: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 w-full">
          <Dialog.Title className="text-lg font-medium mb-4 text-right">הוספת חדר חדש</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם החדר
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={roomData.name}
                onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קומה
              </label>
              <input
                type="number"
                required
                min={1}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={roomData.floor}
                onChange={(e) => setRoomData({ ...roomData, floor: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קיבולת
              </label>
              <input
                type="number"
                required
                min={1}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={roomData.capacity}
                onChange={(e) => setRoomData({ ...roomData, capacity: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                הגבלת מגדר
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={roomData.gender_restriction || ''}
                onChange={(e) => setRoomData({ 
                  ...roomData, 
                  gender_restriction: e.target.value as 'male' | 'female' | null 
                })}
              >
                <option value="">ללא הגבלה</option>
                <option value="male">גברים בלבד</option>
                <option value="female">נשים בלבד</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={roomData.religious_only}
                  onChange={(e) => setRoomData({ ...roomData, religious_only: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700">חדר לדתיים בלבד</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={onClose}
              >
                ביטול
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                הוספה
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
