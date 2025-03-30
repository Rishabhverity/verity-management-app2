"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Function to return appropriate navigation items based on user role
  function roleBasedNavItems(userRole: string) {
    // Convert role to uppercase for consistent comparison
    const role = userRole?.toUpperCase() || "";
    
    switch (role) {
      case "ADMIN":
        return [
          { name: "Dashboard", href: "/dashboard" },
          { name: "Batches", href: "/batches" },
          { name: "Trainers", href: "/trainers" },
          { name: "Users", href: "/admin/users" },
          { name: "Purchase Orders", href: "/purchase-orders" },
        ];
      case "OPERATIONS":
        return [
          { name: "Dashboard", href: "/dashboard" },
          { name: "Batches", href: "/batches" },
          { name: "Trainers", href: "/trainers" },
          { name: "Purchase Orders", href: "/purchase-orders" },
        ];
      case "ACCOUNTS":
        return [
          { name: "Dashboard", href: "/dashboard" },
          { name: "Purchase Orders", href: "/purchase-orders" },
          { name: "Invoices", href: "/invoices" },
        ];
      case "TRAINER":
        return [
          { name: "Dashboard", href: "/dashboard" },
          { name: "Batches", href: "/trainer/batches" },
          { name: "Assignments", href: "/trainer/assignments" },
          { name: "Students", href: "/trainer/students" },
          { name: "Materials", href: "/trainer/materials" },
        ];
      default:
        return [
          { name: "Dashboard", href: "/dashboard" },
        ];
    }
  }

  return (
    <header className="bg-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 text-xl font-bold text-blue-600">
            Training Management System
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        {/* Desktop navigation */}
        {session?.user && (
          <div className="hidden lg:flex lg:gap-x-6">
            {roleBasedNavItems(session.user.role).map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          {session?.user ? (
            <>
              <div className="text-sm text-gray-700 mb-2">
                {session.user.name} ({session.user.role})
              </div>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-sm font-semibold leading-6"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 z-50"></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 text-xl font-bold text-blue-600">
                TMS
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                {session?.user && (
                  <div className="space-y-2 py-6">
                    {roleBasedNavItems(session.user.role).map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="py-6">
                  {session?.user ? (
                    <>
                      <div className="text-sm text-gray-700 mb-2">
                        {session.user.name} ({session.user.role})
                      </div>
                      <button 
                        onClick={handleSignOut}
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}; 