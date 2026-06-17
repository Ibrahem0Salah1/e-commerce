"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Home,
    Store,
    Mail,
    Menu,
    X,
    User as UserIcon,
    Settings,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { SessionUser } from "@/lib/types";
import { signOutAction } from "@/lib/auth.actions";
import type { getCategories } from "@/lib/categories";
import type { getBrands } from "@/lib/categories";

type Category = Awaited<ReturnType<typeof getCategories>>[number];
type Brand = Awaited<ReturnType<typeof getBrands>>[number];

export function MobileMenu({
    user,
    categories,
    brands,
}: {
    user: SessionUser | null;
    categories: Category[];
    brands: Brand[];
}) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);


    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-secondary">
                    {open ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="flex w-[300px] flex-col gap-0 p-0 sm:w-[380px]">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>

                {/* ───── USER CARD ───── */}
                <div className="border-b border-border p-4 mt-10">
                    {user ? (
                        <Link
                            href={`/profile/${user.id}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition-colors hover:bg-secondary"
                        >
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-border">
                                {user.image ? (
                                    <Image src={user.image} alt={user.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-primary">
                                        <span className="text-sm font-semibold text-primary-foreground">
                                            {user.name?.[0]?.toUpperCase() ?? "U"}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    ) : (
                        <Link href="/auth/signup" onClick={close}>
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                Sign in
                            </Button>
                        </Link>
                    )}
                </div>

                {/* ───── SCROLLABLE NAV ───── */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <nav className="flex flex-col gap-0.5">
                        <Link href="/" onClick={close}>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-primary">
                                <Home className="h-4 w-4" /> Home
                            </Button>
                        </Link>
                        <Link href="/shop" onClick={close}>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-primary">
                                <Store className="h-4 w-4" /> Shop all
                            </Button>
                        </Link>
                    </nav>

                    <Separator className="my-2" />

                    <Accordion type="multiple" className="w-full">
                        {/* CATEGORIES */}
                        <AccordionItem value="categories" className="border-b-0">
                            <AccordionTrigger className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary hover:no-underline">
                                Categories
                            </AccordionTrigger>
                            <AccordionContent className="pb-1">
                                <div className="flex flex-col gap-0.5 pl-2">
                                    {categories.map((category) => (
                                        <Link key={category.id} href={`/shop?category=${category.slug}`} onClick={close}>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-between pl-6 text-sm font-normal text-muted-foreground hover:text-primary"
                                            >
                                                {category.name}
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* BRANDS */}
                        <AccordionItem value="brands" className="border-b-0">
                            <AccordionTrigger className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary hover:no-underline">
                                Brands
                            </AccordionTrigger>
                            <AccordionContent className="pb-1">
                                <div className="flex flex-col gap-0.5 pl-2">
                                    {brands.map((brand) => (
                                        <Link key={brand.id} href={`/shop?brand=${brand.slug}`} onClick={close}>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-2 pl-6 text-sm font-normal text-muted-foreground hover:text-primary"
                                            >
                                                {brand.logo ? (
                                                    <Image
                                                        src={brand.logo}
                                                        alt={brand.name}
                                                        width={18}
                                                        height={18}
                                                        className="rounded object-contain"
                                                    />
                                                ) : (
                                                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-secondary text-[9px] font-semibold">
                                                        {brand.name[0]}
                                                    </span>
                                                )}
                                                {brand.name}
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Separator className="my-2" />

                    <Link href="/#contact" onClick={close}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-primary">
                            <Mail className="h-4 w-4" /> Contact
                        </Button>
                    </Link>
                </div>

                {/* ───── ACCOUNT ACTIONS ───── */}
                {user && (
                    <div className="border-t border-border p-2">
                        <Link href={`/profile/${user.id}`} onClick={close}>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-primary">
                                <UserIcon className="h-4 w-4" /> Profile
                            </Button>
                        </Link>
                        <Link href="/settings" onClick={close}>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-primary">
                                <Settings className="h-4 w-4" /> Settings
                            </Button>
                        </Link>
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
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}