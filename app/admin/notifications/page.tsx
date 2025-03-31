"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// For admin notifications
type Notification = {
  id: string;
  batchId: string;
  batchName: string;
  trainerId: string;
  trainerName: string;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: Date;
};

export default function AdminNotificationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    // Check if user is an admin
    const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
    if (userRole !== "ADMIN" && userRole !== "OPERATIONS") {
      router.push("/dashboard");
      return;
    }

    fetchNotifications();
  }, [session, sessionStatus, router]);

  const fetchNotifications = () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from the API
      // For this demo, we'll use localStorage
      const storedNotifications = localStorage.getItem('verity-notifications') || "[]";
      const parsedNotifications = JSON.parse(storedNotifications).map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));
      
      // Sort by most recent first
      parsedNotifications.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(parsedNotifications);
      setError(null);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    try {
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: "READ" as const } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      
      // Update localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error updating notification status:", error);
    }
  };

  const markAllAsRead = () => {
    try {
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        status: "READ" as const
      }));
      
      setNotifications(updatedNotifications);
      
      // Update localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = (notificationId: string) => {
    try {
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      
      setNotifications(updatedNotifications);
      
      // Update localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewBatch = (batchId: string) => {
    router.push(`/batches?id=${batchId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2 text-lg">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
          <Button onClick={fetchNotifications} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold text-gray-600">No notifications</h2>
          <p className="text-gray-500 mt-2">
            You don't have any notifications at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`overflow-hidden ${notification.status === "UNREAD" ? "border-l-4 border-l-blue-500" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Batch Declined: {notification.batchName}
                  </CardTitle>
                  <Badge variant={notification.status === "UNREAD" ? "default" : "outline"}>
                    {notification.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  From: {notification.trainerName} | {formatDate(new Date(notification.createdAt))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{notification.message}</p>
                
                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => viewBatch(notification.batchId)}
                    >
                      View Batch
                    </Button>
                    {notification.status === "UNREAD" && (
                      <Button 
                        variant="outline" 
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 