"use client";

import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import QuickActions from "@/components/dashboard/QuickActions";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-black dark:via-gray-950 dark:to-black relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 dark:from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-orange-500/5 dark:from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 3.8, duration: 0.5, ease: "easeOut" }} // Delay to match splash screen exit (3.5s + slide)
        className="z-20"
      >
        <Sidebar />
      </motion.div>

      {/* Main Content */}
      <motion.main
        className="flex-1 p-4 md:p-8 pt-16 md:pt-8 transition-all duration-300 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 4.0, duration: 0.5, ease: "easeOut" }}
      >
        <Breadcrumbs />

        {/* Quick Actions - Available on all pages */}
        <div className="max-w-[1600px] mx-auto mb-6">
          <QuickActions />
        </div>

        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
