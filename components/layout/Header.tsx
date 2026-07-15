import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import Logo from "./Logo";
import { DesktopNav } from "../shared/DeskptopNav";
// import { CartButton } from "./CartButton";
import UserMenu from "./UserIcon";
import { MobileMenu } from "./MobileMenu";
import { SessionUser } from "@/lib/types";
import { CartButton } from "./CartButton";
import { getCategoriesWithFamilies, getBrands } from "@/lib/categories/queries";
export async function Header() {
    const [session, categories, brands] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        getCategoriesWithFamilies(),
        getBrands(),
    ]);

    const user: SessionUser | null = session?.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
        }
        : null;


    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background ">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Logo />
                    <DesktopNav />
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    <CartButton />
                    <div className="hidden md:block">
                        <UserMenu user={user} />
                    </div>
                    <MobileMenu user={user} categories={categories} brands={brands} />
                </div>
            </div>
        </header>
    );
}
