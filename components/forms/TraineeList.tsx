import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

interface Trainee {
  id: string;
  name: string;
}

interface TraineeListProps {
  trainees: Trainee[];
  onTraineesChange: (trainees: Trainee[]) => void;
}

export default function TraineeList({ trainees, onTraineesChange }: TraineeListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (trainee: Trainee) => {
    setEditingId(trainee.id);
    setNewName(trainee.name);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!editingId || !newName.trim()) return;

    const updatedTrainees = trainees.map(trainee =>
      trainee.id === editingId ? { ...trainee, name: newName.trim() } : trainee
    );

    onTraineesChange(updatedTrainees);
    setEditingId(null);
    setNewName("");
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setEditingId(null);
    setNewName("");
  };

  const handleAddTrainee = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    const newTrainee: Trainee = {
      id: `temp-${Date.now()}`,
      name: "New Trainee",
    };
    onTraineesChange([...trainees, newTrainee]);
    setEditingId(newTrainee.id);
    setNewName("New Trainee");
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent form submission
    onTraineesChange(trainees.filter(t => t.id !== id));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault(); // Prevent form submission
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convert Excel data to Trainee format
        const newTrainees: Trainee[] = jsonData.map((row: any, index: number) => ({
          id: `temp-${Date.now()}-${index}`,
          name: row.name || row.Name || `Trainee ${index + 1}`,
        }));

        onTraineesChange([...trainees, ...newTrainees]);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please make sure it has a "name" column.');
      }
    };

    reader.readAsBinaryString(file);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Trainees</h3>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
          >
            Upload Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddTrainee}
          >
            Add Trainee
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {trainees.map((trainee) => (
          <div key={trainee.id} className="flex items-center gap-2">
            {editingId === trainee.id ? (
              <>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded"
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1">{trainee.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(trainee);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={(e) => handleDelete(e, trainee.id)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Upload an Excel file with a "name" column to add multiple trainees at once
      </p>
    </div>
  );
} 