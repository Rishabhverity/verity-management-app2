"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Dashboard card component
interface DashboardCardProps {
  title: string;
  description: string;
  link: string;
  count?: number;
  badge?: number;
}

const DashboardCard = ({ title, description, link, count, badge }: DashboardCardProps) => {
  const router = useRouter();
  
  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:border-blue-400"
      onClick={() => router.push(link)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          {badge && badge > 0 ? (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {badge}
            </span>
          ) : null}
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {count || 0}
        </span>
      </div>
      <p className="text-gray-700 text-sm">{description}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      setNotificationCount(getUnreadNotificationsCount());
    }
  }, [status, router, session]);

  // Get unread notifications count from localStorage
  function getUnreadNotificationsCount() {
    if (typeof window === 'undefined') return 0;
    
    try {
      const storedNotifications = localStorage.getItem('verity-notifications') || "[]";
      const notifications = JSON.parse(storedNotifications);
      return notifications.filter((n: any) => n.status === "UNREAD").length;
    } catch (error) {
      console.error("Error reading notifications:", error);
      return 0;
    }
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  const renderRoleBasedContent = () => {
    if (!session?.user?.role) return null;

    const userRole = String(session.user.role).toUpperCase();
    
    switch (userRole) {
      case "ADMIN":
        return (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Admin Dashboard</h2>
              <p className="text-gray-600">Manage all aspects of the training system from this central dashboard.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="Manage Batches"
                description="Create and manage training batches"
                link="/batches"
                count={0}
              />
              <DashboardCard
                title="Trainer Assignments"
                description="Assign trainers to batches"
                link="/trainers"
                count={0}
              />
              <DashboardCard
                title="User Management"
                description="Create and manage user accounts"
                link="/admin/register"
                count={0}
              />
              <DashboardCard
                title="Purchase Orders"
                description="Manage purchase orders from clients"
                link="/purchase-orders"
                count={0}
              />
              <DashboardCard
                title="Notifications"
                description="View trainer responses and system notifications"
                link="/admin/notifications"
                count={0}
                badge={notificationCount}
              />
            </div>
          </div>
        );
      case "TRAINER":
        return (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Trainer Dashboard</h2>
              <p className="text-gray-600">Manage your training sessions and materials from this central dashboard.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="My Assignments"
                description="View your assigned training batches"
                link="/trainer/assignments"
                count={0}
              />
              <DashboardCard
                title="My Batches"
                description="View your accepted batches"
                link="/trainer/batches"
                count={0}
              />
              <DashboardCard
                title="Student Attendance"
                description="Manage student attendance for your batches"
                link="/trainer/students"
                count={0}
              />
              <DashboardCard
                title="Training Materials"
                description="Manage your training materials"
                link="/trainer/materials"
                count={0}
              />
            </div>
          </div>
        );
      case "ACCOUNTS":
        return (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Accounts Dashboard</h2>
              <p className="text-gray-600">Manage invoices and purchase orders from this central dashboard.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="Invoices"
                description="Manage client invoices"
                link="/invoices"
                count={0}
              />
              <DashboardCard
                title="Purchase Orders"
                description="View purchase orders"
                link="/purchase-orders"
                count={0}
              />
              <DashboardCard
                title="User Management"
                description="Create and manage user accounts"
                link="/admin/register"
                count={0}
              />
            </div>
          </div>
        );
      case "TRAINEE":
        return (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Trainee Dashboard</h2>
              <p className="text-gray-600">Access your courses and training materials from this central dashboard.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="My Courses"
                description="View your enrolled courses"
                link="/trainee/courses"
                count={0}
              />
              <DashboardCard
                title="Training Materials"
                description="Access training materials"
                link="/trainee/materials"
                count={0}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
            <p className="text-gray-700">Your role hasn't been configured yet. Please contact an administrator.</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section with colored background and better separation */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">
            Welcome, {session?.user?.name || "User"}
          </h1>
          <p className="text-blue-100 mt-2">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderRoleBasedContent()}

        <div className="mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">System Stats</h2>
            <p className="text-gray-600">Overview of current system usage and activity.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-400 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Active Batches</p>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Current</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">3</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-400 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Assigned Trainers</p>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">5</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-400 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Active Trainees</p>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Enrolled</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">42</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-400 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Completed Trainings</p>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Total</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 