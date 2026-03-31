import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "../css/Masters.module.css";
import Navbar from "./Navbar";
import { useTranslation } from "../hooks/useTranslation";
import { fetchClients, updateClient, deleteClient, createClient } from "../api";

const getToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const TODAY = getToday();
const fmt   = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function Masters() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialView = params.get("view") || "main";
  const [currentView,   setCurrentView]   = useState(initialView);
  const [isModalActive, setIsModalActive] = useState(false);
  const [clients,       setClients]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [editClient,    setEditClient]    = useState(null);
  const [notification,  setNotification]  = useState(null);
  const [saving,        setSaving]        = useState(false);
  const { t, lang } = useTranslation();

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    setLoading(true);
    fetchClients()
      .then(setClients)
      .catch((e) => notify(e.message, "error"))
      .finally(() => setLoading(false));
  }, [lang]);


  // All clients (non-booking = price > 0 OR date <= today)
  const allClients  = clients.filter((c) => !(c.price === 0 && c.my_price === 0));
  // Booked = price=0 my_price=0 AND date >= today (future bookings)
  // Booked = price=0 my_price=0. If no date set (null), still show. If date set, must be >= today.
  const bookedClients = clients.filter((c) => c.price === 0 && c.my_price === 0 && (!c.date || c.date >= TODAY));

  const openEditModal = (client, forceConfirm = false) => {
    const isBooking = client.price === 0 && client.my_price === 0;
    setEditClient({
      id:           client.id,
      username:     client.username,
      service:      client.service,
      price:        client.price,
      my_price:     client.my_price,
      my_price_type: "som",
      my_price_pct:  0,
      my_price_som:  client.my_price,
      date:         client.date,
      time:         client.time,
      comment:      client.comment || "",
      _wasBooking:  isBooking || forceConfirm,
    });
    setIsModalActive(true);
  };

  const handleSave = async () => {
    if (!editClient) return;

    // If confirming a booking (was price=0 my_price=0), require price and date
    const isConfirmingBooking = editClient._wasBooking;
    if (isConfirmingBooking) {
      if (!editClient.price || Number(editClient.price) <= 0)
        return notify("Narx kiritilmadi (0 bo'lmasin)", "error");
      if (!editClient.date)
        return notify("Sana kiritilmadi", "error");
      if (!editClient.time)
        return notify("Vaqt kiritilmadi", "error");
    }

    setSaving(true);
    try {
      const updated = await updateClient(editClient.id, {
        username: editClient.username,
        service:  editClient.service,
        price:    Number(editClient.price),
        my_price: Number(editClient.my_price),
        date:     editClient.date,
        time:     editClient.time,
        comment:  editClient.comment || "",
      });
      setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      setIsModalActive(false);
      notify(t.masters_save + " ✓");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("O'chirmoqchimisiz?")) return;
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      notify("O'chirildi ✓");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  // Confirm booking → update price (user fills in edit modal)
  const handleConfirm = (client) => openEditModal(client);

  const ClientCard = ({ client, isBooking }) => (
    <div className={styles.clientCard}>
      <div className={styles.clientHeader}>
        <div>
          <div className={styles.clientName}><i className="fas fa-user-circle"></i>{client.username}</div>
          <div className={styles.clientInfo}><i className="fas fa-calendar-alt"></i>{client.date || (isBooking ? (t.masters_no_date || "Sana belgilanmagan") : "?")}{client.time ? " " + client.time : ""}</div>
          <div className={styles.clientInfo}><i className="fas fa-scissors"></i>{client.service}</div>
          {client.comment ? (
            <div className={styles.clientInfo} style={{marginTop:"4px",color:"#7c6b7a",fontStyle:"italic"}}>
              <i className="fas fa-comment-dots" style={{marginRight:"5px",color:"#E8B4D9"}}></i>{client.comment}
            </div>
          ) : null}
        </div>
        <div className={styles.clientPrice}>
          {isBooking ? t.masters_no_price : `${fmt(client.price)} so'm`}
        </div>
      </div>
      <div className={styles.clientActions}>
        {isBooking && (
          <button onClick={() => handleConfirm(client)} className={`${styles.btn} ${styles.btnConfirm}`}>
            <i className="fas fa-check-circle"></i>{t.masters_confirm}
          </button>
        )}
        <button onClick={() => openEditModal(client)} className={`${styles.btn} ${styles.btnEdit}`}>
          <i className="fas fa-edit"></i>{t.masters_edit}
        </button>
        <button onClick={() => handleDelete(client.id)} className={`${styles.btn} ${styles.btnDelete}`}>
          <i className="fas fa-trash-alt"></i>{t.masters_delete}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {notification && (
        <div style={{
          position:"fixed",top:"20px",right:"20px",zIndex:9999,
          background: notification.type==="error" ? "#ff6b6b" : "#4caf50",
          color:"#fff",padding:"12px 20px",borderRadius:"10px",fontSize:"14px",fontWeight:600,
          boxShadow:"0 4px 20px rgba(0,0,0,0.2)"
        }}>
          {notification.msg}
        </div>
      )}

      <Navbar version="masters" />
      <div className={styles.mainContent}>

        {/* Main View */}
        <div id="main-view" className={`${styles.mainView} ${currentView==="main"?styles.active:""}`}
          style={{ display: currentView==="main" ? "block" : "none" }}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{t.masters_title}</h1>
            <p className={styles.pageSubtitle}>{t.masters_subtitle}</p>
          </div>
          <div className={styles.mainCards}>
            <div onClick={() => setCurrentView("clients")} className={styles.mainCard}>
              <div className={styles.mainCardIcon}><i className="fas fa-users"></i></div>
              <div className={styles.mainCardTitle}>{t.masters_clients}</div>
              <div className={styles.mainCardCount}>{loading ? "..." : allClients.length}</div>
              <div className={styles.mainCardDesc}>{t.masters_clients_desc}</div>
            </div>
            <div onClick={() => setCurrentView("bookings")} className={styles.mainCard}>
              <div className={styles.mainCardIcon}><i className="fas fa-calendar-check"></i></div>
              <div className={styles.mainCardTitle}>{t.masters_bookings}</div>
              <div className={styles.mainCardCount}>{loading ? "..." : bookedClients.length}</div>
              <div className={styles.mainCardDesc}>{t.masters_bookings_desc}</div>
            </div>
          </div>
        </div>

        {/* Clients View */}
        <div id="clients-view" className={`${styles.detailView} ${currentView==="clients"?styles.active:""}`}>
          <button onClick={() => setCurrentView("main")} className={styles.backBtn}>
            <i className="fas fa-arrow-left"></i>{t.masters_back}
          </button>
          <h2 className={styles.sectionTitle}><i className="fas fa-users"></i>{t.masters_clients}</h2>
          <div className={styles.clientsGrid}>
            {loading ? (
              <div style={{textAlign:"center",padding:"40px"}}><i className="fas fa-spinner fa-spin" style={{fontSize:"2rem",color:"#c9a0dc"}}></i></div>
            ) : allClients.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📭</div>
                <p className={styles.emptyStateText}>{t.masters_no_clients}</p>
              </div>
            ) : allClients.map((c) => <ClientCard key={c.id} client={c} isBooking={false} />)}
          </div>
        </div>

        {/* Bookings View */}
        <div id="bookings-view" className={`${styles.detailView} ${currentView==="bookings"?styles.active:""}`}>
          <button onClick={() => setCurrentView("main")} className={styles.backBtn}>
            <i className="fas fa-arrow-left"></i>{t.masters_back}
          </button>
          <h2 className={styles.sectionTitle}><i className="fas fa-calendar-check"></i>{t.masters_booked_clients}</h2>
          <div className={styles.clientsGrid}>
            {loading ? (
              <div style={{textAlign:"center",padding:"40px"}}><i className="fas fa-spinner fa-spin" style={{fontSize:"2rem",color:"#c9a0dc"}}></i></div>
            ) : bookedClients.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📅</div>
                <p className={styles.emptyStateText}>{t.masters_no_bookings}</p>
              </div>
            ) : bookedClients.map((c) => <ClientCard key={c.id} client={c} isBooking={true} />)}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editClient && (
        <div className={`${styles.modal} ${isModalActive?styles.active:""}`}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              <i className={editClient._wasBooking ? "fas fa-check-circle" : "fas fa-edit"}></i>
              {editClient._wasBooking ? t.masters_confirm : t.masters_edit}
            </h3>
            {editClient._wasBooking && (
              <div style={{background:"rgba(201,160,220,0.12)",border:"1px solid rgba(201,160,220,0.35)",borderRadius:"10px",padding:"10px 14px",marginBottom:"12px",fontSize:"13px",color:"#c9a0dc",lineHeight:"1.5"}}>
                <i className="fas fa-info-circle" style={{marginRight:"6px"}}></i>
                Bronni tasdiqlash uchun <strong>narx, sana va vaqtni</strong> to'liq to'ldiring.
              </div>
            )}
            <div className={styles.formGroup}>
              <label><i className="fas fa-user"></i>{t.masters_modal_name}</label>
              <input type="text" value={editClient.username}
                onChange={(e) => setEditClient({...editClient, username: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-scissors"></i>{t.masters_modal_service}</label>
              <input type="text" value={editClient.service}
                onChange={(e) => setEditClient({...editClient, service: e.target.value})} />
            </div>
            {/* ── NARX SEKTSIYASI ── */}
            <div style={{background:"linear-gradient(135deg,rgba(232,180,217,0.06),rgba(212,201,240,0.04))",border:"1px solid rgba(232,180,217,0.2)",borderRadius:"14px",padding:"16px",marginBottom:"12px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"#8B7788",letterSpacing:"0.5px",marginBottom:"14px",textTransform:"uppercase"}}>
                <i className="fas fa-calculator" style={{marginRight:"6px",color:"#E8B4D9"}}></i>
                {t.masters_price_section||"Narx va hisob"}
              </div>

              {/* Jami narx */}
              <div className={styles.formGroup}>
                <label>
                  <i className="fas fa-money-bill-wave"></i>{t.masters_modal_total_price||"Jami narx"}
                  {editClient._wasBooking && <span style={{color:"#ff6b6b",marginLeft:"4px"}}>*</span>}
                </label>
                <input type="number" value={editClient.price}
                  placeholder={editClient._wasBooking ? "Shart!" : "0"}
                  style={editClient._wasBooking && !Number(editClient.price) ? {borderColor:"rgba(255,107,107,0.5)"} : {}}
                  onChange={(e) => {
                    const p = Number(e.target.value)||0;
                    const mp = editClient.my_price_type==="percent"
                      ? Math.round(p*(editClient.my_price_pct||0)/100)
                      : (editClient.my_price||0);
                    setEditClient({...editClient, price:e.target.value,
                      my_price: editClient.my_price_type==="percent" ? mp : editClient.my_price
                    });
                  }} />
              </div>

              {/* Arendaga to'lov turi */}
              <div className={styles.formGroup}>
                <label><i className="fas fa-store"></i>{t.masters_rent_type||"Arenda turi"}</label>
                <div style={{display:"flex",gap:"10px",marginBottom:"10px"}}>
                  {[{v:"som",lbl:"So'm (aniq)"},{v:"percent",lbl:"Foiz (%)"}].map(opt=>(
                    <button key={opt.v} type="button"
                      onClick={()=>setEditClient(prev=>{
                        const newType=opt.v;
                        const newMp = newType==="percent"
                          ? Math.round((Number(prev.price)||0)*(prev.my_price_pct||0)/100)
                          : (prev.my_price_som||0);
                        return {...prev, my_price_type:newType, my_price:newMp};
                      })}
                      style={{
                        flex:1,padding:"8px",borderRadius:"8px",border:"none",cursor:"pointer",
                        fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:"13px",
                        background:editClient.my_price_type===opt.v?"linear-gradient(135deg,#E8B4D9,#D4C9F0)":"rgba(232,180,217,0.1)",
                        color:editClient.my_price_type===opt.v?"#fff":"#5C4557",
                        transition:"all 0.2s",
                      }}>{opt.lbl}</button>
                  ))}
                </div>

                {editClient.my_price_type==="percent" ? (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <input type="number" min="0" max="100"
                        value={editClient.my_price_pct||""}
                        placeholder="Masalan: 30"
                        onChange={(e)=>{
                          const pct=Number(e.target.value)||0;
                          const mp=Math.round((Number(editClient.price)||0)*pct/100);
                          setEditClient({...editClient, my_price_pct:pct, my_price:mp});
                        }}
                        style={{flex:1}} />
                      <span style={{fontSize:"18px",fontWeight:700,color:"#E8B4D9"}}>%</span>
                    </div>
                  </div>
                ) : (
                  <input type="number"
                    value={editClient.my_price_som||editClient.my_price||""}
                    placeholder="0"
                    onChange={(e)=>{
                      const v=Number(e.target.value)||0;
                      setEditClient({...editClient, my_price:v, my_price_som:v});
                    }} />
                )}
              </div>

              {/* Avtomatik hisob */}
              {Number(editClient.price) > 0 && (
                <div style={{
                  marginTop:"4px",padding:"12px 16px",borderRadius:"12px",
                  background:"#fff",border:"1px solid rgba(232,180,217,0.3)",
                }}>
                  <div style={{fontSize:"12px",fontWeight:700,color:"#8B7788",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.4px"}}>
                    <i className="fas fa-chart-pie" style={{marginRight:"6px",color:"#E8B4D9"}}></i>
                    Avtomatik hisob
                  </div>
                  {(() => {
                    const total = Number(editClient.price)||0;
                    const myP   = Number(editClient.my_price)||0;
                    const rent  = total - myP;
                    const myPct = total>0 ? Math.round(myP/total*100) : 0;
                    const rentPct = 100-myPct;
                    return (
                      <div style={{display:"flex",gap:"12px"}}>
                        <div style={{flex:1,padding:"10px",borderRadius:"10px",background:"rgba(76,175,80,0.08)",border:"1px solid rgba(76,175,80,0.2)",textAlign:"center"}}>
                          <div style={{fontSize:"11px",color:"#8B7788",marginBottom:"3px"}}>Menga qoladi</div>
                          <div style={{fontSize:"16px",fontWeight:700,color:"#4caf50"}}>{fmt(myP)} so'm</div>
                          <div style={{fontSize:"12px",color:"#81c784"}}>{myPct}%</div>
                        </div>
                        <div style={{flex:1,padding:"10px",borderRadius:"10px",background:"rgba(232,180,217,0.1)",border:"1px solid rgba(232,180,217,0.3)",textAlign:"center"}}>
                          <div style={{fontSize:"11px",color:"#8B7788",marginBottom:"3px"}}>Arenda</div>
                          <div style={{fontSize:"16px",fontWeight:700,color:"#E8B4D9"}}>{fmt(Math.max(0,rent))} so'm</div>
                          <div style={{fontSize:"12px",color:"#D4C9F0"}}>{rentPct}%</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>
                <i className="fas fa-calendar-alt"></i>{t.masters_modal_date}
                {editClient._wasBooking && <span style={{color:"#ff6b6b",marginLeft:"4px"}}>*</span>}
              </label>
              <input type="date" value={editClient.date}
                style={editClient._wasBooking && !editClient.date ? {borderColor:"rgba(255,107,107,0.5)"} : {}}
                onChange={(e) => setEditClient({...editClient, date: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>
                <i className="fas fa-clock"></i>{t.masters_modal_time}
                {editClient._wasBooking && <span style={{color:"#ff6b6b",marginLeft:"4px"}}>*</span>}
              </label>
              <input type="time" value={editClient.time}
                style={editClient._wasBooking && !editClient.time ? {borderColor:"rgba(255,107,107,0.5)"} : {}}
                onChange={(e) => setEditClient({...editClient, time: e.target.value})} />
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleSave} className={styles.btnSave} disabled={saving}>
                <i className={saving?"fas fa-spinner fa-spin":"fas fa-check"}></i> {t.masters_save}
              </button>
              <button onClick={() => setIsModalActive(false)} className={styles.btnClose}>
                <i className="fas fa-times"></i> {t.masters_cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
