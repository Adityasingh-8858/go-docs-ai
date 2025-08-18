import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function UserNav() {
    const user = await currentUser();

    return (
        <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
                Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}!
            </span>
            <UserButton afterSignOutUrl="/" />
        </div>
    );
}
