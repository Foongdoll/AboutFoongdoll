import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/ui/Header';
import Sidebar from './components/ui/Sidebar';
import Resume from './pages/Resume';
import Experience from './pages/Experience';
import Post from './pages/Post';
import Main from './pages/Main';
import { MenuProvider, useMenu } from './components/provider/MenuProvider';
import NoteBackground from './components/ui/Container';
import { useState } from 'react';
import Login from './pages/Login';

const Layout = () => {
  const { menu } = useMenu();
  const [sidebarOpen, setSidebarOpen] = useState(true); // ✅ 사이드바 열림 여부

  return (
    <NoteBackground>
      {menu === "main" ? null : <Header />}

      <div className="flex">
        {/* 사이드바 */}
        {menu === "main" ? null : (
          <Sidebar open={sidebarOpen} toggle={() => setSidebarOpen(o => !o)} />
        )}

        {/* 메인 컨텐츠 영역 */}
        <div className={menu === "main" ? "w-screen" : sidebarOpen ? "w-[80%]" : "w-full"}>
          <Outlet />
        </div>
      </div>
    </NoteBackground>
  );
};

function App() {
  return (
    <Router>
      <MenuProvider>{/* ✅ Router 내부에서 useLocation 사용 가능 */}
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Main />} />
            <Route path="resume" element={<Resume />} />
            <Route path="experience" element={<Experience />} />
            <Route path="post" element={<Post />} />
            <Route path="admin/login" element={<Login />} />
            <Route path="*" element={<>404</>} />
          </Route>
        </Routes>
      </MenuProvider>
    </Router>
  )
}


export default App
