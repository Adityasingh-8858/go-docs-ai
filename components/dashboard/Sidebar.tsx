"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, CreditCard, UploadCloud, Bot } from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Billing", href: "/billing", icon: CreditCard },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 bg-gray-900 text-white p-4 border-r border-gray-700">
            <div className="flex items-center mb-10">
                <Bot size={28} className="text-purple-400" />
                <h1 className="text-xl font-bold ml-2">IntelliDocs AI</h1>
            </div>

            <div className="flex-1">
                <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.name} href={item.href}>
                            <span className={cn(
                                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            )}>
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto">
                <Link href="/upload">
                    <Button variant="secondary" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Upload PDF
                    </Button>
                </Link>
            </div>
        </div>
    );
}
