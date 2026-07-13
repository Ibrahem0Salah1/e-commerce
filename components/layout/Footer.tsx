import Link from "next/link";
import { ShieldCheck, Truck, Banknote } from "lucide-react";
import Logo from "./Logo";
import { getCategories } from "@/lib/categories/queries";

export async function Footer() {
    const categories = await getCategories();

    return (
        <footer className="border-t border-border bg-secondary/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main footer content */}
                <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Logo />
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            Premium dental supplies delivered to clinics across Egypt.
                            Authentic products with fast nationwide delivery.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Quick Links
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {[
                                { label: "Home", href: "/" },
                                { label: "Shop", href: "/shop" },
                                { label: "Contact", href: "/#contact" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Categories
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {categories.slice(0, 6).map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/shop?category=${category.slug}`}
                                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                            {categories.length > 6 && (
                                <li>
                                    <Link
                                        href="/shop"
                                        className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                                    >
                                        View all &rarr;
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Trust & Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Why MDS?
                        </h3>
                        <ul className="mt-4 space-y-3">
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                                Authentic products
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Truck className="h-4 w-4 shrink-0 text-primary" />
                                Nationwide delivery
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Banknote className="h-4 w-4 shrink-0 text-primary" />
                                Cash on delivery
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-border py-6 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} MDS. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Medical &amp; Dental Store — Egypt
                    </p>
                </div>
            </div>
        </footer>
    );
}
