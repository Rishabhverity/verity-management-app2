"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { TrainingType } from "@prisma/client";
import axios from "axios";

// Define trainer type
interface Trainer {
  id: string;
  name: string;
  email: string;
  specialization: string;
  availability: boolean;
}

// Define form validation schema
const batchFormSchema = z.object({
  batchName: z.string().min(3, { message: "Batch name must be at least 3 characters" }),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  startTime: z.date({ required_error: "Start time is required" }),
  endTime: z.date({ required_error: "End time is required" }),
  trainingType: z.enum(["ONLINE", "OFFLINE"], { required_error: "Training type is required" }),
  trainerId: z.string().optional(),
  trainees: z.array(z.string()).optional(),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

interface BatchFormProps {
  initialData?: Partial<BatchFormValues>;
  onSubmit: (data: BatchFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function BatchForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BatchFormProps) {
  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: initialData || {
      batchName: "",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default 1 week duration
      startTime: new Date(new Date().setHours(9, 0, 0, 0)), // Default 9:00 AM
      endTime: new Date(new Date().setHours(17, 0, 0, 0)), // Default 5:00 PM
      trainingType: "ONLINE",
      trainerId: "",
      trainees: [],
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // State for trainers and trainees
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [trainerError, setTrainerError] = useState("");

  // Watch start date to enforce end date validation
  const startDate = watch("startDate");
  const startTime = watch("startTime");

  // Fetch trainers from API
  useEffect(() => {
    const fetchTrainers = async () => {
      setIsLoadingTrainers(true);
      setTrainerError("");
      
      try {
        const response = await axios.get('/api/trainers');
        setTrainers(response.data);
      } catch (error) {
        console.error("Error fetching trainers:", error);
        setTrainerError("Failed to load trainers. Please try again.");
      } finally {
        setIsLoadingTrainers(false);
      }
    };
    
    fetchTrainers();
  }, []);

  // Dummy data for trainees select - in a real app, fetch from API
  const [trainees, setTrainees] = useState([
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Robert Johnson" },
    { id: "4", name: "Emily Davis" },
  ]);

  const handleFormSubmit = (data: BatchFormValues) => {
    // Ensure end date is not before start date
    if (data.endDate < data.startDate) {
      return;
    }
    
    // Ensure end time is not before start time if on same day
    const isSameDay = data.startDate.toDateString() === data.endDate.toDateString();
    if (isSameDay && data.endTime < data.startTime) {
      return;
    }
    
    onSubmit(data);
  };

  // Format time for display
  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Name*
          </label>
          <input
            {...register("batchName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.batchName && (
            <p className="mt-1 text-sm text-red-600">{errors.batchName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Type*
          </label>
          <select
            {...register("trainingType")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
          {errors.trainingType && (
            <p className="mt-1 text-sm text-red-600">{errors.trainingType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date*
          </label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                dateFormat="MMMM d, yyyy"
              />
            )}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date*
          </label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                dateFormat="MMMM d, yyyy"
                minDate={startDate} // Ensure end date is not before start date
              />
            )}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time*
          </label>
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          />
          {errors.startTime && (
            <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time*
          </label>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign Trainer
        </label>
        <select
          {...register("trainerId")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoadingTrainers}
        >
          <option value="">Select a trainer</option>
          {trainers.map((trainer) => (
            <option 
              key={trainer.id} 
              value={trainer.id}
              disabled={!trainer.availability}
            >
              {trainer.name} - {trainer.specialization} {!trainer.availability && "(Unavailable)"}
            </option>
          ))}
        </select>
        {isLoadingTrainers && <p className="mt-1 text-xs text-gray-500">Loading trainers...</p>}
        {trainerError && <p className="mt-1 text-sm text-red-600">{trainerError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trainees
        </label>
        <select
          multiple
          {...register("trainees")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-32"
        >
          {trainees.map((trainee) => (
            <option key={trainee.id} value={trainee.id}>
              {trainee.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Hold Ctrl/Cmd to select multiple trainees
        </p>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData?.batchName ? "Update Batch" : "Create Batch"}
        </Button>
      </div>
    </form>
  );
} 