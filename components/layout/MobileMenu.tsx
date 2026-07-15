"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  Store,
  Mail,
  Menu,
  X,
  User as UserIcon,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { SessionUser } from "@/lib/types";
import { signOutAction } from "@/lib/auth/actions";
import type { getCategoriesWithFamilies } from "@/lib/categories/queries";
import type { getBrands } from "@/lib/categories/queries";

type Category = Awaited<ReturnType<typeof getCategoriesWithFamilies>>[number];
type Brand = Awaited<ReturnType<typeof getBrands>>[number];

type ActiveView =
  | { type: "main" }
  | { type: "category"; data: Category }
  | { type: "brands" };

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
  const [view, setView] = useState<ActiveView>({ type: "main" });
  const router = useRouter();

  const close = () => {
    setOpen(false);
    setTimeout(() => setView({ type: "main" }), 300);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => setView({ type: "main" }), 300);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden hover:bg-secondary/60 rounded-[6px]"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-screen max-w-none data-[side=right]:w-screen data-[side=right]:max-w-none sm:max-w-none border-r-0 p-0 duration-300 ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-left-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full flex flex-col"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* ───── HEADER BAR — centered app mark ───── */}
        <div className="sticky top-0 z-10 grid h-14 grid-cols-3 items-center border-b border-border/15 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div />
          <Logo />
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={close}
              className="rounded-full hover:bg-secondary/60"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ───── SLIDING PANELS WRAPPER ───── */}
        {/* ───── SLIDING PANELS WRAPPER ───── */}
        <div className="relative w-full min-w-0  overflow-hidden flex flex-col flex-1">
          <div
            className={cn(
              "flex w-[200%] min-w-0 flex-1 transition-transform duration-300 ease-out h-full",
              view.type !== "main" ? "-translate-x-1/2" : "translate-x-0"
            )}
          >
            {/* PANEL 1: MAIN MENU */}
            <div className="w-1/2 flex flex-col h-full overflow-x-hidden overscroll-contain pb-8">
              <div className="px-5 py-4">
                <nav className="flex flex-col gap-0.5">
                  <Link
                    href="/"
                    onClick={close}
                    className="rounded-[6px] px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary/60 hover:text-foreground"
                  >
                    <span className="flex items-center gap-2.5">
                      <Home className="h-4 w-4 text-muted-foreground/80" /> Home
                    </span>
                  </Link>
                  <Link
                    href="/shop"
                    onClick={close}
                    className="rounded-[6px] px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary/60 hover:text-foreground"
                  >
                    <span className="flex items-center gap-2.5">
                      <Store className="h-4 w-4 text-muted-foreground/80" /> Shop all
                    </span>
                  </Link>
                </nav>
              </div>

              <Separator className="mx-5 my-1 bg-border/15" />

              <div className="px-5 py-2 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 py-1">
                  Catalog
                </p>
                <button
                  type="button"
                  onClick={() => setView({ type: "brands" })}
                  className="w-full flex items-center justify-between rounded-[6px] px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary/60 active:bg-secondary"
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="h-4 w-4 text-muted-foreground/80" /> Brands
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </button>
                <div className="space-y-0.5 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 py-1">
                    Categories
                  </p>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (category.families.length > 0) {
                          setView({ type: "category", data: category });
                        } else {
                          router.push(`/shop?category=${category.slug}`);
                          close();
                        }
                      }}
                      className="w-full flex items-center justify-between rounded-[6px] px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary/60 active:bg-secondary"
                    >
                      <span className="truncate">{category.name}</span>
                      {category.families.length > 0 ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 ml-2" />
                      ) : (
                        <span className="text-[10px] font-normal text-muted-foreground/50 shrink-0 ml-2">all</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="mx-5 my-2 bg-border/15" />

              <div className="px-5 py-2">
                <Link
                  href="/#contact"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  <Mail className="h-4 w-4 text-muted-foreground/80" /> Contact
                </Link>
              </div>
            </div>

            {/* PANEL 2: DETAILS (CATEGORIES OR BRANDS) */}
            <div className="w-1/2 flex flex-col h-full overflow-y-auto pb-8 border-l border-border/10">
              <div className="px-2 py-4">
                <button
                  type="button"
                  onClick={() => setView({ type: "main" })}
                  className="flex items-center gap-2 text-xs font-semibold text-primary mb-4 py-1.5 hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Menu
                </button>

                {view.type === "category" && (
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-border/15">
                      <h3 className="text-sm font-bold text-foreground">{view.data.name}</h3>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">Select a subcategory</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/shop?category=${view.data.slug}`}
                        onClick={close}
                        className="rounded-[6px] px-3 py-2.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        View all {view.data.name}
                      </Link>
                      {view.data.families.map((family) => (
                        <Link
                          key={family.id}
                          href={`/shop?category=${view.data.slug}&family=${family.slug}`}
                          onClick={close}
                          className="rounded-[6px] px-3 py-2.5 text-sm text-foreground/85 hover:bg-secondary/60 hover:text-foreground transition-colors"
                        >
                          {family.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {view.type === "brands" && (
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-border/15">
                      <h3 className="text-sm font-bold text-foreground">Brands</h3>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">Filter by brand</p>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {brands.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/shop?brand=${brand.slug}`}
                          onClick={close}
                          className="flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm text-foreground/85 hover:bg-secondary/60 hover:text-foreground transition-colors"
                        >
                          {brand.logo ? (
                            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-border/20 bg-white p-0.5">
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                width={20}
                                height={20}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-semibold text-muted-foreground">
                              {brand.name[0]}
                            </span>
                          )}
                          <span className="truncate">{brand.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ───── ACCOUNT ACTIONS ───── */}
        {user ? (
          <div className="border-t border-border/15 px-4 py-3 bg-secondary/10 flex flex-col gap-1">
            <Link href={`/profile/${user.id}`} onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 text-xs text-foreground/80 rounded-[6px] h-9">
                <UserIcon className="h-3.5 w-3.5" /> Profile
              </Button>
            </Link>
            <Link href="/settings" onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 text-xs text-foreground/80 rounded-[6px] h-9">
                <Settings className="h-3.5 w-3.5" /> Settings
              </Button>
            </Link>
            <form action={signOutAction} className="w-full mt-1">
              <Button type="submit" variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-[6px] h-9 justify-start gap-2.5">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <div className="border-t border-border/15 px-4 py-3">
            <Link href="/auth/signup" onClick={close}>
              <Button className="w-full rounded-[6px] text-sm py-2">
                Sign in
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}