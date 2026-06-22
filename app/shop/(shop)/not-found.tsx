import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center gap-4 py-16">
            <h2 className="text-xl font-semibold">Page not found</h2>
            <Link href="/shop">Back to shop</Link>
        </div>
    );
}