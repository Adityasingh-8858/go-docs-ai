import Sidebar from "@/components/dashboard/Sidebar";
import SentryUserTracker from "@/components/dashboard/SentryUserTracker";
import UserNav from "@/components/dashboard/UserNav";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SentryUserTracker />
      {/* I will create the Sidebar component later */}
      <Sidebar />

      <main className="flex-1 p-8 bg-zinc-900/50">
        <div className="flex justify-end mb-8">
            {/* I will create the UserNav component later */}
            <UserNav />
        </div>
        {children}
      </main>
    </div>
  );
}
