import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Menu } from "../components/provider/MenuProvider"

const Main = () => {
  const [turning, setTurning] = useState(false)
  const navigate = useNavigate()

  const handleGoClick = (url : Menu) => {
    setTurning(true)
    // 애니메이션 길이(예: 1s) + 약간 여유를 두고 이동
    setTimeout(() => {
      navigate("/"+url)
    }, 1000)
  }

  return (
    <>
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div
          className={`nbk-opening will-change-transform ${
            turning ? "page-turn" : ""
          }`}
        >
          {/* 표지 느낌의 카드 */}
          <div className="relative mx-auto w-full max-w-3xl rounded-2xl bg-[rgba(255,255,255,0.9)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-[2px] border border-white/60">
            {/* 상단 탭 */}
            <div className="flex gap-2 px-6 pt-5">
              <span className="h-2 w-8 rounded-full bg-neutral-300/70"></span>
              <span className="h-2 w-10 rounded-full bg-neutral-300/70"></span>
              <span className="h-2 w-6 rounded-full bg-neutral-300/70"></span>
            </div>

            <div className="px-8 py-10">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-800 leading-[1.15]">
                Foongdoll <span className="text-neutral-500">Portfolio</span>
              </h1>
              <p className="mt-4 text-neutral-600 text-base md:text-lg leading-relaxed">
                공책 위에 차곡차곡 적어 내려가듯, 제 경력과 작업들을 정리했습니다.
                아래 버튼을 눌러 <span className="font-semibold">이력서 페이지</span>로 이동하세요.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => handleGoClick('resume')}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold border border-neutral-900/10 shadow hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                >
                  ✍️ 이력서 보러가기
                </button>
                <button
                  onClick={() => handleGoClick('experience')}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold border border-neutral-900/10 shadow hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                >
                  🪪 경력 보러가기
                </button>
                <button
                  onClick={() => handleGoClick('post')}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold border border-neutral-900/10 shadow hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                >
                  📋 포스팅 보러가기
                </button>
              </div>
            </div>

            {/* 종이 두께감 */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.04)]" />
          </div>
        </div>
      </div>
    </>
  )
}

export default Main
