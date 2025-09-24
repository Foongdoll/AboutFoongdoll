import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"

export type Menu = "main" | "resume" | "experience" | "post"
type MenuContextType = {
  menu: Menu; 
  setMenu: (m: Menu) => void
  sideOpen: boolean, 
  setSideOpen: (b: boolean) => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()              // ✅ 라우터 위치
  const [menu, setMenu] = useState<Menu>("main")
  const [sideOpen, setSideOpen] = useState<boolean>(true);

  useEffect(() => {
    // pathname: "/", "/resume", "/experience", "/post" ...
    const key = pathname === "/" ? "main" : pathname.slice(1) // 맨 앞 "/" 제거
    // 안전 캐스팅 (정의된 키만 반영)
    const allowed: Menu[] = ["main", "resume", "experience", "post"]
    setMenu(allowed.includes(key as Menu) ? (key as Menu) : "main")
  }, [pathname])                                  

  return (
    <MenuContext.Provider value={{ menu, setMenu, sideOpen, setSideOpen }}>
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error("useMenu must be used within a MenuProvider")
  return ctx
}
