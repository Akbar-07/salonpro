import React, { useEffect, useState } from "react";
import "../css/Navbar.css";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { logout, getUser } from "../api";

/* Navbar uchun avatar circle — rasm bo'lsa ko'rsatadi, yo'q bo'lsa initials */
function NavAvatar({ user, displayName, size = 36 }) {
  const avatarUrl = user?.profile?.avatar || null;
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : "👤";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        style={{
          width: '55px', height: '55px', borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(232,180,217,0.6)",
          boxShadow: "0 2px 8px rgba(232,180,217,0.3)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#E8B4D9,#D4C9F0)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff",
      border: "2px solid rgba(232,180,217,0.5)",
      flexShrink: 0, letterSpacing: "0.5px",
    }}>
      {initials}
    </div>
  );
}

export default function Navbar({ version = "default" }) {
  const toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
  };

  const [open_profile, setOpenProfile] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [active, setActive] = useState("home");
  const { lang, setLang, t } = useTranslation();

  const [user, setUser] = useState(() => getUser());
  const displayName = user
    ? (user.profile?.first_name ? user.profile.first_name : user.username)
    : "";

  // Profile sahifasidan avatar yangilanganda Navbar ni qayta render qilish
  useEffect(() => {
    const handleUserUpdated = () => setUser(getUser());
    window.addEventListener("user-updated", handleUserUpdated);
    return () => window.removeEventListener("user-updated", handleUserUpdated);
  }, []);

  const langChange = (e) => setLang(e.target.checked ? "ru" : "uz");

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  return (
    <div style={{ width: "100%", height: "80px" }}>
      {/* ── DESKTOP NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-container">

          {version === "default" && (
            <>
              <div className="left_side">
                <Link to="/">
                  <div className="navbar-brand">
                    <div className="navbar-logo"><i className="fas fa-cut"></i></div>
                    <div className="navbar-title">Salon Pro</div>
                  </div>
                </Link>
                <a href="/#"       className={`nav-link ${active==="home"?"active":""}`}     onClick={()=>setActive("home")}><i className="fas fa-home"></i><span>{t.navbar_home}</span></a>
                <a href="/#masters"className={`nav-link ${active==="masters"?"active":""}`}  onClick={()=>setActive("masters")}><i className="fas fa-users"></i>{t.navbar_masters}</a>
                <a href="/#services"className={`nav-link ${active==="services"?"active":""}`}onClick={()=>setActive("services")}><i className="fas fa-scissors"></i>{t.navbar_services}</a>
                <a href="/#booking" className={`nav-link ${active==="booking"?"active":""}`} onClick={()=>setActive("booking")}><i className="fas fa-calendar-check"></i>{t.navbar_booking}</a>
              </div>
              <div className="navbar-menu">
                <div className="toggle-button-cover">
                  <div id="button-3" className="button r">
                    <input onChange={langChange} className="checkbox" type="checkbox" checked={lang==="ru"} />
                    <div className="knobs"></div><div className="layer"></div>
                  </div>
                </div>
                {user ? (
                  <div className="profile_template">
                    <div onClick={()=>setOpenProfile((p)=>!p)} className="nav-link-filled" style={{cursor:"pointer"}}>
                      <i className="fas fa-user-circle"></i>{displayName}
                    </div>
                    <div className={`profil_modal_open ${open_profile?"active":""}`}>
                      <span style={{fontSize:"13px",fontWeight:500,color:"var(--ink)"}}>{displayName}</span>
                      <hr style={{marginTop:"10px",borderColor:"var(--border)"}} />
                      <div className="profil_dashboard">
                        <a href="/login" onClick={handleLogout}><div className="profil_info danger"><i className="fas fa-sign-out-alt"></i>{t.navbar_logout}</div></a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link className="nav-link-filled" to="/login">
                    <i className="fas fa-user-circle"></i>{t.navbar_login}
                  </Link>
                )}
              </div>
            </>
          )}

          {version === "masters" && (
            <>
              <div className="left_side">
                <Link to="/masters">
                  <div className="navbar-brand">
                    <div className="navbar-logo"><i className="fas fa-cut"></i></div>
                    <div className="navbar-title">Salon Pro</div>
                  </div>
                </Link>
                <Link className={`nav-link ${isActive("/masters")?"active":""}`}       to="/masters"><i className="fas fa-home"></i><span>{t.navbar_home}</span></Link>
                <Link className={`nav-link ${isActive("/create_client")?"active":""}`} to="/create_client"><i className="fas fa-user-plus"></i><span>{t.navbar_add_client}</span></Link>
                <Link className={`nav-link ${isActive("/dashboard")?"active":""}`}     to="/dashboard"><i className="fas fa-chart-line"></i><span>{t.navbar_income}</span></Link>
                {user?.is_master_admin && (
                  <Link className={`nav-link ${isActive("/admin")?"active":""}`} to="/admin">
                    <i className="fas fa-shield-alt"></i><span>Admin Panel</span>
                  </Link>
                )}
              </div>
              <div className="navbar-menu">
                <div className="toggle-button-cover">
                  <div id="button-3" className="button r">
                    <input onChange={langChange} className="checkbox" type="checkbox" checked={lang==="ru"} />
                    <div className="knobs"></div><div className="layer"></div>
                  </div>
                </div>
                <div className="profile_template">
                  {/* Faqat avatar circle — matn yo'q */}
                  <div
                    onClick={() => setOpenProfile(p => !p)}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <NavAvatar user={user} displayName={displayName} size={42} />
                  </div>
                  <div className={`profil_modal_open ${open_profile ? "active" : ""}`}>
                    {/* Faqat ism — avatar yo'q */}
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                      {displayName}
                    </span>
                    <hr style={{ marginTop: "10px", borderColor: "var(--border)" }} />
                    <div className="profil_dashboard">
                      <Link to="/profile"><div className="profil_info"><i className="fas fa-cog"></i>{t.navbar_profile_settings}</div></Link>
                      {user?.is_master_admin && (
                        <Link to="/admin"><div className="profil_info"><i className="fas fa-shield-alt"></i>Admin Panel</div></Link>
                      )}
                      <a href="/login" onClick={handleLogout}><div className="profil_info danger"><i className="fas fa-sign-out-alt"></i>{t.navbar_logout}</div></a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </nav>

      {/* ── MOBILE NAVBAR ── */}
      <div className="mobile-navbar">
        <button className="menu-btn" onClick={toggleSidebar}><i className="fas fa-bars"></i></button>
        <div className="navbar-brand">
          <div className="navbar-logo" style={{width:"34px",height:"34px"}}><i className="fas fa-cut" style={{fontSize:"16px"}}></i></div>
          <div className="navbar-title">Salon Pro</div>
        </div>
        <div className="toggle-button-cover">
          <div id="button-3" className="button r">
            <input onChange={langChange} className="checkbox" type="checkbox" checked={lang==="ru"} />
            <div className="knobs"></div><div className="layer"></div>
          </div>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div className="sidebar" id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><i className="fas fa-cut"></i></div>
          <div className="sidebar-title"><h2>Salon Pro</h2><p>Premium Edition</p></div>
        </div>
        {version === "default" && (
          <div className="sidebar-menu">
            <a href="/#"        className={`menu-item ${active==="home"?"active":""}`}    onClick={()=>{toggleSidebar();setActive("home");}}><i className="fas fa-home"></i><span>{t.navbar_home}</span></a>
            <a href="/#masters" className={`menu-item ${active==="masters"?"active":""}`} onClick={()=>{toggleSidebar();setActive("masters");}}><i className="fas fa-users"></i>{t.navbar_masters}</a>
            <a href="/#services"className={`menu-item ${active==="services"?"active":""}`}onClick={()=>{toggleSidebar();setActive("services");}}><i className="fas fa-scissors"></i>{t.navbar_services}</a>
            <a href="/#booking" className={`menu-item ${active==="booking"?"active":""}`} onClick={()=>{toggleSidebar();setActive("booking");}}><i className="fas fa-calendar-check"></i>{t.navbar_booking}</a>
            {user ? (
              <>
                <a href="/login" className="menu-item" onClick={(e)=>{e.preventDefault();toggleSidebar();logout();}}><i className="fas fa-sign-out-alt"></i>{t.navbar_logout}</a>
              </>
            ) : (
              <Link className="menu-item active" to="/login" onClick={toggleSidebar}><i className="fas fa-user-circle"></i>{t.navbar_login}</Link>
            )}
          </div>
        )}
        {version === "masters" && (
          <div className="sidebar-menu">
            <div className="sidebar-user-info" style={{display:"flex",margin: "0 15px",alignItems:"center",gap:"12px",padding:"12px 16px",marginBottom:"8px",background:"rgba(232,180,217,0.1)",borderRadius:"12px",border:"1px solid rgba(232,180,217,0.2)"}}>
              <NavAvatar user={user} displayName={displayName} size={40} />
              <div>
                <div style={{fontWeight:700,fontSize:"14px",color:"var(--ink)"}}>{displayName}</div>
                <div style={{fontSize:"11px",color:"#8B7788"}}>Master</div>
              </div>
            </div>
            <Link to="/masters"       className={`menu-item ${isActive("/masters")?"active":""}`}       onClick={toggleSidebar}><i className="fas fa-home"></i><span>{t.navbar_home}</span></Link>
            <Link to="/create_client" className={`menu-item ${isActive("/create_client")?"active":""}`} onClick={toggleSidebar}><i className="fas fa-user-plus"></i>{t.navbar_add_client}</Link>
            <Link to="/dashboard"     className={`menu-item ${isActive("/dashboard")?"active":""}`}     onClick={toggleSidebar}><i className="fas fa-chart-line"></i>{t.navbar_income}</Link>
            <Link to="/profile"       className={`menu-item ${isActive("/profile")?"active":""}`}       onClick={toggleSidebar}><i className="fas fa-cog"></i>{t.navbar_profile_settings}</Link>
            {user?.is_master_admin && (
              <Link to="/admin" className={`menu-item ${isActive("/admin")?"active":""}`} onClick={toggleSidebar}><i className="fas fa-shield-alt"></i>Admin Panel</Link>
            )}
            <a href="/login" className="menu-item" onClick={(e)=>{e.preventDefault();toggleSidebar();logout();}}><i className="fas fa-sign-out-alt"></i>{t.navbar_logout}</a>
          </div>
        )}
      </div>
      <div className="overlay" id="overlay" onClick={toggleSidebar}></div>
      <div onClick={()=>setOpenProfile(false)} className={`modal_back ${open_profile?"active":""}`}></div>
    </div>
  );
}
