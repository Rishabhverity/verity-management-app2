import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

interface Trainee {
  id: string;
  name: string;
  email?: string;
}

interface TraineeListProps {
  trainees: Trainee[];
  onTraineesChange: (trainees: Trainee[]) => void;
}

export default function TraineeList({ trainees, onTraineesChange }: TraineeListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (trainee: Trainee) => {
    setEditingId(trainee.id);
    setNewName(trainee.name);
    setNewEmail(trainee.email || "");
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!editingId || !newName.trim()) return;

    const updatedTrainees = trainees.map(trainee =>
      trainee.id === editingId ? { ...trainee, name: newName.trim(), email: newEmail.trim() } : trainee
    );

    onTraineesChange(updatedTrainees);
    setEditingId(null);
    setNewName("");
    setNewEmail("");
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setEditingId(null);
    setNewName("");
    setNewEmail("");
  };

  const handleAddTrainee = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    const newTrainee: Trainee = {
      id: `temp-${Date.now()}`,
      name: "",
      email: ""
    };
    onTraineesChange([...trainees, newTrainee]);
    setEditingId(newTrainee.id);
    setNewName("New Trainee");
    setNewEmail("");
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
          email: row.email || row.Email || undefined
        }));

        onTraineesChange([...trainees, ...newTrainees]);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please make sure it has "name" and "email" columns.');
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
          <div
            key={trainee.id}
            className="flex items-center gap-2 p-2 border rounded-md"
          >
            {editingId === trainee.id ? (
              <>
                <input
                  type="text"
                  defaultValue={trainee.name}
                  className="flex-1 px-2 py-1 border rounded"
                  placeholder="Name"
                />
                <input
                  type="email"
                  defaultValue={trainee.email}
                  className="flex-1 px-2 py-1 border rounded"
                  placeholder="Email"
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
                <div className="flex-1">
                  <div className="font-medium">{trainee.name}</div>
                  {trainee.email && (
                    <div className="text-sm text-gray-500">{trainee.email}</div>
                  )}
                </div>
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
        Upload an Excel file with a "name" and "email" column to add multiple trainees at once
      </p>
    </div>
  );
} 