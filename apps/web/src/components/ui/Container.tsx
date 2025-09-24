import type { ReactNode } from "react";

const NoteBackground = ({ children }: { children: ReactNode }) => {

    return (

        <div className="relative min-h-screen overflow-hidden bg-[rgb(248,246,238)]">
            {/* 종이 배경 레이어 */}
            <div className="absolute inset-0 pointer-events-none">
                {/* 공책 가로줄 */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            // 얇은 가로줄
                            `repeating-linear-gradient(
                to bottom,
                rgba(0,0,0,0.06) 0px,
                rgba(0,0,0,0.06) 1px,
                transparent 1px,
                transparent 32px
              )`,
                        mixBlendMode: "multiply",
                    }}
                />
                {/* 왼쪽 빨간 여백선 */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            `linear-gradient(
                to right,
                transparent 64px,
                rgba(255,0,0,0.25) 64px,
                rgba(255,0,0,0.25) 66px,
                transparent 66px
              )`,
                    }}
                />
                {/* 미세 얼룩(노이즈 대체) */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            `radial-gradient(1200px 600px at 10% 10%, rgba(0,0,0,0.03), transparent 60%),
               radial-gradient(800px 400px at 90% 20%, rgba(0,0,0,0.02), transparent 60%),
               radial-gradient(900px 500px at 50% 100%, rgba(0,0,0,0.025), transparent 60%)`,
                    }}
                />
                {/* 펀치홀 */}
                <div
                    className="absolute top-0 bottom-0 left-[40px] w-[16px]"
                    style={{
                        backgroundImage:
                            `repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 28px,
                radial-gradient(circle at 50% 50%, rgba(0,0,0,0.08) 0 3px, transparent 3px) 28px,
                transparent 56px
              )`,
                        backgroundRepeat: "repeat-y",
                    }}
                />
            </div>
            {children}
        </div>
    )
}

export default NoteBackground;