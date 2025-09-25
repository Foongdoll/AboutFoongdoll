import type { ReactNode } from "react";

type CardPros = {
  Header: ReactNode,
  Content: ReactNode,
  Footer: ReactNode
}

const Card = ({ Header, Content, Footer }: CardPros) => {
  return (
    <div className="relative mx-auto w-full max-w-4xl rounded-3xl bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur border border-white/60">
      {/* 상단 탭 */}
      <div className="flex gap-2 px-6 pt-5">
        <span className="h-2 w-8 rounded-full bg-neutral-300/70"></span>
        <span className="h-2 w-10 rounded-full bg-neutral-300/70"></span>
        <span className="h-2 w-6 rounded-full bg-neutral-300/70"></span>
      </div>

      {/* Header */}
      <header className="px-8 pt-6">
        <div className="max-w-3xl">
          {Header}
        </div>
      </header>

      {/* Divider */}
      <div className="mx-8 my-4 h-px bg-neutral-200" />

      {/* Content */}
      <main className="px-8 py-8">
        <div className="prose prose-neutral lg:prose-lg max-w-none leading-relaxed
                        prose-h2:mt-10 prose-h2:mb-4 prose-h2:tracking-tight
                        prose-h3:mt-6 prose-p:my-3 prose-ul:my-3 prose-li:my-1
                        prose-strong:font-semibold">
          {Content}
        </div>
      </main>

      {/* Footer */}
      <div className="mx-8 my-4 h-px bg-neutral-200" />
      <footer className="px-8 pb-6">
        <div className="text-sm text-neutral-600 max-w-3xl">
          {Footer}
        </div>
      </footer>

      {/* 종이 두께감 */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.04)]" />
    </div>
  )
}

export default Card;
