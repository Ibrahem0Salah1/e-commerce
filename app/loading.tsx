import Image from "next/image";
export default function AuthLoading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />


                    <div className="relative h-24 w-24 flex items-center justify-center rounded-full">
                        <Image
                            src="/zz.svg"
                            alt="dental logoMark"
                            className="animate-spin-slow rounded-full"
                            width={80}
                            height={80}
                        />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground animate-pulse mt-2">
                    Loading...
                </p>
            </div>
        </div>
    );
}
