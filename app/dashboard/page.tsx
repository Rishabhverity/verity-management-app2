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
  count: number;
}

const DashboardCard = ({ title, description, link, count }: DashboardCardProps) => {
  const router = useRouter();
  
  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => router.push(link)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {count}
        </span>
      </div>
      <p className="text-gray-700 text-sm">{description}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  const renderRoleBasedContent = () => {
    if (!session?.user?.role) return null;

    switch (session.user.role) {
      case "OPERATIONS":
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Operations Dashboard</h2>
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
                title="Purchase Orders"
                description="Manage purchase orders from clients"
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
      case "TRAINER":
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Trainer Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="My Assignments"
                description="View your assigned training batches"
                link="/trainer/assignments"
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
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Accounts Dashboard</h2>
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
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Trainee Dashboard</h2>
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
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session?.user?.name || "User"}
        </h1>
        <p className="text-gray-700 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {renderRoleBasedContent()}

      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-700">Active Batches</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-700">Assigned Trainers</p>
            <p className="text-2xl font-bold">5</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-700">Active Trainees</p>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-700">Completed Trainings</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </div>
    </div>
  );
} 