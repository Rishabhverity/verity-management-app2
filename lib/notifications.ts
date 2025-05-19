// Notification types and utility functions
export interface Notification {
  id: string;
  batchId: string;
  batchName: string;
  trainerId?: string;
  trainerName?: string;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: string;
  type: "TRAINING_DECLINED" | "PURCHASE_ORDER_NEEDED" | "SYSTEM";
  actionUrl?: string;
}

/**
 * Creates a notification and stores it in localStorage
 */
export function createNotification(data: {
  batchId: string;
  batchName: string;
  message: string;
  trainerId?: string;
  trainerName?: string;
  type: "TRAINING_DECLINED" | "PURCHASE_ORDER_NEEDED" | "SYSTEM";
  actionUrl?: string;
}): Notification {
  try {
    // Create notification object
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      batchId: data.batchId,
      batchName: data.batchName,
      trainerId: data.trainerId,
      trainerName: data.trainerName,
      message: data.message,
      status: "UNREAD",
      createdAt: new Date().toISOString(),
      type: data.type,
      actionUrl: data.actionUrl
    };

    // Get existing notifications
    const existingData = localStorage.getItem('verity-notifications') || "[]";
    const notifications: Notification[] = JSON.parse(existingData);

    // Add the new notification
    const updatedNotifications = [...notifications, notification];

    // Save back to localStorage
    localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Checks if a purchase order exists for a batch
 */
export function checkPurchaseOrderForBatch(batchId: string): boolean {
  try {
    // Get purchase orders from localStorage
    const poData = localStorage.getItem('verity-purchase-orders') || "[]";
    const purchaseOrders = JSON.parse(poData);
    
    // Check if any purchase order is associated with this batch
    return purchaseOrders.some((po: any) => po.batchId === batchId);
  } catch (error) {
    console.error("Error checking purchase order for batch:", error);
    return false;
  }
}

/**
 * Creates a notification for batches without purchase orders
 */
export function createPurchaseOrderNotification(batchId: string, batchName: string): Notification | null {
  try {
    // Check if a notification already exists for this batch
    const existingData = localStorage.getItem('verity-notifications') || "[]";
    const notifications: Notification[] = JSON.parse(existingData);
    
    // Check if a PO notification already exists for this batch
    const existingNotification = notifications.find(
      n => n.batchId === batchId && 
           n.type === "PURCHASE_ORDER_NEEDED" && 
           n.status === "UNREAD"
    );
    
    if (existingNotification) {
      return null; // Notification already exists
    }
    
    // Create a new notification
    return createNotification({
      batchId,
      batchName,
      message: `Purchase order needed for batch: ${batchName}. Please create a purchase order for this batch.`,
      type: "PURCHASE_ORDER_NEEDED",
      actionUrl: `/purchase-orders?batchId=${batchId}`
    });
  } catch (error) {
    console.error("Error creating purchase order notification:", error);
    return null;
  }
}

/**
 * Checks all batches and creates notifications for those without purchase orders
 */
export function checkAllBatchesForPurchaseOrders(): void {
  try {
    // Get batches from localStorage
    const batchesData = localStorage.getItem('verity-batches') || "[]";
    const batches = JSON.parse(batchesData);
    
    // Check each batch
    batches.forEach((batch: any) => {
      // Skip batches that already have purchase orders
      if (batch.hasPurchaseOrder) return;
      
      // Create notification for batches without POs
      createPurchaseOrderNotification(batch.id, batch.batchName);
    });
  } catch (error) {
    console.error("Error checking batches for purchase orders:", error);
  }
}
