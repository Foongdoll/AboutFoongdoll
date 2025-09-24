import type { ReactNode } from "react";

type CardPros = {
    Header: ReactNode,
    Content: ReactNode,
    Footer: ReactNode
}

const Card = ({ Header, Content, Footer }: CardPros) => {
    return (
        <div className="relative mx-auto w-full max-w-3xl rounded-2xl bg-[rgba(255,255,255,0.9)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-[2px] border border-white/60">
            {/* 상단 탭 */}
            <div className="flex gap-2 px-6 pt-5">
                <span className="h-2 w-8 rounded-full bg-neutral-300/70"></span>
                <span className="h-2 w-10 rounded-full bg-neutral-300/70"></span>
                <span className="h-2 w-6 rounded-full bg-neutral-300/70"></span>
            </div>

            {Header}
            <div className="px-8 py-10">

                {Content}
            </div>
            {Footer}

            {/* 종이 두께감 */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.04)]" />
        </div>
    )
}

export default Card;