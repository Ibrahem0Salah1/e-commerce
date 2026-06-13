import Link from "next/link";
import { CategoriesMenu } from "../layout/CategoriesMenu";

export function DesktopNav() {
    return (
        <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
                Home
            </Link>
            <CategoriesMenu />
            <Link href="/shop" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
                Shop
            </Link>
            <Link href="/#contact" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
                Contact
            </Link>
        </nav>
    );
}