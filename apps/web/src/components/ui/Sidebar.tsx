import { Link } from "react-router-dom"
import { useRef, useState, useEffect } from "react"
import "../../styles/Sidebar.css"
import { useMenu } from "../provider/MenuProvider"

const postCategories = [
    { key: "all", label: "All" },
    { key: "frontend", label: "Frontend" },
    { key: "backend", label: "Backend" },
    { key: "infra", label: "Infra/DevOps" },
    { key: "ai", label: "AI/LLM" },
]

// 이력서 섹션(해시로 이동)
const resumeSections = [
    { key: "personal", label: "자기소개", hash: "#personal" },    
    { key: "career", label: "경력", hash: "#career" },
    { key: "education", label: "학력", hash: "#education" },
]

// 회사 목록(경험 상세 필터)
const companies = [
    { key: "1", label: "이노베이션티(주)" },
    { key: "2", label: "울림(주)" },        
]

interface SidebarProps {
    open: boolean;
    toggle: () => void;
}

const Sidebar = ({ open, toggle }: SidebarProps) => {
    const [openPost, setOpenPost] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);
    const { menu } = useMenu();

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        el.style.maxHeight = openPost ? el.scrollHeight + "px" : "0px";
    }, [openPost]);

    if (!open) {
        // ✅ 접힘 상태: 작은 토글 버튼만
        return (
            <aside className="sidebar-collapsed">
                <button onClick={toggle} className="expand-btn">☰</button>
            </aside>
        );
    }

    return (
        <aside className="sidebar-slide sidebar-wrap">
            {menu === "resume" && (
                <nav className="side-section">
                    <h3 className="side-title">Resume <button onClick={toggle} className="collapse-btn">접어두기</button></h3>
                    <ul className="side-list">
                        {resumeSections.map(s => (
                            <li key={s.key}>
                                {/* 같은 페이지 내 해시 이동 */}
                                <a href={`/resume${s.hash}`} className="side-link">
                                    {s.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            {menu === "experience" && (
                <nav className="side-section">
                    <h3 className="side-title">Experience <button onClick={toggle} className="collapse-btn">접어두기</button></h3>
                    <ul className="side-list">
                        {companies.map(c => (
                            <li key={c.key}>
                                {/* 회사별 쿼리로 메인 필터 */}
                                <Link to={`/experience?company=${encodeURIComponent(c.key)}`} className="side-link">
                                    {c.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            {menu === "post" && (
                <section className="side-section">
                    <button onClick={toggle} className="collapse-btn">접어두기</button>
                    <button
                        className="post-toggle"
                        aria-expanded={openPost}
                        onClick={() => setOpenPost(v => !v)}
                    >
                        <span>Post</span>
                        <i className={`chev ${openPost ? "open" : ""}`} aria-hidden />
                    </button>

                    <div ref={contentRef} className="collapse">
                        <ul className="side-list">
                            {postCategories.map(cat => (
                                <li key={cat.key}>
                                    <Link
                                        to={`/post?category=${encodeURIComponent(cat.key)}`}
                                        className="side-link"
                                    >
                                        {cat.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </aside>
    )
}

export default Sidebar
