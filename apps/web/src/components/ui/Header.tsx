import { NavLink, Link } from "react-router-dom"
import logo from "../../assets/images/logo.png"
import "../../styles/Header.css";

const Header = () => {
  return (
    <header className="header-slide">
      <div className="header-inner">
        {/* 로고 */}
        <Link to="/" className="logo-wrap">
          <img
            src={logo}
            alt="Foongdoll Logo"
            className="logo"
            draggable={false}
          />
          <span className="logo-text">Shin Hyun Woo</span>
        </Link>

        {/* 내비게이션 */}
        <nav className="nav">
          <NavItem to="/resume" label="Resume" />
          <NavItem to="/experience" label="Experience" />
          <NavItem to="/post" label="Post" />
        </nav>
      </div>
    </header>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-link ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  )
}

export default Header
