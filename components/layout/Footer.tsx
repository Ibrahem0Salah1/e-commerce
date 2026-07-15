import Link from "next/link";
import { ShieldCheck, Truck, Banknote } from "lucide-react";
import Logo from "./Logo";
import { getCategories } from "@/lib/categories/queries";

export async function Footer() {
    const categories = await getCategories();

    return (
        <footer className="border-t border-border/15 bg-secondary/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* ───── FEATURES / TRUST BANNER ───── */}
                <div className="grid grid-cols-1 gap-6 border-b border-border/15 py-8 sm:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground">Authentic Products</h4>
                            <p className="text-xs text-muted-foreground/80 mt-0.5">100% genuine medical & dental supplies</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground">Nationwide Delivery</h4>
                            <p className="text-xs text-muted-foreground/80 mt-0.5">Fast shipping to clinics across Egypt</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground">Cash on Delivery</h4>
                            <p className="text-xs text-muted-foreground/80 mt-0.5">Pay safely upon receiving your order</p>
                        </div>
                    </div>
                </div>

                {/* ───── MAIN FOOTER CONTENT ───── */}
                <div className="grid grid-cols-2 gap-10 py-12 lg:grid-cols-4 lg:gap-8">
                    {/* Brand Description (Spans 2 columns on mobile/tablet) */}
                    <div className="col-span-2 text-center lg:col-span-2">
                        <Logo />
                        <p className="mt-4 max-w-sm mx-auto text-sm leading-relaxed text-muted-foreground/90">
                            Premium dental supplies delivered to clinics across Egypt.
                            Authentic products with fast nationwide delivery.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div className="col-span-1">
                        <h3 className="text-sm font-bold tracking-tight text-foreground">
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
                                        className="text-sm text-muted-foreground transition-all duration-200 hover:text-primary hover:translate-x-0.5 inline-block"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div className="col-span-1">
                        <h3 className="text-sm font-bold tracking-tight text-foreground">
                            Categories
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {categories.slice(0, 6).map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/shop?category=${category.slug}`}
                                        className="text-sm text-muted-foreground transition-all duration-200 hover:text-primary hover:translate-x-0.5 inline-block"
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                            {categories.length > 6 && (
                                <li>
                                    <Link
                                        href="/shop"
                                        className="text-sm font-semibold text-primary transition-all duration-200 hover:text-primary/80 hover:translate-x-0.5 inline-block"
                                    >
                                        View all &rarr;
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* ───── BOTTOM BAR ───── */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-border/15 py-6 sm:flex-row">
                    <p className="text-xs text-muted-foreground/80">
                        &copy; {new Date().getFullYear()} MDS. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-semibold">
                        Medical &amp; Dental Store — Egypt
                    </p>
                </div>
            </div>
        </footer>
    );
}
