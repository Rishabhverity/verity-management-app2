import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { authOptions } from "./auth-config";

export { authOptions };

export const getSession = async () => {
  return await getServerSession(authOptions);
};

export const getCurrentUser = async () => {
  const session = await getSession();

  return session?.user;
};

export const requireAuth = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }
};

export const requireRole = async (allowedRoles: UserRole[]) => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect("/unauthorized");
  }
}; 