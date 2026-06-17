import Link from "next/link";
import Image from "next/image";

export default function Logo() {
    return (
        <Link href="/" className="flex justify-center gap-0 items-center">
            <Image src="/zz.svg" alt="MDS" width={42} height={42} className="lg:h-12 lg:w-12 h-10 w-10  " />
            <span className=" text-lg lg:text-2xl font-semibold sm:block text-primary">
                MDS
            </span>
        </Link>
    );
}