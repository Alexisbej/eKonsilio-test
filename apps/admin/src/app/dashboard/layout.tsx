"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/constants";
import { removeAuthCookie } from "@/lib/cookies";
import { User } from "@ekonsilio/types";
import axios from "axios";
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/auth/profile`, {
          withCredentials: true,
        });
        if (!response.status) {
          throw new Error("Failed to fetch user profile");
        }
        const userData = await response.data;
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await removeAuthCookie();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-16 md:w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-center md:justify-start">
          <span className="hidden md:block font-bold text-xl">eKonsilio</span>
          <span className="block md:hidden font-bold text-xl">e</span>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center p-2 rounded-md ${
              pathname === "/dashboard"
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span className="hidden md:block">Dashboard</span>
          </Link>

          <Link
            href="/dashboard/conversations"
            className={`flex items-center p-2 rounded-md ${
              pathname.startsWith("/dashboard/conversations")
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <MessageSquare className="h-5 w-5 mr-3" />
            <span className="hidden md:block">Conversations</span>
          </Link>

          <Link
            href="/dashboard/clients"
            className={`flex items-center p-2 rounded-md ${
              pathname.startsWith("/dashboard/clients")
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Users className="h-5 w-5 mr-3" />
            <span className="hidden md:block">Clients</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center p-2 rounded-md ${
              pathname.startsWith("/dashboard/settings")
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            <span className="hidden md:block">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar-placeholder.png" />
                  <AvatarFallback className="uppercase">
                    {user?.name ? user.name[0] : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2 hidden md:block">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
