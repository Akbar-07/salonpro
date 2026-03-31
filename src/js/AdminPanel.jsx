import { useState, useMemo, useEffect, React } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/AdminPanel.module.css";
import { fetchUsers, fetchAdminStats, fetchUserClients, createUser, deleteUser, makeAdmin, removeAdmin, makeMaster, removeUser, getUser } from "../api";
import { useTranslation } from "../hooks/useTranslation";

const fmt      = (n) => (n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const initials = (name) => (name||"?").split(" ").map((w)=>w[0]).join("").toUpperCase().slice(0,2);
const getToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const TODAY    = getToday();

const NAV_ITEMS = [
  { key:"overview",   icon:"chart-pie",   label:"Umumiy ko'rinish" },
  { key:"masters",    icon:"user-shield", label:"Masterlar" },
  { key:"site_users", icon:"users",       label:"Sayt foydalanuvchilari" },
  { key:"revenue",    icon:"chart-line",  label:"Daromad" },
];

function RoleBadge({ user }) {
  if (user.is_super_admin) return <span className={`${styles.badge} ${styles.badgeSuper}`}><i className="fas fa-crown" /> Super Admin</span>;
  if (user.is_admin)       return <span className={`${styles.badge} ${styles.badgeAdmin}`}><i className="fas fa-user-shield" /> Admin</span>;
  return <span className={`${styles.badge} ${styles.badgeUser}`}><i className="fas fa-user" /> Master</span>;
}

function MasterCard({ user, isSuperAdmin, isMe, onView, onDelete, onMakeAdmin, onRemoveAdmin, onMakeUser }) {
  return (
    <div className={styles.userCard}>
      <div className={styles.ucHeader}>
        <div className={styles.ucAvatar}>{initials(user.username)}</div>
        <div className={styles.ucInfo}>
          <div className={styles.ucName}>
            {user.username}
            {isMe && <span style={{fontSize:"11px",background:"rgba(201,160,220,0.25)",color:"#c9a0dc",borderRadius:"6px",padding:"2px 7px",marginLeft:"6px",fontWeight:600}}>Bu siz</span>}
          </div>
          <div className={styles.ucEmail}>{user.email}</div>
        </div>
        <RoleBadge user={user} />
      </div>
      <div className={styles.ucStats}>
        <div className={styles.ucStat}><div className={styles.ucStatVal}>{user.clients_count}</div><div className={styles.ucStatLab}>Mijozlar</div></div>
        <div className={styles.ucStatDiv} />
        <div className={styles.ucStat}><div className={styles.ucStatVal}>{(user.revenue/1_000_000).toFixed(1)}M</div><div className={styles.ucStatLab}>Daromad</div></div>
      </div>
      <button className={`${styles.ucBtn} ${styles.ucBtnView}`} onClick={onView}><i className="fas fa-eye" /> Mijozlarni Ko'rish</button>
      <div className={styles.ucActions}>
        {/* Only show delete if: not me, and (superAdmin OR target is not an admin) */}
        {!isMe && (isSuperAdmin || !user.is_admin) && (
          <button className={`${styles.ucBtn} ${styles.ucBtnDel}`} onClick={onDelete}><i className="fas fa-trash-alt" /></button>
        )}
        {isSuperAdmin && !isMe && (
          <>
            {user.is_admin
              ? <button className={`${styles.ucBtn} ${styles.ucBtnAdminRem}`} onClick={onRemoveAdmin}><i className="fas fa-user-minus" /> Admin Olib Tashlash</button>
              : <button className={`${styles.ucBtn} ${styles.ucBtnAdmin}`}    onClick={onMakeAdmin}><i className="fas fa-user-shield" /> Admin Qilish</button>
            }
            <button className={`${styles.ucBtn}`}
              onClick={onMakeUser}
              style={{fontSize:"12px",padding:"6px 10px",background:"rgba(255,165,0,0.2)",color:"#ffa500",border:"1px solid rgba(255,165,0,0.4)",borderRadius:"8px",cursor:"pointer",whiteSpace:"nowrap"}}>
              <i className="fas fa-user-tag" /> User Qilish
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SiteUserCard({ user, onDelete, isSuperAdmin, onMakeMaster }) {
  return (
    <div className={styles.siteUserCard}>
      <div className={styles.suAvatar}>{initials(user.username)}</div>
      <div className={styles.suInfo}>
        <div className={styles.suName}>{user.username}</div>
        <div className={styles.suEmail}>{user.email}</div>
        <div className={styles.suDate}><i className="fas fa-calendar-alt" /> {(user.created_at||"").split(" ")[0]}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"6px",alignItems:"flex-end"}}>
        {isSuperAdmin && (
          <button className={`${styles.ucBtn} ${styles.ucBtnAdmin}`} onClick={onMakeMaster}
            style={{fontSize:"12px",padding:"6px 10px",whiteSpace:"nowrap"}}>
            <i className="fas fa-user-tie" /> Master Qilish
          </button>
        )}
        <button className={`${styles.ucBtn} ${styles.ucBtnDel} ${styles.suDel}`} onClick={onDelete}><i className="fas fa-trash-alt" /></button>
      </div>
    </div>
  );
}

function SidebarContent({ activeTab, setActiveTab, onClose }) {
  return (
    <>
      <div className={styles.brand}>
        <div className={styles.brandIcon}><i className="fas fa-crown" /></div>
        <div className={styles.brandText}>
          <div className={styles.brandName}>Salon Pro</div>
          <div className={styles.brandSub}>Admin Panel</div>
        </div>
        {onClose && <button className={styles.drawerClose} onClick={onClose}><i className="fas fa-times" /></button>}
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <button key={item.key}
            className={`${styles.navItem} ${activeTab===item.key?styles.navItemActive:""}`}
            onClick={()=>{setActiveTab(item.key);onClose?.();}}>
            <i className={`fas fa-${item.icon}`} /><span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <a href="/login" onClick={(e)=>{e.preventDefault();window.localStorage.removeItem("access");window.localStorage.removeItem("refresh");window.localStorage.removeItem("user");window.location.href="/login";}} className={styles.backBtn}><i className="fas fa-sign-out-alt" /> Chiqish</a>
      </div>
    </>
  );
}

// ─── CustomSelect ──────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(v=>!v)} style={{
        width:"100%",padding:"10px 14px",borderRadius:"10px",
        border:`1px solid ${open?"rgba(201,160,220,0.8)":"rgba(201,160,220,0.3)"}`,
        background:"rgba(255,255,255,0.05)",color:selected?"#e0d4f0":"#8B7788",
        fontSize:"14px",cursor:"pointer",textAlign:"left",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        transition:"all 0.2s",outline:"none",
      }}>
        <span>{selected ? selected.label : ""}</span>
        <i className={`fas fa-chevron-${open?"up":"down"}`} style={{fontSize:"11px",color:"#c9a0dc"}}></i>
      </button>
      {open && (
        <div style={{
          position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:9999,
          background:"rgba(20,10,35,0.98)",borderRadius:"12px",
          border:"1px solid rgba(201,160,220,0.3)",
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)",backdropFilter:"blur(16px)",overflow:"hidden"
        }}>
          {options.map(opt=>(
            <div key={opt.value} onMouseDown={()=>{onChange(opt.value);setOpen(false);}} style={{
              padding:"10px 14px",cursor:"pointer",fontSize:"14px",
              color:opt.value===value?"#c9a0dc":"#e0d4f0",
              background:opt.value===value?"rgba(201,160,220,0.12)":"transparent",
              borderLeft:opt.value===value?"3px solid #c9a0dc":"3px solid transparent",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(201,160,220,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background=opt.value===value?"rgba(201,160,220,0.12)":"transparent"}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default function AdminPanel() {
  const [users,        setUsers]        = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [masterSearch, setMasterSearch] = useState("");
  const [siteSearch,   setSiteSearch]   = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalClients, setModalClients] = useState([]);
  const [modalSearch,  setModalSearch]  = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab,    setActiveTab]    = useState("overview");
  const [notification, setNotification] = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  // Add user form
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [newUser,      setNewUser]      = useState({ username:"", password:"12345678", role:"master", email:"" });
  const [addLoading,   setAddLoading]   = useState(false);
  // Confirmation modal for "Make Admin"
  const [confirmModal, setConfirmModal] = useState(null); // { id, name } | null

  const me          = getUser();
  const isSuperAdmin   = !!(me?.is_super_admin);
  const isMasterAdmin  = !!(me?.is_master_admin);  // master that has admin access
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  const notify = (msg, type="success") => { setNotification({msg,type}); setTimeout(()=>setNotification(null),3500); };

  useEffect(() => {
    setLoadingUsers(true);
    Promise.all([fetchUsers(), fetchAdminStats()])
      .then(([u, s]) => { setUsers(u); setStats(s); })
      .catch((e) => notify(e.message, "error"))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Masters: exclude super_admin users; include current user (me) if they are a master/master_admin
  const masters   = useMemo(() => users.filter((u) => !u.is_super_admin && u.type === "master"), [users]);
  const siteUsers = useMemo(() => users.filter((u) => !u.is_super_admin && u.type === "site_user" && u.id !== me?.id), [users, me]);

  const totalClients = stats?.total_clients || 0;
  const totalRevenue = stats?.total_revenue || 0;
  const totalRent    = stats?.total_rent    || 0;
  const todayClients = stats?.today_clients || 0;
  const todayRevenue = stats?.today_revenue || 0;
  const todayRent    = stats?.today_rent    || 0;
  const todayWork    = stats?.today_work    || 0;

  const filteredMasters   = useMemo(()=>masters.filter((u)=>u.username.toLowerCase().includes(masterSearch.toLowerCase())||u.email.toLowerCase().includes(masterSearch.toLowerCase())),[masters,masterSearch]);
  const filteredSiteUsers = useMemo(()=>siteUsers.filter((u)=>u.username.toLowerCase().includes(siteSearch.toLowerCase())||u.email.toLowerCase().includes(siteSearch.toLowerCase())),[siteUsers,siteSearch]);

  const displayModalClients = useMemo(()=>(modalClients||[]).filter((c)=>
    c.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
    (c.service||"").toLowerCase().includes(modalSearch.toLowerCase())
  ),[modalClients,modalSearch]);

  // ── ACTIONS ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`${name} ${lang === "ru" ? "удалить?" : "ni o'chirmoqchimisiz?"}`)) return;
    try {
      await deleteUser(id);
      setUsers((p) => p.filter((u) => u.id !== id));
      notify(`${name} — ${t.admin_user_deleted || "o'chirildi"}`);
    } catch (e) { notify(e.message, "error"); }
  };

  const handleMakeAdmin = (id, name) => {
    // Open custom confirmation modal — no window.confirm
    setConfirmModal({ id, name });
  };

  const handleMakeAdminConfirmed = async () => {
    if (!confirmModal) return;
    const { id, name } = confirmModal;
    setConfirmModal(null);
    try {
      await makeAdmin(id);
      setUsers((p) => p.map((u) => u.id===id ? {...u, is_admin:true, role:"admin"} : u));
      notify(`${name} — ${t.admin_made_admin || "admin qilindi"}`);
    } catch (e) { notify(e.message, "error"); }
  };

  const handleRemAdmin = async (id, name) => {
    try {
      await removeAdmin(id);
      setUsers((p) => p.map((u) => u.id===id ? {...u, is_admin:false, role:"master"} : u));
      notify(`${name} — ${t.admin_removed_admin || "dan admin olib tashlandi"}`, "warning");
    } catch (e) { notify(e.message, "error"); }
  };

  const handleMakeMaster = async (id, name) => {
    if (!window.confirm(`${name} ${lang === "ru" ? "назначить мастером?" : "ni Master qilmoqchimisiz?"}`)) return;
    try {
      await makeMaster(id);
      setUsers((p) => p.map((u) => u.id===id ? {...u, type:"master", role:"master"} : u));
      notify(`${name} — ${t.admin_made_master || "Master qilindi"}`);
    } catch (e) { notify(e.message, "error"); }
  };

  const handleMakeUser = async (id, name) => {
    if (!window.confirm(`${name} ${lang === "ru" ? "назначить обычным пользователем? Права мастера будут сняты." : "ni oddiy User qilmoqchimisiz? Master huquqlari olib tashlanadi."}`)) return;
    try {
      await removeUser(id);
      setUsers((p) => p.map((u) => u.id===id ? {...u, type:"site_user", role:"user", is_admin:false} : u));
      notify(`${name} — ${t.admin_made_user || "oddiy User qilindi"}`, "warning");
    } catch (e) { notify(e.message, "error"); }
  };

  const openModal = async (user) => {
    setSelectedUser(user); setModalSearch(""); setModalClients([]); setModalLoading(true);
    try {
      const c = await fetchUserClients(user.id);
      setModalClients(c);
    } catch (e) { notify(e.message, "error"); }
    finally { setModalLoading(false); }
  };

  const handleAddUser = async () => {
    if (!newUser.username.trim()) return notify(t.admin_err_username || "Username kiritilmadi", "error");
    setAddLoading(true);
    try {
      await createUser(newUser);
      notify(`${newUser.username} — ${t.admin_user_created || "yaratildi"}`);
      setShowAddForm(false);
      setNewUser({ username:"", password:"12345678", role:"master", email:"" });
      // refresh list
      const u = await fetchUsers();
      setUsers(u);
    } catch (e) { notify(e.message,"error"); }
    finally { setAddLoading(false); }
  };

  const pageTitles = { overview:"Umumiy Ko'rinish", masters:"Masterlar", site_users:"Sayt Foydalanuvchilari", revenue:"Daromad Statistikasi" };

  return (
    <>
      {notification && (
        <div className={`${styles.notif} ${notification.type==="success"?styles.notifSuccess:styles.notifWarning}`}>
          <i className={`fas fa-${notification.type==="success"?"check-circle":"exclamation-circle"}`} />
          {notification.msg}
        </div>
      )}

      <div className={styles.root}>
        {/* Desktop Sidebar */}
        <aside className={styles.sidebar}>
          <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} onClose={null} />
        </aside>

        {/* Mobile Drawer */}
        <div className={`${styles.drawerOverlay} ${drawerOpen?styles.drawerOverlayOpen:""}`} onClick={()=>setDrawerOpen(false)} />
        <aside className={`${styles.drawer} ${drawerOpen?styles.drawerOpen:""}`}>
          <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} onClose={()=>setDrawerOpen(false)} />
        </aside>

        <main className={styles.main}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.menuBtn} onClick={()=>setDrawerOpen(true)}><i className="fas fa-bars" /></button>
              <div>
                <h1 className={styles.pageTitle}>{pageTitles[activeTab]}</h1>
                <p className={styles.pageSub}>
                  Bugun: {new Date().toLocaleDateString("uz-UZ",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
                </p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              {isMasterAdmin && (
                <button onClick={()=>navigate("/masters")} style={{
                  display:"flex",alignItems:"center",gap:"8px",padding:"8px 16px",
                  borderRadius:"10px",border:"1px solid rgba(201,160,220,0.4)",
                  background:"rgba(201,160,220,0.08)",color:"#5C4557",
                  fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:"13px",cursor:"pointer",
                  transition:"all 0.2s",
                }} onMouseEnter={e=>e.currentTarget.style.background="rgba(201,160,220,0.18)"}
                   onMouseLeave={e=>e.currentTarget.style.background="rgba(201,160,220,0.08)"}>
                  <i className="fas fa-arrow-left"></i> Masters
                </button>
              )}
              <div className={styles.adminChip}>
                <i className="fas fa-crown" /> {isSuperAdmin ? "Super Admin" : isMasterAdmin ? "Master Admin" : "Admin"}
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div style={{textAlign:"center",padding:"80px"}}>
              <i className="fas fa-spinner fa-spin" style={{fontSize:"3rem",color:"#c9a0dc"}}></i>
            </div>
          ) : (
            <>
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className={styles.fadeIn}>
                <div className={styles.statsGrid}>
                  {[
                    { icon:"user-shield",     label:"Jami Masterlar",         value:masters.length,       cls:styles.statPurple, suffix:"" },
                    { icon:"users",           label:"Sayt Foydalanuvchilari", value:siteUsers.length,     cls:styles.statCyan,   suffix:"" },
                    { icon:"user-friends",    label:"Jami Mijozlar",           value:totalClients,         cls:styles.statBlue,   suffix:"" },
                    { icon:"money-bill-wave", label:"Umumiy Daromad",          value:fmt(totalRevenue),    cls:styles.statGreen,  suffix:" so'm" },
                  ].map((s)=>(
                    <div key={s.label} className={`${styles.statCard} ${s.cls}`}>
                      <div className={styles.statIcon}><i className={`fas fa-${s.icon}`} /></div>
                      <div><div className={styles.statLabel}>{s.label}</div><div className={styles.statValue}>{s.value}{s.suffix}</div></div>
                    </div>
                  ))}
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHead}><h2 className={styles.sectionTitle}><i className="fas fa-trophy" /> Top Masterlar</h2></div>
                  <div className={styles.topMasters}>
                    {[...masters].sort((a,b)=>b.revenue-a.revenue).slice(0,3).map((u,i)=>(
                      <div key={u.id} className={styles.topMasterCard}>
                        <div className={`${styles.rank} ${styles[`rank${i+1}`]}`}>{i+1}</div>
                        <div className={styles.topAvatar}>{initials(u.username)}</div>
                        <div className={styles.topInfo}>
                          <div className={styles.topName}>{u.username}</div>
                          <div className={styles.topRole}>{u.email}</div>
                        </div>
                        <div className={styles.topStats}>
                          <div className={styles.topStat}><span className={styles.topStatVal}>{u.clients_count}</span><span className={styles.topStatLab}>mijoz</span></div>
                          <div className={styles.topStat}><span className={styles.topStatVal}>{fmt(u.revenue)}</span><span className={styles.topStatLab}>so'm</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHead}><h2 className={styles.sectionTitle}><i className="fas fa-calendar-day" /> Bugungi Ko'rsatkichlar</h2></div>
                  <div className={styles.todayGrid}>
                    {[
                      { label:"Bugungi Mijozlar", value:todayClients,      unit:"ta",   icon:"user-check" },
                      { label:"Bugungi Daromad",  value:fmt(todayRevenue), unit:"so'm", icon:"coins" },
                      { label:"Bugungi Arenda",   value:fmt(todayRent),    unit:"so'm", icon:"building" },
                      { label:"Masterlar Ulushi", value:fmt(todayWork),    unit:"so'm", icon:"hand-holding-usd" },
                    ].map((item)=>(
                      <div key={item.label} className={styles.todayCard}>
                        <i className={`fas fa-${item.icon} ${styles.todayIcon}`} />
                        <div className={styles.todayLabel}>{item.label}</div>
                        <div className={styles.todayValue}>{item.value} <span className={styles.todayUnit}>{item.unit}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MASTERS ── */}
            {activeTab === "masters" && (
              <div className={styles.fadeIn}>
                <div className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}><i className="fas fa-id-card" /> Master Kartochkalari</h2>
                    <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
                      <div className={styles.searchWrap}>
                        <i className={`fas fa-search ${styles.searchIcon}`} />
                        <input className={styles.searchInput} placeholder="Qidirish..." value={masterSearch} onChange={(e)=>setMasterSearch(e.target.value)} />
                      </div>
                      {isSuperAdmin && (
                        <button onClick={()=>setShowAddForm(true)} style={{
                          background:"linear-gradient(135deg,#c9a0dc,#a855f7)",color:"#fff",
                          border:"none",borderRadius:"10px",padding:"10px 16px",cursor:"pointer",
                          fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",gap:"6px"
                        }}>
                          <i className="fas fa-user-plus" /> Foydalanuvchi qo'shish
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add user form */}
                  {showAddForm && (
                    <div style={{
                      background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,160,220,0.3)",
                      borderRadius:"16px",padding:"20px",marginBottom:"20px"
                    }}>
                      <h3 style={{color:"#c9a0dc",marginBottom:"16px",fontSize:"15px"}}>
                        <i className="fas fa-user-plus" /> Yangi foydalanuvchi
                      </h3>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                        <input placeholder="Username *" value={newUser.username}
                          onChange={(e)=>setNewUser({...newUser,username:e.target.value})}
                          style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid rgba(201,160,220,0.4)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:"14px"}} />
                        <input placeholder="Email" value={newUser.email}
                          onChange={(e)=>setNewUser({...newUser,email:e.target.value})}
                          style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid rgba(201,160,220,0.4)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:"14px"}} />
                        <input placeholder="Parol (default: 12345678)" value={newUser.password}
                          onChange={(e)=>setNewUser({...newUser,password:e.target.value})}
                          style={{padding:"10px 14px",borderRadius:"10px",border:"1px solid rgba(201,160,220,0.4)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:"14px"}} />
<CustomSelect
                          value={newUser.role}
                          onChange={(v)=>setNewUser({...newUser,role:v})}
                          options={[
                            {value:"client",label:"Site User"},
                            {value:"master",label:"Master"},
                            {value:"admin",label:"Admin"},
                          ]}
                        />
                      </div>
                      <div style={{display:"flex",gap:"10px",marginTop:"14px"}}>
                        <button onClick={handleAddUser} disabled={addLoading}
                          style={{background:"#4caf50",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 20px",cursor:"pointer",fontSize:"13px",fontWeight:600}}>
                          {addLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />} Saqlash
                        </button>
                        <button onClick={()=>setShowAddForm(false)}
                          style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 20px",cursor:"pointer",fontSize:"13px"}}>
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.userCards}>
                    {filteredMasters.map((user)=>(
                      <MasterCard key={user.id} user={user} isSuperAdmin={isSuperAdmin} isMe={user.id === me?.id}
                        onView={()=>openModal(user)}
                        onDelete={()=>handleDelete(user.id,user.username)}
                        onMakeAdmin={()=>handleMakeAdmin(user.id,user.username)}
                        onRemoveAdmin={()=>handleRemAdmin(user.id,user.username)}
                        onMakeUser={()=>handleMakeUser(user.id,user.username)} />
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHead}><h2 className={styles.sectionTitle}><i className="fas fa-table" /> Jadval Ko'rinishi</h2></div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>#</th><th>Username</th><th>Email</th><th>Rol</th><th>Mijozlar</th><th>Daromad</th><th>Sana</th></tr></thead>
                      <tbody>
                        {filteredMasters.map((u,i)=>(
                          <tr key={u.id}>
                            <td className={styles.tdNum}>{i+1}</td>
                            <td><strong>{u.username}</strong></td>
                            <td className={styles.tdMuted}>{u.email}</td>
                            <td><RoleBadge user={u} /></td>
                            <td><strong>{u.clients_count}</strong></td>
                            <td className={styles.tdGreen}>{fmt(u.revenue)} so'm</td>
                            <td className={styles.tdMuted}>{(u.created_at||"").split(" ")[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── SITE USERS ── */}
            {activeTab === "site_users" && (
              <div className={styles.fadeIn}>
                <div className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}><i className="fas fa-users" /> Sayt Foydalanuvchilari</h2>
                    <div className={styles.searchWrap}>
                      <i className={`fas fa-search ${styles.searchIcon}`} />
                      <input className={styles.searchInput} placeholder="Qidirish..." value={siteSearch} onChange={(e)=>setSiteSearch(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.suStatsRow}>
                    <div className={styles.suStatChip}><i className="fas fa-users" /><span>Jami: <strong>{siteUsers.length}</strong> ta</span></div>
                    <div className={styles.suStatChip}><i className="fas fa-calendar-day" /><span>Bugun: <strong>{siteUsers.filter((u)=>(u.created_at||"").startsWith(TODAY)).length}</strong> ta</span></div>
                  </div>
                  <div className={styles.siteUserCards}>
                    {filteredSiteUsers.map((user)=>(
                      <SiteUserCard key={user.id} user={user}
                        onDelete={()=>handleDelete(user.id,user.username)}
                        isSuperAdmin={isSuperAdmin}
                        onMakeMaster={()=>handleMakeMaster(user.id,user.username)} />
                    ))}
                    {filteredSiteUsers.length===0 && (
                      <p className={styles.noData} style={{gridColumn:"1/-1"}}><i className="fas fa-user-slash" /> Foydalanuvchi topilmadi</p>
                    )}
                  </div>
                </div>
                <div className={styles.section}>
                  <div className={styles.sectionHead}><h2 className={styles.sectionTitle}><i className="fas fa-table" /> Jadval Ko'rinishi</h2></div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>#</th><th>Username</th><th>Email</th><th>Ro'yxatdan o'tgan</th></tr></thead>
                      <tbody>
                        {filteredSiteUsers.map((u,i)=>(
                          <tr key={u.id}>
                            <td className={styles.tdNum}>{i+1}</td>
                            <td><strong>{u.username}</strong></td>
                            <td className={styles.tdMuted}>{u.email}</td>
                            <td className={styles.tdMuted}>{(u.created_at||"").split(" ")[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── REVENUE ── */}
            {activeTab === "revenue" && (
              <div className={styles.fadeIn}>
                <div className={styles.section}>
                  <div className={styles.sectionHead}><h2 className={styles.sectionTitle}><i className="fas fa-infinity" /> Barcha Vaqt Statistikasi</h2></div>
                  <div className={styles.revGrid}>
                    {[
                      { icon:"chart-line",      label:"Jami Ish Haqi",      value:fmt(totalRevenue-totalRent), note:"Masterlarning daromadi", cls:styles.revGreen  },
                      { icon:"home",            label:"Jami Arenda",         value:fmt(totalRent),             note:"Salonning ulushi",       cls:styles.revPurple },
                      { icon:"money-bill-wave", label:"Jami To'liq Daromad", value:fmt(totalRevenue),           note:"Umumiy tushum",          cls:styles.revPink   },
                    ].map((r)=>(
                      <div key={r.label} className={`${styles.revCard} ${r.cls}`}>
                        <div className={styles.revIcon}><i className={`fas fa-${r.icon}`} /></div>
                        <div className={styles.revLabel}>{r.label}</div>
                        <div className={styles.revAmount}>{r.value} so'm</div>
                        <div className={styles.revNote}>{r.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}><i className="fas fa-calendar-day" /> Bugungi Statistika</h2>
                    <span className={styles.sectionBadge}>{TODAY}</span>
                  </div>
                  <div className={styles.revGrid}>
                    {[
                      { icon:"calendar-check", label:"Bugungi Ish Haqi", value:fmt(todayWork),    note:`${todayClients} ta mijoz`, cls:`${styles.revCard} ${styles.revToday} ${styles.revCyan}`   },
                      { icon:"home",           label:"Bugungi Arenda",   value:fmt(todayRent),    note:"Bugungi ulush",           cls:`${styles.revCard} ${styles.revToday} ${styles.revPurple}` },
                      { icon:"coins",          label:"Bugungi Jami",     value:fmt(todayRevenue), note:"Bugungi tushum",          cls:`${styles.revCard} ${styles.revToday} ${styles.revGreen}`  },
                    ].map((r)=>(
                      <div key={r.label} className={r.cls}>
                        <div className={styles.revIcon}><i className={`fas fa-${r.icon}`} /></div>
                        <div className={styles.revLabel}>{r.label}</div>
                        <div className={styles.revAmount}>{r.value} so'm</div>
                        <div className={styles.revNote}>{r.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHead}><h2 className={styles.sectionTitle}><i className="fas fa-users" /> Masterlar bo'yicha Daromad</h2></div>
                  <div className={styles.userRevList}>
                    {[...masters].sort((a,b)=>b.revenue-a.revenue).map((u)=>{
                      const pct = totalRevenue > 0 ? Math.round((u.revenue/totalRevenue)*100) : 0;
                      const rent = u.revenue - (u.revenue * 0.7); // approximate if no detail
                      return (
                        <div key={u.id} className={styles.userRevRow}>
                          <div className={styles.userRevAvatar}>{initials(u.username)}</div>
                          <div className={styles.userRevInfo}>
                            <div className={styles.userRevName}>{u.username}</div>
                            <div className={styles.userRevBarWrap}><div className={styles.userRevBar} style={{width:`${pct}%`}} /></div>
                          </div>
                          <div className={styles.userRevNums}>
                            <div className={styles.userRevTotal}>{fmt(u.revenue)} so'm</div>
                            <div className={styles.userRevRent}>{u.clients_count} ta mijoz</div>
                          </div>
                          <div className={styles.userRevPct}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </main>
      </div>

      {/* ── CLIENT MODAL ── */}
      {selectedUser && (
        <div className={styles.modalOverlay} onClick={()=>setSelectedUser(null)}>
          <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalAvatar}>{initials(selectedUser.username)}</div>
              <div>
                <h3 className={styles.modalTitle}>{selectedUser.username}</h3>
                <p className={styles.modalSub}>{selectedUser.email}</p>
              </div>
              <button className={styles.modalClose} onClick={()=>setSelectedUser(null)}><i className="fas fa-times" /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalStats}>
                <div className={styles.modalStat}><span className={styles.modalStatVal}>{selectedUser.clients_count}</span><label className={styles.modalStatLab}>Mijozlar</label></div>
                <div className={styles.modalStat}><span className={styles.modalStatVal}>{fmt(selectedUser.revenue)}</span><label className={styles.modalStatLab}>so'm daromad</label></div>
              </div>
              <div className={`${styles.searchWrap} ${styles.searchWrapFull}`}>
                <i className={`fas fa-search ${styles.searchIcon}`} />
                <input className={`${styles.searchInput} ${styles.searchFull}`}
                  placeholder="Mijoz qidirish..." value={modalSearch}
                  onChange={(e)=>setModalSearch(e.target.value)} />
              </div>
              {modalLoading ? (
                <div style={{textAlign:"center",padding:"30px"}}><i className="fas fa-spinner fa-spin" style={{fontSize:"1.5rem",color:"#c9a0dc"}}></i></div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>#</th><th>Ism</th><th>Xizmat</th><th>Sana</th><th>Vaqt</th><th>Narx</th><th>Masterdan</th><th>Arenda</th></tr></thead>
                    <tbody>
                      {displayModalClients.length === 0 ? (
                        <tr><td colSpan={8} className={styles.noData}>Mijozlar topilmadi</td></tr>
                      ) : displayModalClients.map((c,i)=>(
                        <tr key={c.id}>
                          <td className={styles.tdNum}>{i+1}</td>
                          <td><strong>{c.name}</strong></td>
                          <td>{c.service}</td>
                          <td className={styles.tdMuted}>{c.date}</td>
                          <td className={styles.tdMuted}>{c.time}</td>
                          <td className={styles.tdGreen}>{fmt(c.price)} so'm</td>
                          <td className={styles.tdGreen}>{fmt(c.my_price)} so'm</td>
                          <td className={styles.tdRed}>{fmt((c.price||0)-(c.my_price||0))} so'm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAKE ADMIN CONFIRMATION MODAL ── */}
      {confirmModal && (
        <div style={{
          position:"fixed", inset:0, zIndex:99999,
          background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"20px",
        }} onClick={() => setConfirmModal(null)}>
          <div style={{
            background:"linear-gradient(135deg,rgba(20,10,35,0.98),rgba(30,15,50,0.98))",
            border:"1px solid rgba(201,160,220,0.4)",
            borderRadius:"20px", padding:"32px 28px", maxWidth:"420px", width:"100%",
            boxShadow:"0 24px 80px rgba(0,0,0,0.6)",
            fontFamily:"'DM Sans',sans-serif",
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width:"60px", height:"60px", borderRadius:"50%",
              background:"linear-gradient(135deg,rgba(201,160,220,0.25),rgba(168,85,247,0.2))",
              border:"2px solid rgba(201,160,220,0.5)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px", fontSize:"24px",
            }}>
              <i className="fas fa-user-shield" style={{color:"#c9a0dc"}}></i>
            </div>
            <h3 style={{
              textAlign:"center", color:"#e0d4f0", fontSize:"18px",
              fontWeight:700, marginBottom:"10px",
            }}>
              Adminlik tasdiqlash
            </h3>
            <p style={{
              textAlign:"center", color:"#a090b0", fontSize:"14px",
              lineHeight:1.6, marginBottom:"28px",
            }}>
              <strong style={{color:"#c9a0dc"}}>{confirmModal.name}</strong> ni admin qilmoqchimisiz?
              <br/>
              <span style={{fontSize:"12px", opacity:0.7}}>
                Bu foydalanuvchi admin huquqlariga ega bo'ladi.
              </span>
            </p>
            <div style={{display:"flex", gap:"12px"}}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  flex:1, padding:"12px", borderRadius:"12px",
                  border:"1px solid rgba(255,255,255,0.12)",
                  background:"rgba(255,255,255,0.07)", color:"#a090b0",
                  fontSize:"14px", fontWeight:600, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s",
                }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
              >
                <i className="fas fa-times" style={{marginRight:"6px"}}></i>
                Bekor qilish
              </button>
              <button
                onClick={handleMakeAdminConfirmed}
                style={{
                  flex:1, padding:"12px", borderRadius:"12px",
                  border:"none",
                  background:"linear-gradient(135deg,#c9a0dc,#a855f7)",
                  color:"#fff", fontSize:"14px", fontWeight:700,
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                  transition:"all 0.2s",
                  boxShadow:"0 4px 16px rgba(168,85,247,0.35)",
                }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
              >
                <i className="fas fa-user-shield" style={{marginRight:"6px"}}></i>
                Ha, admin qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
