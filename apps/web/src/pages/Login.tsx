import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { post, type ResType } from "../lib/api"  // 앞에서 만든 api.ts 활용

const Login = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {

      const res = await post<ResType>("/auth/login", form)

      if (res.success) {
        // 로그인 성공 시 토큰 저장
        localStorage.setItem("token", res.data)
        navigate("/") // 홈이나 원하는 페이지로 이동
      } else {
        alert('로그인에 실패했습니다. 아이디/비밀번호를 확인하세요.');
      }
    } catch (err: any) {
      setError("로그인에 실패했습니다. 아이디/비밀번호를 확인하세요.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(248,246,238)]">
      <div className="w-full max-w-md rounded-xl bg-white/80 shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-neutral-800 mb-6">
          로그인
        </h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">아이디</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
