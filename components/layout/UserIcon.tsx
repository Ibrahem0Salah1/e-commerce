
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, User as UserIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { SessionUser } from "@/lib/types";
import { isAdminRole } from "@/lib/auth/roles";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { authClient } from "@/lib/auth/client";



export default function UserMenu({ user }: { user: SessionUser | null }) {
    if (!user) {
        return (
            <Link href="/auth/signup">
                <Button variant="ghost" size="sm" className="text-sm text-foreground hover:text-primary">
                    Sign in
                </Button>
            </Link>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative h-9 w-9 overflow-hidden rounded-full border border-border transition-colors hover:border-primary">
                    {user.image ? (
                        <Image src={user.image} alt={user.name} width={40} height={40} quality={60} className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary">
                            <span className="text-xs font-semibold text-primary-foreground">
                                {user.name?.[0]?.toUpperCase() ?? "U"}
                            </span>
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-foreground">{user.name}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdminRole(user.role) && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex cursor-pointer items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Admin
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`} className="flex cursor-pointer items-center gap-2">
                        <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex cursor-pointer items-center gap-2">
                        <Settings className="h-4 w-4" /> Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex cursor-pointer items-center gap-2 text-destructive">
                    <form action={signOutAction}>
                        <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-sm"
                        >
                            Sign out
                        </Button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
