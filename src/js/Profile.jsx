import React, { useState, useEffect, useRef } from 'react';
import styles from "../css/Profile.module.css";
import Navbar from './Navbar';
import { useTranslation } from '../hooks/useTranslation';
import { fetchMe, updateMe, getTelegramLinkToken, unlinkTelegram, getUser, saveUser } from '../api';

const BASE_URL = "https://salonpro.pythonanywhere.com/api";

// Services are now custom-input by master
const DAYS_UZ = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const DAY_LABELS = {
  "Du":{uz:"Dushanba",  ru:"Понедельник"},
  "Se":{uz:"Seshanba",  ru:"Вторник"},
  "Ch":{uz:"Chorshanba",ru:"Среда"},
  "Pa":{uz:"Payshanba", ru:"Четверг"},
  "Ju":{uz:"Juma",      ru:"Пятница"},
  "Sh":{uz:"Shanba",    ru:"Суббота"},
  "Ya":{uz:"Yakshanba", ru:"Воскресенье"},
};
const DURATION_OPTIONS = [
  {uz:"30 daqiqa", ru:"30 минут", value:30},
  {uz:"1 soat", ru:"1 час", value:60},
  {uz:"1 soat 30 daqiqa", ru:"1 ч 30 мин", value:90},
  {uz:"2 soat", ru:"2 часа", value:120},
  {uz:"2 soat 30 daqiqa", ru:"2 ч 30 мин", value:150},
  {uz:"3 soat", ru:"3 часа", value:180},
  {uz:"3 soat 30 daqiqa", ru:"3 ч 30 мин", value:210},
  {uz:"4 soat", ru:"4 часа", value:240},
  {uz:"4 soat 30 daqiqa", ru:"4 ч 30 мин", value:270},
  {uz:"5 soat", ru:"5 часов", value:300},
  {uz:"5 soat 30 daqiqa", ru:"5 ч 30 мин", value:330},
];

/* ─── CustomSelect (light theme) ─────────────────────────────────── */
function CustomSelect({ value, onChange, options, placeholder, error }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button ref={btnRef} type="button" onClick={() => setOpen(v => !v)} style={{
        width:"100%", padding:"13px 16px", borderRadius:"12px",
        border:`2px solid ${error?"#ffb3b3":open?"#E8B4D9":"rgba(232,180,217,0.35)"}`,
        background:"#FFF8F5", color:selected?"#2D1B2E":"#8B7788",
        fontSize:"15px", fontWeight:500, cursor:"pointer", textAlign:"left",
        fontFamily:"DM Sans,sans-serif",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        transition:"all 0.2s", outline:"none",
        boxShadow: open?"0 0 0 4px rgba(232,180,217,0.15)":"none",
      }}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`fas fa-chevron-${open?"up":"down"}`}
           style={{fontSize:"11px",color:"#E8B4D9",flexShrink:0,marginLeft:"8px"}}></i>
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:9999,
          background:"#fff", borderRadius:"14px",
          border:"1px solid rgba(232,180,217,0.4)",
          boxShadow:"0 8px 32px rgba(232,180,217,0.25)",
          maxHeight:"220px", overflowY:"auto",
        }}>
          {options.map(opt=>(
            <div key={opt.value} onMouseDown={()=>{onChange(opt.value);setOpen(false);}} style={{
              padding:"11px 16px", cursor:"pointer", fontSize:"15px", fontWeight:500,
              fontFamily:"DM Sans,sans-serif",
              color:String(opt.value)===String(value)?"#E8B4D9":"#2D1B2E",
              background:String(opt.value)===String(value)?"rgba(232,180,217,0.12)":"transparent",
              borderLeft:String(opt.value)===String(value)?"3px solid #E8B4D9":"3px solid transparent",
              transition:"background 0.1s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(232,180,217,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background=String(opt.value)===String(value)?"rgba(232,180,217,0.12)":"transparent"}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── LangTabs ─────────────────────────────────────────────────────── */
function LangTabs({ activeLang, onChange }) {
  return (
    <div style={{display:"inline-flex",borderRadius:"10px",border:"1px solid rgba(232,180,217,0.4)",overflow:"hidden",marginBottom:"14px"}}>
      {["uz","ru"].map(l=>(
        <button key={l} type="button" onClick={()=>onChange(l)} style={{
          padding:"6px 20px",border:"none",cursor:"pointer",fontWeight:600,fontSize:"13px",transition:"all 0.2s",
          background:activeLang===l?"linear-gradient(135deg,#E8B4D9,#D4C9F0)":"transparent",
          color:activeLang===l?"#fff":"#8B7788",fontFamily:"DM Sans,sans-serif",
        }}>{l==="uz"?"🇺🇿 UZ":"🇷🇺 RU"}</button>
      ))}
    </div>
  );
}

function BilingualInput({ label, icon, uzValue, ruValue, uzPlaceholder, ruPlaceholder, onChange }) {
  const [activeLang, setActiveLang] = useState("uz");
  return (
    <div style={{marginBottom:0}}>
      <label style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",fontWeight:600,color:"#2D1B2E",fontSize:"15px"}}>
        {icon && <i className={icon} style={{color:"#E8B4D9",fontSize:"16px"}}></i>}{label}
      </label>
      <LangTabs activeLang={activeLang} onChange={setActiveLang} />
      <input type="text"
        placeholder={activeLang==="uz"?uzPlaceholder:ruPlaceholder}
        value={activeLang==="uz"?uzValue:ruValue}
        onChange={e=>onChange(activeLang==="uz"?"uz":"ru",e.target.value)}
        style={{width:"100%",boxSizing:"border-box",padding:"14px 18px",border:"2px solid rgba(232,180,217,0.2)",borderRadius:"12px",fontSize:"16px",fontWeight:500,background:"#FFF8F5",color:"#2D1B2E",fontFamily:"DM Sans,sans-serif",outline:"none",transition:"border-color 0.2s"}}
        onFocus={e=>e.target.style.borderColor="#E8B4D9"}
        onBlur={e=>e.target.style.borderColor="rgba(232,180,217,0.2)"}
      />
    </div>
  );
}

function BilingualTextarea({ label, icon, uzValue, ruValue, uzPlaceholder, ruPlaceholder, onChange }) {
  const [activeLang, setActiveLang] = useState("uz");
  return (
    <div>
      <label style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",fontWeight:600,color:"#2D1B2E",fontSize:"15px"}}>
        {icon && <i className={icon} style={{color:"#E8B4D9",fontSize:"16px"}}></i>}{label}
      </label>
      <LangTabs activeLang={activeLang} onChange={setActiveLang} />
      <textarea rows="4"
        placeholder={activeLang==="uz"?uzPlaceholder:ruPlaceholder}
        value={activeLang==="uz"?uzValue:ruValue}
        onChange={e=>onChange(activeLang==="uz"?"uz":"ru",e.target.value)}
        style={{width:"100%",boxSizing:"border-box",resize:"vertical",padding:"14px 18px",border:"2px solid rgba(232,180,217,0.2)",borderRadius:"12px",fontSize:"16px",fontWeight:500,background:"#FFF8F5",color:"#2D1B2E",fontFamily:"DM Sans,sans-serif",outline:"none",transition:"border-color 0.2s",minHeight:"100px"}}
        onFocus={e=>e.target.style.borderColor="#E8B4D9"}
        onBlur={e=>e.target.style.borderColor="rgba(232,180,217,0.2)"}
      />
    </div>
  );
}

/* ─── ToggleSwitch (light theme) ───────────────────────────────────── */
function ToggleSwitch({ checked, onChange, label, subLabel }) {
  return (
    <div onClick={onChange} style={{
      display:"flex",alignItems:"center",gap:"16px",cursor:"pointer",
      padding:"20px 24px",borderRadius:"16px",
      background:checked?"linear-gradient(135deg,rgba(232,180,217,0.15),rgba(212,201,240,0.1))":"#FFF8F5",
      border:`2px solid ${checked?"#E8B4D9":"rgba(232,180,217,0.3)"}`,
      transition:"all 0.3s",userSelect:"none",
      boxShadow:checked?"0 4px 20px rgba(232,180,217,0.2)":"none",
    }}>
      <div style={{
        width:"52px",height:"28px",borderRadius:"14px",position:"relative",flexShrink:0,
        background:checked?"linear-gradient(135deg,#E8B4D9,#D4C9F0)":"rgba(139,119,136,0.15)",
        transition:"background 0.3s",boxShadow:checked?"0 0 12px rgba(232,180,217,0.5)":"none",
      }}>
        <div style={{
          width:"22px",height:"22px",borderRadius:"50%",background:"#fff",
          position:"absolute",top:"3px",left:checked?"27px":"3px",
          transition:"left 0.3s",boxShadow:"0 2px 6px rgba(0,0,0,0.15)",
        }}/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:"15px",fontWeight:600,color:checked?"#2D1B2E":"#8B7788",transition:"color 0.3s"}}>{label}</div>
        {subLabel&&<div style={{fontSize:"12px",color:checked?"#5C4557":"#8B7788",marginTop:"2px",transition:"color 0.3s"}}>{subLabel}</div>}
      </div>
      <span style={{
        padding:"4px 14px",borderRadius:"20px",fontSize:"12px",fontWeight:700,
        background:checked?"rgba(76,175,80,0.12)":"rgba(255,107,107,0.1)",
        color:checked?"#4caf50":"#ff6b6b",
        border:`1px solid ${checked?"rgba(76,175,80,0.3)":"rgba(255,107,107,0.2)"}`,
      }}>{checked?"✓ Faol":"✗ Nofaol"}</span>
    </div>
  );
}

/* ─── CustomTimePicker ─────────────────────────────────────────────── */
function CustomTimePicker({ value, onChange, label }) {
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "30"];

  const [hh, mm] = (value || "09:00").split(":");
  const [open, setOpen] = React.useState(false);
  const [tempH, setTempH] = React.useState(hh || "09");
  const [tempM, setTempM] = React.useState(mm || "00");
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (value) {
      const [h2, m2] = value.split(":");
      setTempH(h2 || "09");
      setTempM(m2 || "00");
    }
  }, [value]);

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const apply = (h, m) => {
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  const displayVal = value ? `${hh}:${mm}` : "-- : --";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 16px", borderRadius: "12px",
          border: `1px solid ${open ? "#E8B4D9" : "rgba(232,180,217,0.3)"}`,
          background: "#fff", cursor: "pointer",
          boxShadow: open ? "0 0 0 3px rgba(232,180,217,0.15)" : "none",
          transition: "all 0.2s", userSelect: "none",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <i className="fas fa-clock" style={{ color: "#E8B4D9", fontSize: "15px" }}></i>
        <span style={{ fontWeight: 600, fontSize: "17px", color: "#2D1B2E", letterSpacing: "1px" }}>
          {displayVal}
        </span>
        <i className={`fas fa-chevron-${open ? "up" : "down"}`}
           style={{ marginLeft: "auto", fontSize: "11px", color: "#E8B4D9" }}></i>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999,
          background: "#fff", borderRadius: "16px",
          border: "1px solid rgba(232,180,217,0.35)",
          boxShadow: "0 8px 32px rgba(232,180,217,0.25)",
          padding: "16px", minWidth: "260px",
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Hours */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#8B7788", marginBottom: "8px", textAlign: "center", letterSpacing: "1px" }}>
                SOAT
              </div>
              <div style={{ maxHeight: "180px", overflowY: "auto", borderRadius: "10px", border: "1px solid rgba(232,180,217,0.2)" }}>
                {hours.map(h => (
                  <div key={h}
                    onClick={() => setTempH(h)}
                    style={{
                      padding: "7px 12px", cursor: "pointer", fontSize: "15px", fontWeight: 500,
                      textAlign: "center", fontFamily: "'DM Sans', sans-serif",
                      background: tempH === h ? "linear-gradient(135deg,#E8B4D9,#D4A8CC)" : "transparent",
                      color: tempH === h ? "#fff" : "#2D1B2E",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (tempH !== h) e.currentTarget.style.background = "rgba(232,180,217,0.1)"; }}
                    onMouseLeave={e => { if (tempH !== h) e.currentTarget.style.background = "transparent"; }}
                  >{h}</div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", paddingTop: "32px", fontSize: "22px", fontWeight: 700, color: "#E8B4D9" }}>:</div>

            {/* Minutes */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#8B7788", marginBottom: "8px", textAlign: "center", letterSpacing: "1px" }}>
                DAQIQA
              </div>
              <div style={{ borderRadius: "10px", border: "1px solid rgba(232,180,217,0.2)" }}>
                {minutes.map(m => (
                  <div key={m}
                    onClick={() => setTempM(m)}
                    style={{
                      padding: "10px 12px", cursor: "pointer", fontSize: "15px", fontWeight: 500,
                      textAlign: "center", fontFamily: "'DM Sans', sans-serif",
                      background: tempM === m ? "linear-gradient(135deg,#E8B4D9,#D4A8CC)" : "transparent",
                      color: tempM === m ? "#fff" : "#2D1B2E",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (tempM !== m) e.currentTarget.style.background = "rgba(232,180,217,0.1)"; }}
                    onMouseLeave={e => { if (tempM !== m) e.currentTarget.style.background = "transparent"; }}
                  >{m}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview + Apply */}
          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "#2D1B2E", letterSpacing: "2px" }}>
              {tempH}:{tempM}
            </span>
            <button
              type="button"
              onClick={() => apply(tempH, tempM)}
              style={{
                background: "linear-gradient(135deg,#E8B4D9,#D4A8CC)",
                color: "#fff", border: "none", borderRadius: "10px",
                padding: "8px 20px", fontSize: "14px", fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ✓ OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section Card wrapper ─────────────────────────────────────────── */
function SectionCard({ icon, title, children }) {
  return (
    <div style={{
      marginBottom:"32px",
      background:"#fff",
      border:"1px solid rgba(232,180,217,0.25)",
      borderRadius:"18px",
      overflow:"visible",
      boxShadow:"0 4px 20px rgba(232,180,217,0.1)",
    }}>
      <div style={{
        padding:"18px 28px",
        background:"linear-gradient(135deg,rgba(232,180,217,0.08),rgba(212,201,240,0.05))",
        borderBottom:"1px solid rgba(232,180,217,0.2)",
        display:"flex",alignItems:"center",gap:"12px",
      }}>
        <div style={{
          width:"38px",height:"38px",borderRadius:"10px",
          background:"linear-gradient(135deg,#E8B4D9,#D4C9F0)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 12px rgba(232,180,217,0.3)",
        }}>
          <i className={icon} style={{color:"#fff",fontSize:"16px"}}></i>
        </div>
        <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"20px",fontWeight:600,color:"#2D1B2E",margin:0}}>{title}</h3>
      </div>
      <div style={{padding:"28px"}}>{children}</div>
    </div>
  );
}

/* ─── AvatarUpload ──────────────────────────────────────────────────── */
function AvatarUpload({ avatarUrl, onAvatarChange, lang, notify }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(avatarUrl || null);

  // avatarUrl prop o'zgarganda preview ni yangilash
  useEffect(() => {
    setPreview(avatarUrl || null);
  }, [avatarUrl]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      notify(lang === "ru" ? "Faqat JPEG, PNG, WebP yoki GIF" : "Faqat JPEG, PNG, WebP yoki GIF", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify(lang === "ru" ? "Rasm 5 MB dan kichik bo'lishi kerak" : "Rasm 5 MB dan kichik bo'lishi kerak", "error");
      return;
    }

    // Ko'rish uchun preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const token = localStorage.getItem("access") || localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${BASE_URL}/api/me/avatar/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        // Content-Type header berilmaydi — browser o'zi boundary qo'yadi
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Yuklashda xato");
      }

      const data = await res.json();
      setPreview(data.avatar);
      onAvatarChange(data.avatar);
      // Navbar hali yangilanmaydi — "Saqlash" bosilganda yangilanadi
      notify(lang === "ru" ? "Rasm yuklandi ✓" : "Rasm yuklandi ✓");
    } catch (e) {
      setPreview(avatarUrl || null);
      notify(e.message, "error");
    } finally {
      setUploading(false);
      // input ni reset qilish (qayta bir xil faylni yuklash uchun)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!preview) return;
    if (!window.confirm(lang === "ru" ? "Rasmni o'chirishni xohlaysizmi?" : "Rasmni o'chirishni xohlaysizmi?")) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("access") || localStorage.getItem("token") || "";
      const res = await fetch(`${BASE_URL}/api/me/avatar/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("O'chirishda xato");

      setPreview(null);
      onAvatarChange(null);
      // Navbar hali yangilanmaydi — "Saqlash" bosilganda yangilanadi
      notify(lang === "ru" ? "Rasm o'chirildi" : "Rasm o'chirildi");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.profileImageSection}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Avatar circle */}
      <div className={styles.imageWrapper} style={{ position: "relative", display: "inline-block" }}>
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            style={{
              width: "120px", height: "120px", borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(232,180,217,0.5)",
              boxShadow: "0 4px 20px rgba(232,180,217,0.3)",
              display: "block",
            }}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <i className="fas fa-user"></i>
          </div>
        )}

        {/* Loading overlay */}
        {(uploading || deleting) && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "rgba(255,255,255,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="fas fa-spinner fa-spin" style={{ color: "#E8B4D9", fontSize: "22px" }}></i>
          </div>
        )}

        {/* Camera button — rasm yuklash */}
        <button
          className={styles.imageUploadBtn}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          title={lang === "ru" ? "Загрузить фото" : "Rasm yuklash"}
        >
          <i className="fas fa-camera"></i>
        </button>

        {/* Delete button — faqat rasm bo'lganda */}
        {preview && !uploading && !deleting && (
          <button
            type="button"
            onClick={handleDelete}
            title={lang === "ru" ? "Удалить фото" : "Rasmni o'chirish"}
            style={{
              position: "absolute", top: "-4px", right: "-4px",
              width: "26px", height: "26px", borderRadius: "50%",
              background: "#ff6b6b", border: "2px solid #fff",
              color: "#fff", cursor: "pointer", fontSize: "11px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,107,107,0.4)",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#ee5a24"}
            onMouseLeave={e => e.currentTarget.style.background = "#ff6b6b"}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Hint text */}
      <div className={styles.imageHint} style={{ marginTop: "10px", textAlign: "center" }}>
        {uploading
          ? (lang === "ru" ? "Yuklanmoqda..." : "Yuklanmoqda...")
          : (lang === "ru" ? "Фото загрузить (JPG, PNG, max 5MB)" : "Rasm yuklash (JPG, PNG, max 5MB)")
        }
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────── */
export default function Profile() {
  const { t, lang } = useTranslation();
  const [form, setForm] = useState({
    first_name:"",last_name:"",age:"",phone:"",
    specialty_uz:"",specialty_ru:"",experience_years:"",
    bio_uz:"",bio_ru:"",
    services:[],services_ru:[],service_durations:{},
    work_start:"09:00",work_end:"18:00",working_days:[],
    is_active:false,
    preferred_lang:"uz",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [notification, setNotification] = useState(null);
  const [durationErrors, setDurationErrors] = useState({});
  // Telegram state
  const [tgChatId,    setTgChatId]    = useState("");
  const [tgLinking,   setTgLinking]   = useState(false);
  const [tgUnlinking, setTgUnlinking] = useState(false);

  const notify = (msg, type="success") => {
    setNotification({msg, type});
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    fetchMe().then(user => {
      const p = user.profile || {};
      setForm({
        first_name:p.first_name||"",last_name:p.last_name||"",
        age:p.age||"",phone:p.phone||"",
        specialty_uz:p.specialty_uz||"",specialty_ru:p.specialty_ru||"",
        experience_years:p.experience_years||"",
        bio_uz:p.bio_uz||"",bio_ru:p.bio_ru||"",
        services:p.services||[],services_ru:p.services_ru||[],
        service_durations:p.service_durations||{},
        work_start:p.work_start||"09:00",work_end:p.work_end||"18:00",
        working_days:p.working_days||[],
        is_active:p.is_active||false,
        preferred_lang:p.preferred_lang||"uz",
      });
      setAvatarUrl(p.avatar || null);
      setTgChatId(p.telegram_chat_id || "");
    }).catch(e => notify(e.message, "error")).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(prev => ({...prev, [k]:v}));

  const setServiceDuration = (svcUz, dur) => {
    setForm(prev => ({...prev, service_durations:{...prev.service_durations, [svcUz]:parseInt(dur)}}));
    setDurationErrors(prev => {const n={...prev}; delete n[svcUz]; return n;});
  };

  const toggleDay = (dayUz) => {
    setForm(prev => ({...prev, working_days:prev.working_days.includes(dayUz)?prev.working_days.filter(d=>d!==dayUz):[...prev.working_days,dayUz]}));
  };

  const handleSave = async () => {
    const errs = {};
    form.services.forEach(s => { if (!form.service_durations[s]) errs[s] = true; });
    if (Object.keys(errs).length > 0) {
      setDurationErrors(errs);
      notify(lang==="ru"?"Укажите длительность для всех услуг!":"Barcha xizmatlar uchun davomiylik belgilang!", "error");
      return;
    }
    setSaving(true);
    try {
      await updateMe({
        first_name:form.first_name, last_name:form.last_name,
        age:form.age||null, phone:form.phone,
        specialty_uz:form.specialty_uz, specialty_ru:form.specialty_ru,
        experience_years:form.experience_years||null,
        bio_uz:form.bio_uz, bio_ru:form.bio_ru,
        services:form.services, services_ru:form.services_ru,
        service_durations:form.service_durations,
        work_start:form.work_start||null, work_end:form.work_end||null,
        working_days:form.working_days, is_active:form.is_active,
        preferred_lang:form.preferred_lang||"uz",
      });
      // Saqlash muvaffaqiyatli — Navbar avatarini yangilash
      const currentUser = getUser();
      if (currentUser) {
        if (!currentUser.profile) currentUser.profile = {};
        currentUser.profile.avatar = avatarUrl;
        saveUser(currentUser);
      }
      window.dispatchEvent(new Event("user-updated"));
      notify(t.profile_save+" ✓");
    } catch(e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const fmtDur = (m) => {
    if (!m) return "";
    const h = Math.floor(m/60), mn = m%60;
    return (h>0?h+"h ":"")+(mn>0?mn+"min":"");
  };

  // ── Telegram handlers ─────────────────────────────────────────────────────
  const handleTelegramLink = async () => {
    setTgLinking(true);
    const newWindow = window.open("", "_blank");
    try {
      const data = await getTelegramLinkToken();
      if (newWindow) {
        newWindow.location.href = data.deep_link;
      } else {
        window.location.href = data.deep_link;
      }
      notify(
        lang === "ru"
          ? "✅ Telegram ochildi! Endi u yerda START tugmasini bosing."
          : "✅ Telegram ochildi! Endi u yerda START tugmasini bosing.",
        "success"
      );
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const user = await fetchMe();
          const newChatId = user?.profile?.telegram_chat_id || "";
          if (newChatId) {
            setTgChatId(newChatId);
            clearInterval(poll);
            notify(lang === "ru" ? "Telegram muvaffaqiyatli ulandi! ✅" : "Telegram muvaffaqiyatli ulandi! ✅");
          }
        } catch {}
        if (attempts >= 12) clearInterval(poll);
      }, 5000);
    } catch (e) {
      if (newWindow) newWindow.close();
      notify(e.message, "error");
    } finally {
      setTgLinking(false);
    }
  };

  const handleTelegramUnlink = async () => {
    if (!window.confirm(lang === "ru" ? "Telegram'ni uzmoqchimisiz?" : "Telegramni uzmoqchimisiz?")) return;
    setTgUnlinking(true);
    try {
      await unlinkTelegram();
      setTgChatId("");
      notify(lang === "ru" ? "Telegram uzildi" : "Telegram uzildi");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setTgUnlinking(false);
    }
  };

  const durOpts = [
    {value:"", label:lang==="ru"?"⏱ Выберите длительность...":"⏱ Davomiylik tanlang..."},
    ...DURATION_OPTIONS.map(o => ({value:o.value, label:lang==="ru"?o.ru:o.uz}))
  ];

  const inputStyle = {
    width:"100%", padding:"14px 18px", border:"2px solid rgba(232,180,217,0.2)",
    borderRadius:"12px", fontSize:"16px", fontWeight:500, background:"#FFF8F5",
    color:"#2D1B2E", fontFamily:"DM Sans,sans-serif", outline:"none",
    transition:"border-color 0.2s, box-shadow 0.2s", boxSizing:"border-box",
  };

  return (
    <div>
      {/* Toast */}
      {notification && (
        <div style={{
          position:"fixed", top:"20px", right:"20px", zIndex:9999,
          background:notification.type==="error"?"linear-gradient(135deg,#ff6b6b,#ee5a24)":"linear-gradient(135deg,#E8B4D9,#D4C9F0)",
          color:"#fff", padding:"14px 22px", borderRadius:"12px", fontSize:"14px", fontWeight:600,
          boxShadow:"0 4px 20px rgba(232,180,217,0.4)", display:"flex", alignItems:"center", gap:"10px",
        }}>
          <i className={notification.type==="error"?"fas fa-exclamation-circle":"fas fa-check-circle"}></i>
          {notification.msg}
        </div>
      )}

      <Navbar version="masters" />
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t.profile_title}</h1>
          <p className={styles.pageSubtitle}>{t.profile_subtitle}</p>
        </div>
        <div className={styles.profileContainer}>
          <div className={styles.profileCard}>

            {/* ── AVATAR (rasm yuklash) ── */}
            <AvatarUpload
              avatarUrl={avatarUrl}
              onAvatarChange={setAvatarUrl}
              lang={lang}
              notify={notify}
            />

            {loading ? (
              <div style={{textAlign:"center", padding:"60px", flex:1}}>
                <i className="fas fa-spinner fa-spin" style={{fontSize:"2rem", color:"#E8B4D9"}}></i>
              </div>
            ) : (
              <div className={styles.profileForm}>

                {/* ── PROFIL HOLATI ── */}
                <SectionCard icon="fas fa-toggle-on" title={lang==="ru"?"Видимость профиля":"Profil holati"}>
                  <ToggleSwitch
                    checked={form.is_active}
                    onChange={() => set("is_active", !form.is_active)}
                    label={lang==="ru"?"Показывать мой профиль клиентам":"Profilimni mijozlarga ko'rsatish"}
                    subLabel={form.is_active
                      ? (lang==="ru"?"Клиенты могут найти вас и записаться":"Mijozlar sizni topib bron qila oladi")
                      : (lang==="ru"?"Ваш профиль скрыт от клиентов":"Profilingiz mijozlardan yashirilgan")
                    }
                  />
                  {form.is_active && form.services.length === 0 && (
                    <div style={{marginTop:"12px",padding:"12px 16px",borderRadius:"10px",background:"rgba(255,165,0,0.08)",border:"1px solid rgba(255,165,0,0.25)",fontSize:"13px",color:"#b8860b",display:"flex",gap:"8px",alignItems:"center"}}>
                      <i className="fas fa-exclamation-triangle"></i>
                      {lang==="ru"?"Добавьте хотя бы одну услугу с длительностью":"Kamida bitta xizmat va davomiylik belgilang"}
                    </div>
                  )}
                </SectionCard>

                {/* ── SHAXSIY ── */}
                <SectionCard icon="fas fa-user" title={t.profile_personal}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label><i className="fas fa-user"></i>{t.profile_name}</label>
                      <input type="text" placeholder={t.profile_name_placeholder} value={form.first_name} onChange={e=>set("first_name",e.target.value)} style={inputStyle}
                        onFocus={e=>{e.target.style.borderColor="#E8B4D9";e.target.style.boxShadow="0 0 0 4px rgba(232,180,217,0.15)"}}
                        onBlur={e=>{e.target.style.borderColor="rgba(232,180,217,0.2)";e.target.style.boxShadow="none"}} />
                    </div>
                    <div className={styles.formGroup}>
                      <label><i className="fas fa-user"></i>{t.profile_surname}</label>
                      <input type="text" placeholder={t.profile_surname_placeholder} value={form.last_name} onChange={e=>set("last_name",e.target.value)} style={inputStyle}
                        onFocus={e=>{e.target.style.borderColor="#E8B4D9";e.target.style.boxShadow="0 0 0 4px rgba(232,180,217,0.15)"}}
                        onBlur={e=>{e.target.style.borderColor="rgba(232,180,217,0.2)";e.target.style.boxShadow="none"}} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label><i className="fas fa-birthday-cake"></i>{t.profile_age}</label>
                      <input type="number" placeholder={t.profile_age_placeholder} value={form.age} onChange={e=>set("age",e.target.value)} style={inputStyle}
                        onFocus={e=>{e.target.style.borderColor="#E8B4D9";e.target.style.boxShadow="0 0 0 4px rgba(232,180,217,0.15)"}}
                        onBlur={e=>{e.target.style.borderColor="rgba(232,180,217,0.2)";e.target.style.boxShadow="none"}} />
                    </div>
                    <div className={styles.formGroup}>
                      <label><i className="fas fa-phone"></i>{t.profile_phone}</label>
                      <input type="tel" placeholder={t.profile_phone_placeholder} value={form.phone} onChange={e=>set("phone",e.target.value)} style={inputStyle}
                        onFocus={e=>{e.target.style.borderColor="#E8B4D9";e.target.style.boxShadow="0 0 0 4px rgba(232,180,217,0.15)"}}
                        onBlur={e=>{e.target.style.borderColor="rgba(232,180,217,0.2)";e.target.style.boxShadow="none"}} />
                    </div>
                  </div>
                </SectionCard>

                {/* ── PROFESSIONAL ── */}
                <SectionCard icon="fas fa-briefcase" title={t.profile_professional}>
                  <div className={styles.formRow}>
                    <div style={{flexDirection:"column",alignItems:"stretch"}}>
                      <BilingualInput label={t.profile_specialty} icon="fas fa-cut"
                        uzValue={form.specialty_uz} ruValue={form.specialty_ru}
                        uzPlaceholder={t.profile_specialty_placeholder||"Masalan: Sartarosh"}
                        ruPlaceholder="Например: Парикмахер"
                        onChange={(l,v) => set(l==="uz"?"specialty_uz":"specialty_ru", v)} />
                    </div>
                    <div className={styles.formGroup1}>
                      <label><i className="fas fa-calendar-check"></i>{t.profile_experience}</label>
                      <input type="number" placeholder={t.profile_experience_placeholder} value={form.experience_years} onChange={e=>set("experience_years",e.target.value)} style={inputStyle}
                        onFocus={e=>{e.target.style.borderColor="#E8B4D9";e.target.style.boxShadow="0 0 0 4px rgba(232,180,217,0.15)"}}
                        onBlur={e=>{e.target.style.borderColor="rgba(232,180,217,0.2)";e.target.style.boxShadow="none"}} />
                    </div>
                  </div>
                  <BilingualTextarea label={t.profile_bio} icon="fas fa-align-left"
                    uzValue={form.bio_uz} ruValue={form.bio_ru}
                    uzPlaceholder={t.profile_bio_placeholder||"O'zingiz haqingizda qisqacha..."}
                    ruPlaceholder="Напишите немного о себе..."
                    onChange={(l,v) => set(l==="uz"?"bio_uz":"bio_ru", v)} />
                </SectionCard>

                {/* ── XIZMATLAR (custom input) ── */}
                <SectionCard icon="fas fa-scissors" title={t.profile_services}>
                  <div style={{padding:"12px 16px",borderRadius:"10px",marginBottom:"20px",background:"rgba(232,180,217,0.07)",border:"1px solid rgba(232,180,217,0.25)",fontSize:"13px",color:"#5C4557",lineHeight:"1.6",display:"flex",gap:"8px",alignItems:"flex-start"}}>
                    <i className="fas fa-info-circle" style={{color:"#E8B4D9",marginTop:"2px",flexShrink:0}}></i>
                    <span>{lang==="ru"?"Добавьте свои услуги и укажите длительность каждой. Можно добавить любые услуги.":"O'z xizmatlaringizni qo'shing va har biri uchun davomiylik belgilang."}</span>
                  </div>

                  {/* Existing services list */}
                  <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"}}>
                    {form.services.map((svcUz, idx) => {
                      const svcRu  = form.services_ru[idx] ?? "";
                      const dur    = form.service_durations[svcUz];
                      const hasErr = durationErrors[svcUz];
                      return (
                        <div key={idx} style={{
                          padding:"16px",borderRadius:"14px",
                          border:hasErr?"2px solid rgba(255,107,107,0.4)":"2px solid rgba(232,180,217,0.25)",
                          background:hasErr?"rgba(255,107,107,0.03)":"#fff",
                          boxShadow:"0 2px 10px rgba(232,180,217,0.08)",
                        }}>
                          <div style={{display:"flex",gap:"10px",marginBottom:"12px"}}>
                            {/* UZ name */}
                            <div style={{flex:1}}>
                              <div style={{fontSize:"11px",fontWeight:600,color:"#8B7788",marginBottom:"5px"}}>🇺🇿 UZ</div>
                              <input type="text" value={svcUz} placeholder="Soch olish"
                                onChange={e => {
                                  const newSvcs = [...form.services]; newSvcs[idx] = e.target.value;
                                  const nd = {...form.service_durations};
                                  if (nd[svcUz]) {nd[e.target.value]=nd[svcUz]; delete nd[svcUz];}
                                  set("services", newSvcs); set("service_durations", nd);
                                }}
                                style={{width:"100%",padding:"9px 12px",border:"2px solid rgba(232,180,217,0.2)",borderRadius:"10px",fontSize:"14px",fontWeight:500,background:"#FFF8F5",color:"#2D1B2E",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}
                                onFocus={e=>e.target.style.borderColor="#E8B4D9"}
                                onBlur={e=>e.target.style.borderColor="rgba(232,180,217,0.2)"} />
                            </div>
                            {/* RU name */}
                            <div style={{flex:1}}>
                              <div style={{fontSize:"11px",fontWeight:600,color:"#8B7788",marginBottom:"5px"}}>🇷🇺 RU</div>
                              <input type="text" value={svcRu} placeholder="Стрижка волос"
                                onChange={e => {
                                  const newSvcs = [...form.services_ru]; newSvcs[idx] = e.target.value;
                                  set("services_ru", newSvcs);
                                }}
                                style={{width:"100%",padding:"9px 12px",border:"2px solid rgba(232,180,217,0.2)",borderRadius:"10px",fontSize:"14px",fontWeight:500,background:"#FFF8F5",color:"#2D1B2E",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}
                                onFocus={e=>e.target.style.borderColor="#E8B4D9"}
                                onBlur={e=>e.target.style.borderColor="rgba(232,180,217,0.2)"} />
                            </div>
                            {/* Delete */}
                            <button type="button" onClick={() => {
                              const ns = [...form.services]; ns.splice(idx, 1);
                              const nr = [...form.services_ru]; nr.splice(idx, 1);
                              const nd = {...form.service_durations}; delete nd[svcUz];
                              setForm(prev => ({...prev, services:ns, services_ru:nr, service_durations:nd}));
                            }} style={{
                              alignSelf:"flex-end",marginBottom:"2px",width:"36px",height:"36px",borderRadius:"10px",border:"none",
                              background:"rgba(255,107,107,0.1)",color:"#ff6b6b",cursor:"pointer",fontSize:"14px",
                              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,107,0.2)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,107,107,0.1)"}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                          {/* Duration */}
                          <div>
                            <div style={{fontSize:"11px",fontWeight:600,color:"#8B7788",marginBottom:"5px"}}>
                              <i className="fas fa-clock" style={{marginRight:"4px",color:"#E8B4D9"}}></i>
                              {lang==="ru"?"Длительность":"Davomiylik"}
                              <span style={{color:"#ff6b6b",marginLeft:"2px"}}>*</span>
                            </div>
                            <CustomSelect value={dur||""} onChange={v=>setServiceDuration(svcUz,v)} options={durOpts} placeholder={lang==="ru"?"Выберите длительность...":"Davomiylik tanlang..."} error={hasErr} />
                            {hasErr && <div style={{fontSize:"12px",color:"#ff6b6b",marginTop:"4px",fontWeight:500}}><i className="fas fa-exclamation-circle" style={{marginRight:"4px"}}></i>{lang==="ru"?"Обязательно":"Shart"}</div>}
                            {dur && !hasErr && <div style={{fontSize:"12px",color:"#E8B4D9",marginTop:"4px",fontWeight:500}}><i className="fas fa-check-circle" style={{marginRight:"4px"}}></i>{fmtDur(dur)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new service button */}
                  <button type="button" onClick={() => {
                    setForm(prev => ({...prev, services:[...prev.services,""], services_ru:[...prev.services_ru,""]}));
                  }} style={{
                    width:"100%",padding:"13px",borderRadius:"12px",border:"2px dashed rgba(232,180,217,0.4)",
                    background:"rgba(232,180,217,0.04)",color:"#E8B4D9",cursor:"pointer",
                    fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:"14px",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"all 0.2s"
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(232,180,217,0.1)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(232,180,217,0.04)"}>
                    <i className="fas fa-plus-circle"></i>
                    {lang==="ru"?"+ Добавить услугу":"+ Xizmat qo'shish"}
                  </button>
                </SectionCard>

                {/* ── ISH VAQTI ── */}
                <SectionCard icon="fas fa-clock" title={t.profile_hours}>
                  <div className={styles.formRow} style={{marginBottom:"24px"}}>
                    <div className={styles.formGroup}>
                      <label><i className="fas fa-hourglass-start"></i>{t.profile_start}</label>
                      <CustomTimePicker value={form.work_start} onChange={v => set("work_start", v)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label><i className="fas fa-hourglass-end"></i>{t.profile_end}</label>
                      <CustomTimePicker value={form.work_end} onChange={v => set("work_end", v)} />
                    </div>
                  </div>
                  <div>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",fontWeight:600,color:"#2D1B2E",fontSize:"15px"}}>
                      <i className="fas fa-calendar-week" style={{color:"#E8B4D9",fontSize:"16px"}}></i>{t.profile_days}
                    </label>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px"}}>
                      {DAYS_UZ.map(dayUz => {
                        const labels = DAY_LABELS[dayUz];
                        const isChecked = form.working_days.includes(dayUz);
                        return (
                          <div key={dayUz} onClick={() => toggleDay(dayUz)} style={{
                            padding:"12px 14px",borderRadius:"12px",cursor:"pointer",userSelect:"none",
                            border:isChecked?"2px solid #E8B4D9":"2px solid rgba(232,180,217,0.2)",
                            background:isChecked?"linear-gradient(135deg,rgba(232,180,217,0.15),rgba(212,201,240,0.1))":"#FFF8F5",
                            transition:"all 0.2s",display:"flex",flexDirection:"column",gap:"3px",
                            boxShadow:isChecked?"0 4px 12px rgba(232,180,217,0.2)":"none",
                          }}>
                            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                              <div style={{
                                width:"16px",height:"16px",borderRadius:"4px",flexShrink:0,
                                border:isChecked?"2px solid #E8B4D9":"2px solid rgba(232,180,217,0.35)",
                                background:isChecked?"linear-gradient(135deg,#E8B4D9,#D4C9F0)":"transparent",
                                display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",
                              }}>
                                {isChecked && <i className="fas fa-check" style={{fontSize:"8px",color:"#fff"}}></i>}
                              </div>
                              <span style={{fontSize:"13px",fontWeight:isChecked?700:500,color:isChecked?"#2D1B2E":"#5C4557"}}>{labels.uz}</span>
                            </div>
                            <span style={{fontSize:"11px",color:"#8B7788",paddingLeft:"24px"}}>{labels.ru}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                {/* ── TELEGRAM ── */}
                <SectionCard icon="fab fa-telegram" title={lang==="ru"?"Telegram уведомления":"Telegram habarlar"}>
                  <div style={{padding:"4px 0"}}>
                    <p style={{fontSize:"14px",color:"#5C4557",marginBottom:"16px",lineHeight:"1.6"}}>
                      {lang==="ru"
                        ? "Подключите Telegram-бот, чтобы получать уведомления о новых бронированиях прямо в мессенджер."
                        : "Telegram botni ulang — yangi bronlar haqida habarlar to'g'ridan-to'g'ri Telegramga keladi."}
                    </p>

                    {tgChatId ? (
                      /* CONNECTED */
                      <div style={{
                        background:"linear-gradient(135deg,rgba(78,204,163,0.1),rgba(78,204,163,0.05))",
                        border:"1px solid rgba(78,204,163,0.3)",
                        borderRadius:"14px",padding:"16px 20px",
                        display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",
                        flexWrap:"wrap",
                      }}>
                        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                          <div style={{
                            width:"40px",height:"40px",borderRadius:"50%",
                            background:"linear-gradient(135deg,#4ECCA3,#26A69A)",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:"18px",color:"#fff",flexShrink:0,
                          }}>
                            <i className="fab fa-telegram"></i>
                          </div>
                          <div>
                            <div style={{fontWeight:700,color:"#2D1B2E",fontSize:"14px"}}>
                              {lang==="ru"?"Telegram подключён ✅":"Telegram ulangan ✅"}
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                          <button
                            onClick={handleTelegramLink}
                            disabled={tgLinking}
                            style={{
                              padding:"8px 14px",borderRadius:"10px",border:"1px solid rgba(232,180,217,0.4)",
                              background:"rgba(232,180,217,0.1)",color:"#5C4557",fontSize:"13px",
                              fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",
                            }}
                          >
                            <i className="fas fa-sync-alt"></i>
                            {lang==="ru"?"Сменить аккаунт":"Akkauntni o'zgartirish"}
                          </button>
                          <button
                            onClick={handleTelegramUnlink}
                            disabled={tgUnlinking}
                            style={{
                              padding:"8px 14px",borderRadius:"10px",border:"1px solid rgba(255,107,107,0.3)",
                              background:"rgba(255,107,107,0.08)",color:"#e17055",fontSize:"13px",
                              fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",
                            }}
                          >
                            {tgUnlinking ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-unlink"></i>}
                            {lang==="ru"?"Отключить":"Uzish"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* NOT CONNECTED */
                      <div style={{
                        background:"rgba(232,180,217,0.06)",
                        border:"1px dashed rgba(232,180,217,0.4)",
                        borderRadius:"14px",padding:"20px",textAlign:"center",
                      }}>
                        <div style={{fontSize:"40px",marginBottom:"12px",opacity:0.5}}>
                          <i className="fab fa-telegram" style={{color:"#229ED9"}}></i>
                        </div>
                        <div style={{fontSize:"14px",color:"#8B7788",marginBottom:"16px"}}>
                          {lang==="ru"?"Telegram не подключён":"Telegram ulanmagan"}
                        </div>
                        <button
                          onClick={handleTelegramLink}
                          disabled={tgLinking}
                          style={{
                            padding:"12px 28px",borderRadius:"12px",border:"none",
                            background:"linear-gradient(135deg,#229ED9,#0088cc)",
                            color:"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer",
                            display:"inline-flex",alignItems:"center",gap:"10px",
                            boxShadow:"0 4px 14px rgba(34,158,217,0.35)",transition:"all 0.2s",
                          }}
                        >
                          {tgLinking
                            ? <><i className="fas fa-spinner fa-spin"></i>{lang==="ru"?"Подождите...":"Kuting..."}</>
                            : <><i className="fab fa-telegram"></i>{lang==="ru"?"Подключить Telegram":"Telegramga ulash"}</>
                          }
                        </button>
                        <div style={{marginTop:"12px",fontSize:"12px",color:"#8B7788",lineHeight:"1.7"}}>
                          {lang==="ru"
                            ? "1. Tugmani bosing → Telegram ochiladi\n2. Telegram da yashil START tugmasini bosing\n3. Tayyor!"
                            : "1. Tugmani bosing → Telegram ochiladi\n2. Telegram da yashil START tugmasini bosing\n3. Tayyor!"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notification Language Preference */}
                  <div style={{marginTop:"20px",paddingTop:"18px",borderTop:"1px solid rgba(232,180,217,0.2)"}}>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",fontWeight:600,color:"#2D1B2E",fontSize:"14px"}}>
                      <i className="fas fa-language" style={{color:"#E8B4D9"}}></i>
                      {lang==="ru"?"Язык уведомлений в Telegram":"Telegram bildirisnoma tili"}
                    </label>
                    <div style={{display:"flex",gap:"10px"}}>
                      {[{val:"uz",label:"O'zbekcha 🇺🇿"},{val:"ru",label:"Русский 🇷🇺"}].map(opt=>(
                        <div key={opt.val}
                          onClick={() => set("preferred_lang", opt.val)}
                          style={{
                            flex:1,padding:"12px",borderRadius:"12px",textAlign:"center",
                            cursor:"pointer",fontWeight:600,fontSize:"14px",
                            fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s",
                            border: form.preferred_lang===opt.val
                              ? "2px solid #E8B4D9"
                              : "1px solid rgba(232,180,217,0.3)",
                            background: form.preferred_lang===opt.val
                              ? "linear-gradient(135deg,rgba(232,180,217,0.2),rgba(212,168,204,0.15))"
                              : "#fff",
                            color: form.preferred_lang===opt.val ? "#2D1B2E" : "#8B7788",
                            boxShadow: form.preferred_lang===opt.val ? "0 2px 10px rgba(232,180,217,0.2)" : "none",
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                    <p style={{fontSize:"12px",color:"#8B7788",marginTop:"8px",lineHeight:"1.5"}}>
                      {lang==="ru"
                        ? "Все уведомления о бронированиях будут приходить на выбранном языке."
                        : "Barcha bronlar haqida habarlar shu tilda keladi."}
                    </p>
                  </div>
                </SectionCard>

                {/* ── SAQLASH ── */}
                <div className={styles.formActions}>
                  <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
                    {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                    {t.profile_save}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
