"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Notification {
  id: string;
  batchId: string;
  batchName: string;
  trainerId: string;
  trainerName: string;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: Date;
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      loadNotifications();
    }
  }, [status, session]);

  const loadNotifications = () => {
    try {
      setLoading(true);
      // In a production app, this would be an API call
      const storedNotifications = localStorage.getItem('verity-notifications') || "[]";
      let parsedNotifications = JSON.parse(storedNotifications);
      
      // Convert string dates to Date objects
      parsedNotifications = parsedNotifications.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));
      
      // Sort by creation date (newest first)
      parsedNotifications.sort((a: Notification, b: Notification) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      setNotifications(parsedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    try {
      // Update in state
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: "READ" as const } 
          : notification
      );
      setNotifications(updatedNotifications);
      
      // Update in localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = () => {
    try {
      // Update all notifications to READ status
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        status: "READ" as const
      }));
      setNotifications(updatedNotifications);
      
      // Update in localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = (notificationId: string) => {
    try {
      // Remove from state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      setNotifications(updatedNotifications);
      
      // Update in localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <div className="text-center py-10">Loading notifications...</div>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <div className="bg-red-100 p-4 rounded mb-4">
          You need to be logged in as an admin to view notifications
        </div>
        <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-block">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={loadNotifications}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
          >
            Refresh
          </button>
          
          <button
            onClick={markAllAsRead}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            disabled={notifications.every(n => n.status === "READ")}
          >
            Mark All as Read
          </button>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <h2 className="text-lg font-medium text-gray-700 mb-2">No Notifications</h2>
          <p className="text-gray-500">
            You don't have any notifications at this time
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`border rounded-lg p-4 ${
                notification.status === "UNREAD" 
                  ? "bg-blue-50 border-blue-200" 
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {notification.status === "UNREAD" && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    )}
                    Training Declined: {notification.batchName}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Trainer: {notification.trainerName}
                  </p>
                  <p className="mt-2">{notification.message}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {notification.status === "UNREAD" && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 