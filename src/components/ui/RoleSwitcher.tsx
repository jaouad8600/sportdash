"use client";

import { useAuth } from "@/components/providers/AuthContext";
import { Role } from "@prisma/client";
import { Shield } from "lucide-react";

export default function RoleSwitcher() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-50 flex items-center space-x-3">
            <div className="flex items-center text-sm font-medium text-gray-700">
                <Shield size={16} className="mr-2 text-blue-600" />
                <span className="hidden sm:inline">Huidige Rol:</span>
            </div>
            <div className="text-sm font-bold text-blue-600">
                {user.role}
            </div>
        </div>
    );
}
