"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  User,
  Bell,
  Languages,
} from "lucide-react";

const navItems = [
  { name: "Pārskats", href: "/admin", icon: LayoutDashboard },
  { name: "Navigācija", href: "/admin/navigation", icon: Settings },
  { name: "Slaideris", href: "/admin/slider", icon: Package },
  { name: "Produkti", href: "/admin/products", icon: Package },
  { name: "Pasūtījumi", href: "/admin/orders", icon: ShoppingCart },
  { name: "Klienti", href: "/admin/customers", icon: Users },
  { name: "Tulkojumi", href: "/admin/translations", icon: Languages },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panelis</h1>
                  <p className="text-sm text-gray-500">Veikala pārvaldības sistēma</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Bell className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={signOut}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Iziet
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                className="flex items-center space-x-2 px-4 py-4 text-gray-600 hover:text-emerald-600 hover:border-emerald-600 border-b-2 border-transparent transition-all duration-200 whitespace-nowrap group"
              >
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
