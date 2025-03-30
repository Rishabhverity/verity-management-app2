"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TRAINER");
  const [specialization, setSpecialization] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in or not authorized
  if (status === "loading") {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
  if (userRole !== "OPERATIONS" && userRole !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700">
          You do not have permission to access this page. Only Operations and Admin users can register new users.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name || !email || !password || !role) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (role === "TRAINER" && !specialization) {
      setError("Specialization is required for trainers");
      return;
    }
    
    if ((role === "OPERATIONS" || role === "ACCOUNTS") && !department) {
      setError("Department is required for operations and accounts users");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          specialization: role === "TRAINER" ? specialization : undefined,
          department: ["OPERATIONS", "ACCOUNTS"].includes(role) ? department : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }
      
      setSuccess(`User ${name} created successfully!`);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("TRAINER");
      setSpecialization("");
      setDepartment("");
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register New User</h1>
        <p className="text-gray-700 mt-2">
          Create accounts for trainers, operations staff, and accounts department
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 text-red-800 rounded-md p-3 mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-800 rounded-md p-3 mb-4">
            {success}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-800">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-800">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            >
              <option value="TRAINER">Trainer</option>
              <option value="OPERATIONS">Operations</option>
              <option value="ACCOUNTS">Accounts</option>
              <option value="TRAINEE">Trainee</option>
            </select>
          </div>
          
          {role === "TRAINER" && (
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-800">
                Specialization
              </label>
              <input
                id="specialization"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., Web Development, Data Science"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
          )}
          
          {["OPERATIONS", "ACCOUNTS"].includes(role) && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-800">
                Department
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Finance, Human Resources"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
          )}
          
          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 