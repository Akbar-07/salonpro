import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Navbar from "./Navbar";
import { useTranslation } from "../hooks/useTranslation";
import { fetchMasters, createClient, getUser } from "../api";

const DAY_LABELS = {
  "Du": { uz: "Dushanba",   ru: "Понедельник" },
  "Se": { uz: "Seshanba",   ru: "Вторник"    },
  "Ch": { uz: "Chorshanba", ru: "Среда"    },
  "Pa": { uz: "Payshanba",  ru: "Четверг"  },
  "Ju": { uz: "Juma",       ru: "Пятница"      },
  "Sh": { uz: "Shanba",     ru: "Суббота"      },
  "Ya": { uz: "Yakshanba",  ru: "Воскресенье" },
};
// ─── CustomSelect (light theme — sayt ranglariga mos) ────────────────────────
function CustomSelect({ value, onChange, options, placeholder, style }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width: "100%", padding: "14px 18px", borderRadius: "10px",
        border: `1px solid ${open ? "var(--primary,#E8B4D9)" : "rgba(232,180,217,0.35)"}`,
        background: "var(--cream,#FFF8F5)", color: selected ? "var(--ink,#2D1B2E)" : "var(--ink-light,#8B7788)",
        fontSize: "16px", fontWeight: 500, cursor: "pointer", textAlign: "left",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.25s", outline: "none",
        boxShadow: open ? "0 0 0 3px rgba(232,180,217,0.15)" : "none",
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`fas fa-chevron-${open ? "up" : "down"}`}
           style={{ fontSize: "12px", color: "var(--primary,#E8B4D9)", flexShrink: 0, marginLeft: "8px" }}></i>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#fff", borderRadius: "12px",
          border: "1px solid rgba(232,180,217,0.4)",
          boxShadow: "0 8px 32px rgba(232,180,217,0.2)", overflow: "hidden",
          maxHeight: "240px", overflowY: "auto",
        }}>
          {options.map(opt => (
            <div key={opt.value} onMouseDown={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }} style={{
              padding: "12px 18px", cursor: "pointer", fontSize: "15px", fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              color: String(opt.value) === String(value) ? "var(--primary,#E8B4D9)" : "var(--ink,#2D1B2E)",
              background: String(opt.value) === String(value) ? "rgba(232,180,217,0.1)" : "transparent",
              borderLeft: String(opt.value) === String(value) ? "3px solid var(--primary,#E8B4D9)" : "3px solid transparent",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,180,217,0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = String(opt.value) === String(value) ? "rgba(232,180,217,0.1)" : "transparent"; }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TimeGrid (light theme — band vaqt to'g'ri hisoblash) ────────────────────
function TimeGrid({ slots, allSlots, busySlots, value, onChange, serviceDuration, lang, bookingDate }) {
  const [tooltip, setTooltip] = React.useState(null);
  const timeToMins = (t) => { const [h,m]=(t||"00:00").split(":").map(Number); return h*60+m; };

  // Current time in Tashkent (UTC+5)
  const nowTashkent = React.useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const tashkent = new Date(utc + 5 * 3600000);
    return tashkent.getHours() * 60 + tashkent.getMinutes();
  }, []);

  // Is selected date today (Tashkent)?
  const todayTashkent = React.useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const t = new Date(utc + 5 * 3600000);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  }, []);

  const isToday = bookingDate === todayTashkent;

  const getSlotStatus = (slot) => {
    const slotMins = timeToMins(slot);
    if (isToday && slotMins < nowTashkent) return 'past';

    const hasDur = serviceDuration > 0;
    const lastSlotMins = allSlots.length > 0 ? timeToMins(allSlots[allSlots.length - 1]) : 18 * 60;

    // overflow: xizmat ish vaqtidan tashqariga chiqadi (kulrang)
    if (hasDur && slotMins + serviceDuration > lastSlotMins) return 'overflow';

    // 1) To'g'ridan-to'g'ri BAND: bu slot o'zi bron oraliqda (SARIQ)
    //    xizmat tanlangan/tanlanmaganidan qat'iy nazar
    const directBooked = busySlots.find(b => {
      if (b.confirmed === true) return false;
      const bStart = timeToMins(b.time);
      const bEnd   = b.end_time ? timeToMins(b.end_time) : (bStart + (b.duration || 60));
      return slotMins >= bStart && slotMins < bEnd;
    });
    if (directBooked) return 'busy'; // sariq -- haqiqiy bron

    // 2) CONFLICT: slot o'zi bo'sh lekin xizmat davomiyligi keyingi bronga
    //    to'qnashadi (KULRANG, sariq EMAS)
    if (hasDur) {
      const slotEnd = slotMins + serviceDuration;
      const wouldConflict = busySlots.some(b => {
        if (b.confirmed === true) return false;
        const bStart = timeToMins(b.time);
        return slotMins < bStart && slotEnd > bStart;
      });
      if (wouldConflict) return 'conflict'; // kulrang -- to'qnashuv
    }

    return 'free';
  };

  if (allSlots.length === 0) return (
    <div style={{ padding:"16px", textAlign:"center", color:"var(--ink-light,#8B7788)", fontSize:"13px" }}>
      <i className="fas fa-calendar-times" style={{ marginRight:"6px", color:"var(--primary,#E8B4D9)" }}></i>
      {lang === "ru" ? "Нет доступных слотов" : "Bo'sh vaqt yo'q"}
    </div>
  );

  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginTop:"4px" }}>
      {allSlots.map(slot => {
        const status     = getSlotStatus(slot);
        const isBusy     = status === "busy";      // sariq: haqiqiy bron qilingan
        const isConflict = status === "conflict";  // kulrang: davomiylik to'qnashuvi
        const isPast     = status === "past";
        const isOverflow = status === "overflow";
        const isDisabled = isBusy || isConflict || isPast || isOverflow;
        const isSelected = value === slot && !isDisabled;
        // busyInfo: faqat to'g'ridan-to'g'ri bron (sariq) slotlar uchun tooltip
        const busyInfo = isBusy ? busySlots.find(b => {
          if (b.confirmed === true) return false;
          const slotMins = timeToMins(slot);
          const bStart   = timeToMins(b.time);
          const bEnd     = b.end_time ? timeToMins(b.end_time) : (bStart + (b.duration || 60));
          return slotMins >= bStart && slotMins < bEnd;
        }) : null;

        return (
          <div key={slot}
            onClick={() => {
              if (isBusy) { setTooltip(t=>t===slot?null:slot); }
              else if (isConflict) { setTooltip(t=>t===slot?null:slot); }
              else if (!isPast && !isOverflow) { onChange(slot); setTooltip(null); }
            }}
            style={{
              position:"relative", padding:"9px 16px", borderRadius:"10px",
              fontSize:"14px", fontWeight: isSelected ? 700 : 500,
              fontFamily:"'DM Sans',sans-serif",
              cursor: isDisabled ? "not-allowed" : "pointer", transition:"all 0.2s",
              border: isSelected   ? "2px solid #E8B4D9"
                    : isBusy      ? "1px solid rgba(255,190,60,0.5)"
                    : isConflict  ? "1px solid rgba(200,200,200,0.25)"
                    : isPast || isOverflow ? "1px solid rgba(200,200,200,0.3)"
                                  : "1px solid rgba(232,180,217,0.4)",
              background: isSelected   ? "linear-gradient(135deg,#E8B4D9,#D4C9F0)"
                        : isBusy      ? "rgba(255,190,60,0.08)"
                        : isConflict  ? "rgba(200,200,200,0.06)"
                        : isPast || isOverflow ? "rgba(200,200,200,0.07)"
                                      : "var(--cream,#FFF8F5)",
              color: isSelected   ? "#fff"
                   : isBusy      ? "#b8860b"
                   : isConflict  ? "rgba(150,140,150,0.45)"
                   : isPast || isOverflow ? "rgba(150,140,150,0.5)"
                                 : "var(--ink-mid,#5C4557)",
              opacity: isPast || isOverflow ? 0.45 : isConflict ? 0.5 : isBusy ? 0.85 : 1,
              textDecoration: isBusy || isPast || isOverflow || isConflict ? "line-through" : "none",
              boxShadow: isSelected ? "0 4px 14px rgba(232,180,217,0.35)" : "none",
              userSelect:"none",
            }}
          >
            {slot}
            {isBusy && (
              <span style={{
                position:"absolute", top:"-3px", right:"-3px",
                width:"8px", height:"8px", borderRadius:"50%",
                background:"#ffc107", border:"2px solid #fff"
              }}/>
            )}
            {tooltip === slot && isBusy && (
              <div style={{
                position:"absolute", bottom:"calc(100% + 8px)", left:"50%",
                transform:"translateX(-50%)", zIndex:9999,
                background:"#fff", border:"1px solid rgba(255,118,117,0.3)",
                borderRadius:"12px", padding:"10px 16px", fontSize:"12px",
                whiteSpace:"nowrap", color:"#e17055", fontWeight:600,
                boxShadow:"0 6px 24px rgba(232,180,217,0.3)",
                pointerEvents:"none",
              }}>
                <i className="fas fa-lock" style={{marginRight:"6px"}}></i>
                {lang==="ru"?"Это время забронировано":"Bu vaqt bron qilingan"}
                {busyInfo?.service && (
                  <div style={{color:"var(--ink-light,#8B7788)",marginTop:"3px",fontWeight:400}}>
                    {busyInfo.service}
                    {busyInfo.time && busyInfo.end_time && (
                      <span style={{marginLeft:"6px",opacity:0.8}}>{busyInfo.time}–{busyInfo.end_time}</span>
                    )}
                  </div>
                )}
                <div style={{
                  position:"absolute",bottom:"-6px",left:"50%",
                  width:"10px",height:"10px",background:"#fff",
                  border:"1px solid rgba(255,118,117,0.3)",
                  borderTop:"none",borderLeft:"none",
                  transform:"translateX(-50%) rotate(45deg)"
                }}></div>
              </div>
            )}
            {tooltip === slot && isConflict && (
              <div style={{
                position:"absolute", bottom:"calc(100% + 8px)", left:"50%",
                transform:"translateX(-50%)", zIndex:9999,
                background:"#fff", border:"1px solid rgba(150,140,150,0.3)",
                borderRadius:"12px", padding:"10px 16px", fontSize:"12px",
                whiteSpace:"nowrap", color:"#888", fontWeight:600,
                boxShadow:"0 6px 24px rgba(0,0,0,0.1)",
                pointerEvents:"none",
              }}>
                <i className="fas fa-exclamation-circle" style={{marginRight:"6px"}}></i>
                {lang==="ru"?"Это время пересекается с другой записью":"Bu vaqt bron bilan to'qnashadi"}
                <div style={{
                  position:"absolute",bottom:"-6px",left:"50%",
                  width:"10px",height:"10px",background:"#fff",
                  border:"1px solid rgba(150,140,150,0.3)",
                  borderTop:"none",borderLeft:"none",
                  transform:"translateX(-50%) rotate(45deg)"
                }}></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}





// ─── CustomCalendar ────────────────────────────────────────────────────────────
function CustomCalendar({ value, onChange, workingDays, lang }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = React.useState(() => value ? parseInt(value.split("-")[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(() => value ? parseInt(value.split("-")[1]) - 1 : today.getMonth());

  // Map working day codes to JS getDay() indices (0=Sun, 1=Mon, ...)
  const dayCodeToIndex = { "Ya": 0, "Du": 1, "Se": 2, "Ch": 3, "Pa": 4, "Ju": 5, "Sh": 6 };

  // If workingDays empty or all days — treat as all enabled
  const hasWorkingDays = workingDays && workingDays.length > 0;
  const enabledDayNums = hasWorkingDays
    ? new Set(workingDays.map(d => dayCodeToIndex[d]).filter(d => d !== undefined))
    : new Set([0,1,2,3,4,5,6]);

  const monthNames = {
    uz: ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"],
    ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  };
  const weekDayNames = {
    uz: ["Ya","Du","Se","Ch","Pa","Ju","Sh"],
    ru: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],
  };

  const l = lang === "ru" ? "ru" : "uz";
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toStr = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const [tooltip, setTooltip] = React.useState(null);
  const [tooltipDay, setTooltipDay] = React.useState(null);

  return (
    <div style={{
      background: "var(--cream,#FFF8F5)", borderRadius: "14px",
      border: "1px solid rgba(232,180,217,0.4)",
      boxShadow: "0 4px 20px rgba(232,180,217,0.15)",
      padding: "16px", userSelect: "none",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
        <button type="button" onClick={prevMonth} style={{
          background:"none", border:"none", cursor:"pointer", color:"var(--primary,#E8B4D9)",
          fontSize:"16px", padding:"4px 8px", borderRadius:"8px",
          transition:"background 0.15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(232,180,217,0.15)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <span style={{ fontWeight:700, fontSize:"15px", color:"var(--ink,#2D1B2E)" }}>
          {monthNames[l][viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} style={{
          background:"none", border:"none", cursor:"pointer", color:"var(--primary,#E8B4D9)",
          fontSize:"16px", padding:"4px 8px", borderRadius:"8px",
          transition:"background 0.15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(232,180,217,0.15)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Week day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"6px" }}>
        {weekDayNames[l].map((name, idx) => (
          <div key={name} style={{
            textAlign:"center", fontSize:"12px", fontWeight:700,
            color: idx === 0 || idx === 6 ? "rgba(232,180,217,0.7)" : "var(--ink-light,#8B7788)",
            padding:"4px 0",
          }}>{name}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px", position:"relative" }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = toStr(day);
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
          const isPast = new Date(viewYear, viewMonth, day) < today;
          const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
          const isSelected = dateStr === value;
          const isWorkDay = enabledDayNums.has(dayOfWeek);
          const isDisabled = isPast || !isWorkDay;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const nonWorkMsg = l === "ru" ? "Нерабочий день" : "Ish kuni emas";

          return (
            <div key={day} style={{ position:"relative" }}>
              <div
                onClick={() => {
                  if (isDisabled) {
                    setTooltip(nonWorkMsg);
                    setTooltipDay(idx);
                    setTimeout(() => { setTooltip(null); setTooltipDay(null); }, 1800);
                    return;
                  }
                  onChange(dateStr);
                }}
                style={{
                  textAlign:"center", padding:"7px 4px", borderRadius:"9px",
                  fontSize:"14px", fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isSelected
                    ? "linear-gradient(135deg, var(--primary,#E8B4D9), #D4A8CC)"
                    : isToday
                      ? "rgba(232,180,217,0.2)"
                      : "transparent",
                  color: isSelected
                    ? "#fff"
                    : isDisabled
                      ? (isWeekend ? "rgba(232,180,217,0.3)" : "rgba(45,27,46,0.25)")
                      : isToday
                        ? "var(--primary,#E8B4D9)"
                        : isWeekend
                          ? "rgba(232,180,217,0.6)"
                          : "var(--ink,#2D1B2E)",
                  border: isToday && !isSelected ? "1px solid rgba(232,180,217,0.5)" : "1px solid transparent",
                  transition:"all 0.15s",
                  textDecoration: (!isWorkDay && !isPast) ? "line-through" : "none",
                  opacity: isPast ? 0.35 : 1,
                }}
                onMouseEnter={e => {
                  if (!isDisabled) e.currentTarget.style.background = isSelected ? "linear-gradient(135deg, var(--primary,#E8B4D9), #D4A8CC)" : "rgba(232,180,217,0.12)";
                }}
                onMouseLeave={e => {
                  if (!isDisabled) e.currentTarget.style.background = isSelected ? "linear-gradient(135deg, var(--primary,#E8B4D9), #D4A8CC)" : isToday ? "rgba(232,180,217,0.2)" : "transparent";
                }}
              >
                {day}
              </div>
              {tooltip && tooltipDay === idx && (
                <div style={{
                  position:"absolute", bottom:"calc(100% + 4px)", left:"50%", transform:"translateX(-50%)",
                  background:"rgba(45,27,46,0.92)", color:"#fff", fontSize:"11px", fontWeight:500,
                  padding:"5px 9px", borderRadius:"7px", whiteSpace:"nowrap", zIndex:999,
                  boxShadow:"0 2px 8px rgba(0,0,0,0.3)", pointerEvents:"none",
                }}>
                  {tooltip}
                  <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",
                    border:"4px solid transparent",borderTopColor:"rgba(45,27,46,0.92)"}}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {hasWorkingDays && (
        <div style={{ marginTop:"12px", display:"flex", gap:"16px", flexWrap:"wrap", fontSize:"11px", color:"var(--ink-light,#8B7788)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"10px",height:"10px",borderRadius:"3px",background:"linear-gradient(135deg,#E8B4D9,#D4A8CC)" }}></div>
            <span>{l==="ru"?"Выбрано":"Tanlangan"}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"10px",height:"10px",borderRadius:"3px",background:"rgba(45,27,46,0.12)",border:"1px solid rgba(232,180,217,0.3)" }}></div>
            <span style={{textDecoration:"line-through"}}>{l==="ru"?"Нерабочий":"Ish kuni emas"}</span>
          </div>
        </div>
      )}
    </div>
  );
}


export default function Home() {
  const [isModalActive,  setIsModalActive]  = useState(false);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [mastersData,    setMastersData]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const { t, lang } = useTranslation();

  const navigate = useNavigate();

  // Role-based redirect: super_admin → /admin, admin/master → /masters
  useEffect(() => {
    const user = getUser();
    if (!user) return;
    if (user.is_super_admin) { navigate("/admin"); return; }
    if (user.is_admin || user.role === "admin" || user.role === "master") { navigate("/masters"); return; }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    fetchMasters()
      .then(setMastersData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lang]); // reload on language change so services update
  const [bookingMaster,  setBookingMaster]  = useState("");
  const [bookingName,    setBookingName]    = useState("");
  const [bookingPhone,   setBookingPhone]   = useState("");
  const [bookingService, setBookingService] = useState("");
  const [bookingDate,    setBookingDate]    = useState("");
  const [bookingTime,    setBookingTime]    = useState("");
  const [bookingComment, setBookingComment] = useState("");
  const [busySlots,      setBusySlots]      = useState([]); // [{time, end_time}]
  const [timeTooltip,    setTimeTooltip]    = useState(null);
  const [loadingSlots,   setLoadingSlots]   = useState(false);

  // Selected master object
  const selectedBookingMaster = mastersData.find(m => m.name === bookingMaster) || null;

  // Services for selected master only
  const masterServices = selectedBookingMaster
    ? (selectedBookingMaster.services || [])
    : [];

  // Duration of selected service (minutes). 0 = no service selected yet.
  const serviceDuration = (selectedBookingMaster && bookingService && selectedBookingMaster.service_durations)
    ? (selectedBookingMaster.service_durations[bookingService] || 60)
    : 0;

  // Fetch busy slots — extracted as reusable function
  const fetchBusySlots = React.useCallback((master, date, showLoading = false) => {
    if (!master || !date) { setBusySlots([]); return; }
    if (showLoading) setLoadingSlots(true);
    const BASE_URL = "http://localhost:8000/api";
    const langVal = localStorage.getItem("lang") || "uz";
    fetch(`${BASE_URL}/bookings/busy/?master_id=${master.id}&date=${date}`, {
      headers: { "Accept-Language": langVal }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setBusySlots(Array.isArray(data) ? data : []))
      .catch(() => setBusySlots([]))
      .finally(() => { if (showLoading) setLoadingSlots(false); });
  }, []);

  // Fetch busy slots when master+date changes
  useEffect(() => {
    if (!selectedBookingMaster || !bookingDate) { setBusySlots([]); return; }
    fetchBusySlots(selectedBookingMaster, bookingDate, true);
    // Auto-refresh every 30 seconds so confirmed bookings appear immediately
    const interval = setInterval(() => {
      fetchBusySlots(selectedBookingMaster, bookingDate, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedBookingMaster, bookingDate, fetchBusySlots]);

  // ── Time slot helpers ──────────────────────────────────────────────────────
  // Convert "HH:MM" string to total minutes
  const timeToMins = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };

  // Generate all 30-min slots from start inclusive to end inclusive
  // e.g. "08:00"–"20:00" → 08:00, 08:30, …, 20:00
  const buildSlots = (startStr, endStr) => {
    const startMins = timeToMins(startStr);
    const endMins   = timeToMins(endStr);
    const slots = [];
    for (let m = startMins; m <= endMins; m += 30) {
      slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    }
    return slots;
  };

  // All time slots (for TimeGrid — shows busy slots too)
  const allTimeSlots = React.useMemo(() => {
    if (!selectedBookingMaster) return buildSlots("09:00", "21:00");
    const start = selectedBookingMaster.workingHours?.start || "09:00";
    const end   = selectedBookingMaster.workingHours?.end   || "18:00";
    return buildSlots(start, end);
  }, [selectedBookingMaster]);

  // ── Tashkent current time (updates every minute) ─────────────────────────
  const getTashkentNow = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 5 * 3600000);
  };

  const [nowTashkentMins, setNowTashkentMins] = useState(() => {
    const t = getTashkentNow();
    return t.getHours() * 60 + t.getMinutes();
  });

  const todayTashkent = React.useMemo(() => {
    const t = getTashkentNow();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  }, []);

  // Update nowTashkentMins every minute so past-time filter stays accurate
  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTashkentNow();
      setNowTashkentMins(t.getHours() * 60 + t.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Available slots = slots that don't conflict with bookings and aren't in the past
  const availableSlots = React.useMemo(() => {
    if (!selectedBookingMaster) return buildSlots("09:00", "21:00");
    const start = selectedBookingMaster.workingHours?.start || "09:00";
    const end   = selectedBookingMaster.workingHours?.end   || "18:00";
    const slots = buildSlots(start, end);
    const endMins = timeToMins(end);
    const isSelectedToday = bookingDate === todayTashkent;
    const hasDuration = serviceDuration > 0;

    return slots.filter(slot => {
      const slotStart = timeToMins(slot);
      // Filter past slots when booking for today
      if (isSelectedToday && slotStart < nowTashkentMins) return false;
      // Service selected: check if full service window fits and doesn't overlap
      if (hasDuration) {
        const slotEnd = slotStart + serviceDuration;
        // Can't run past end of work hours
        if (slotEnd > endMins) return false;
        // Overlap with any unconfirmed booking? (inclusive bEnd: 10:00–11:30 → 11:30 ham band)
        return !busySlots.some(b => {
          if (b.confirmed === true) return false;
          const bStart = timeToMins(b.time);
          const bEnd   = b.end_time ? timeToMins(b.end_time) : (bStart + (b.duration || 60));
          return slotStart <= bEnd && slotEnd > bStart;
        });
      }
      // Xizmat tanlanmagan: slotning START vaqti band oraliqda bo'lmasin (inclusive bEnd)
      return !busySlots.some(b => {
        if (b.confirmed === true) return false;
        const bStart = timeToMins(b.time);
        const bEnd   = b.end_time ? timeToMins(b.end_time) : (bStart + (b.duration || 60));
        return slotStart >= bStart && slotStart <= bEnd;
      });
    });
  }, [selectedBookingMaster, busySlots, serviceDuration, bookingDate, todayTashkent, nowTashkentMins]);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError,   setBookingError]   = useState("");

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError(""); setBookingSuccess("");

    // Check login
    const user = getUser();
    if (!user) {
      // Save form state and redirect to login
      const params = new URLSearchParams();
      if (bookingMaster)  params.set("master",  bookingMaster);
      if (bookingName)    params.set("name",     bookingName);
      if (bookingPhone)   params.set("phone",    bookingPhone);
      if (bookingService) params.set("service",  bookingService);
      if (bookingDate)    params.set("date",     bookingDate);
      if (bookingTime)    params.set("time",     bookingTime);
      const dest = `/?${params.toString()}#booking`;
      sessionStorage.setItem("bookingRedirect", dest);
      navigate(`/login?next=${encodeURIComponent(dest)}`);
      return;
    }

    if (!selectedBookingMaster) return setBookingError(t.home_booking_master_default);
    if (!bookingName.trim())    return setBookingError(t.home_booking_name_placeholder);
    if (!bookingService)        return setBookingError(t.home_booking_service_default);
    if (!bookingDate)           return setBookingError(t.home_booking_date_label);
    if (!bookingTime)           return setBookingError(t.home_booking_time_default);

    setBookingLoading(true);
    try {
      await createClient({
        master_id: selectedBookingMaster.id,
        username:  bookingName.trim(),
        service:   bookingService,
        price:     0,
        my_price:  0,
        date:      bookingDate,
        time:      bookingTime,
        comment:   bookingComment.trim(),
      });
      setBookingSuccess(t.home_booking_success || "Bron muvaffaqiyatli yuborildi! Master tasdiqlaydi.");
      setBookingName(""); setBookingPhone(""); setBookingService("");
      setBookingDate(""); setBookingTime(""); setBookingMaster(""); setBookingComment("");
      setBusySlots([]);
      setTimeout(() => setBookingSuccess(""), 5000);
    } catch (err) {
      setBookingError(err.message || "Xatolik yuz berdi");
    } finally {
      setBookingLoading(false);
    }
  };

  // When a master card "Bron qilish" is clicked — scroll & preselect master
  const openModal  = (master) => { setSelectedMaster(master); setIsModalActive(true); };
  const closeModal = () => { setIsModalActive(false); setSelectedMaster(null); };

  const handleMasterBook = (masterName) => {
    setBookingMaster(masterName);
    setTimeout(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div>
      <Navbar />

      {/* ── HERO ── */}
      <section className={styles.hero} id="home">
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}><i className="fas fa-crown"></i><span>{t.home_badge}</span></div>
          <h1 className={styles.heroTitle}>{t.home_hero_title_1} <em>{t.home_hero_title_2}</em> {t.home_hero_title_3}</h1>
          <p className={styles.heroSubtitle}>{t.home_hero_subtitle}</p>
          <div className={styles.heroStats}>
            <div className={styles.statItem}><div className={styles.statNumber}>1000+</div><div className={styles.statLabel}>{t.home_stat_clients}</div></div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}><div className={styles.statNumber}>{mastersData.length || "15"}+</div><div className={styles.statLabel}>{t.home_stat_masters}</div></div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}><div className={styles.statNumber}>5+</div><div className={styles.statLabel}>{t.home_stat_experience}</div></div>
          </div>
          <div className={styles.heroButtons}>
            <a href="#booking"  className={styles.heroBtn}><i className="fas fa-calendar-plus"></i> {t.home_hero_btn_book}</a>
            <a href="#services" className={styles.heroBtnSecondary}><i className="fas fa-list"></i> {t.home_hero_btn_services}</a>
          </div>
          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}><i className="fas fa-check-circle"></i><span>{t.home_feature_quality}</span></div>
            <div className={styles.heroFeature}><i className="fas fa-star"></i><span>{t.home_feature_team}</span></div>
            <div className={styles.heroFeature}><i className="fas fa-clock"></i><span>{t.home_feature_fast}</span></div>
          </div>
        </div>
        <div className={styles.heroDecoration}>
          <svg className={styles.decorIcon} style={{top:"15%",left:"8%"}} viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" opacity="0.3"/></svg>
          <svg className={styles.decorIcon} style={{bottom:"25%",right:"10%"}} viewBox="0 0 100 100" fill="none"><path d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z" fill="white" opacity="0.15"/></svg>
          <svg className={styles.decorIcon} style={{top:"40%",right:"7%"}} viewBox="0 0 100 100" fill="none"><rect x="20" y="20" width="60" height="60" rx="10" stroke="white" strokeWidth="2" opacity="0.25" fill="none"/></svg>
        </div>
      </section>

      <div className={styles.container}>

        {/* ── ABOUT ── */}
        <section className={styles.salonInfo} id="about">
          <h3><i className="fas fa-info-circle"></i>{t.home_about_title}</h3>
          <p>{t.home_about_text1}</p>
          <p>{t.home_about_text2}</p>
          <div className={styles.salonFeatures}>
            <div className={styles.featureItem}><i className="fas fa-clock"></i><span>{t.home_about_hours}</span></div>
            <div className={styles.featureItem}><i className="fas fa-star"></i><span>{t.home_about_masters}</span></div>
            <div className={styles.featureItem}><i className="fas fa-shield-alt"></i><span>{t.home_about_quality}</span></div>
            <div className={styles.featureItem}><i className="fas fa-credit-card"></i><span>{t.home_about_payment}</span></div>
          </div>
        </section>

        {/* ── MASTERS ── */}
        <section id="masters">
          <h2 className={styles.sectionTitle}>{t.home_masters_title}</h2>
          {loading ? (
            <div style={{textAlign:"center",padding:"40px"}}><i className="fas fa-spinner fa-spin" style={{fontSize:"2rem",color:"#c9a0dc"}}></i></div>
          ) : (
            <div className={styles.mastersGrid}>
              {mastersData.map((master) => (
                <div key={master.id} className={styles.masterCard}>
                  {/* Avatar: rasm bo'lsa ko'rsatadi, yo'q bo'lsa icon */}
                  <div className={styles.masterPhoto} style={{overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {master.avatar
                      ? <img src={master.avatar} alt={master.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} />
                      : <i className="fas fa-user-tie"></i>
                    }
                  </div>
                  <div className={styles.masterName}>{master.name}</div>
                  <div className={styles.masterSpecialty}>{lang==="ru" ? (master.specialty_ru || master.specialty) : (master.specialty_uz || master.specialty)}</div>
                  <div className={styles.masterExperience}>{master.experience} {t.home_master_experience}</div>
                  <button onClick={()=>openModal(master)} className={styles.bookMasterBtn}><i className="fas fa-info-circle"></i> {t.home_master_more_info}</button>
                  <button onClick={()=>handleMasterBook(master.name)} className={styles.bookMasterBtn}><i className="fas fa-calendar-plus"></i> {t.home_master_book}</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SERVICES ── */}
        <section id="services">
          <h2 className={styles.sectionTitle}>{t.home_services_title}</h2>
          <div className={styles.servicesGrid}>
            {[
              { name:t.home_svc1_name, desc:t.home_svc1_desc, feats:[t.home_service_expert,t.home_service_premium,t.home_svc1_feat3], price:"50,000",
                icon:<svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-4l-4-4-4 4H4M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M12 11v6M9 14h6"/></svg> },
              { name:t.home_svc2_name, desc:t.home_svc2_desc, feats:[t.home_svc2_feat1,t.home_svc2_feat2,t.home_svc2_feat3], price:"150,000",
                icon:<svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M12 15v7m-4-4h8M8 2v4M16 2v4"/></svg> },
              { name:t.home_svc3_name, desc:t.home_svc3_desc, feats:[t.home_svc3_feat1,t.home_svc3_feat2,t.home_svc3_feat3], price:"80,000",
                icon:<svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/></svg> },
              { name:t.home_svc4_name, desc:t.home_svc4_desc, feats:[t.home_svc4_feat1,t.home_svc4_feat2,t.home_svc4_feat3], price:"70,000",
                icon:<svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/><path d="M7.5 7.5l2 2m5 5l2 2m-9 0l2-2m5-5l2-2"/><circle cx="12" cy="12" r="4"/></svg> },
              { name:t.home_svc5_name, desc:t.home_svc5_desc, feats:[t.home_svc5_feat1,t.home_svc5_feat2,t.home_svc5_feat3], price:"120,000",
                icon:<svg className={styles.serviceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-3.5 4-6 9-6s9 2.5 9 6"/><path d="M9 8v1m6-1v1"/><path d="M12 11c-1 0-1.5.5-1.5 1"/></svg> },
            ].map((svc, i) => (
              <div key={i} className={styles.serviceCard}>
                <div className={styles.serviceCardInner}>
                  <div className={styles.serviceIconWrapper}>{svc.icon}</div>
                  <div className={styles.serviceName}>{svc.name}</div>
                  <div className={styles.serviceDescription}>{svc.desc}</div>
                  <div className={styles.serviceFeatures}>
                    {svc.feats.map((f,j)=><div key={j} className={styles.serviceFeature}><i className="fas fa-check-circle"></i><span>{f}</span></div>)}
                  </div>
                  <div className={styles.servicePriceWrapper}>
                    <div className={styles.servicePrice}>{svc.price}</div>
                    <div className={styles.servicePriceLabel}>so'm</div>
                  </div>
                  <a href="#booking" className={styles.serviceBookBtn}><i className="fas fa-calendar-plus"></i> {t.home_service_book_btn}</a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOOKING ── */}
        <section className={styles.bookingSection} id="booking">
          <h3 className={styles.bookingTitle}><i className="fas fa-calendar-check"></i>{t.home_booking_title}</h3>
          <form onSubmit={handleBookingSubmit}>
            <div className={styles.formGroup}>
              <label><i className="fas fa-user"></i>{t.home_booking_name_label}</label>
              <input type="text" name="name" required placeholder={t.home_booking_name_placeholder}
                value={bookingName} onChange={(e)=>setBookingName(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-phone"></i>{t.home_booking_phone_label}</label>
              <input type="tel" name="phone" required placeholder={t.home_booking_phone_placeholder}
                value={bookingPhone} onChange={(e)=>setBookingPhone(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-user-tie"></i>{t.home_booking_master_label}</label>
              <CustomSelect
                value={bookingMaster}
                onChange={(v) => { setBookingMaster(v); setBookingService(""); setBookingTime(""); }}
                options={[
                  { value: "", label: t.home_booking_master_default },
                  ...mastersData.map(m => ({ value: m.name, label: `${m.name} — ${lang==="ru"?(m.specialty_ru||m.specialty):m.specialty}` }))
                ]}
                placeholder={t.home_booking_master_default}
              />
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-scissors"></i>{t.home_booking_service_label}</label>
              <CustomSelect
                value={bookingService}
                onChange={(v) => { setBookingService(v); /* keep bookingTime — user keeps their chosen slot */ }}
                options={[
                  { value: "", label: t.home_booking_service_default },
                  ...(bookingMaster ? masterServices : mastersData.flatMap(m=>m.services||[]).filter((v,i,a)=>a.indexOf(v)===i)).map(s => {
                    const dur = selectedBookingMaster?.service_durations?.[s];
                    const durStr = dur ? ` (${Math.floor(dur/60)>0?Math.floor(dur/60)+"h ":""}${dur%60>0?dur%60+"min":""})` : "";
                    return { value: s, label: s + durStr };
                  })
                ]}
                placeholder={t.home_booking_service_default}
              />
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-calendar-alt"></i>{t.home_booking_date_label}</label>
              <CustomCalendar
                value={bookingDate}
                onChange={(v) => { setBookingDate(v); setBookingTime(""); }}
                workingDays={selectedBookingMaster?.workingDays || []}
                lang={lang}
              />
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-clock"></i>{t.home_booking_time_label}</label>
              {loadingSlots ? (
                <div style={{padding:"14px",color:"#c9a0dc",fontSize:"13px",display:"flex",gap:"8px",alignItems:"center"}}>
                  <i className="fas fa-spinner fa-spin"></i>
                  {lang==="ru" ? "Загрузка..." : "Vaqtlar yuklanmoqda..."}
                </div>
              ) : (
                <div>
                  {!bookingDate || !selectedBookingMaster ? (
                    <div style={{padding:"12px",color:"#8B7788",fontSize:"13px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)"}}>
                      <i className="fas fa-info-circle" style={{marginRight:"6px",color:"#c9a0dc"}}></i>
                      {lang==="ru" ? "Сначала выберите мастера и дату" : "Avval master va sanani tanlang"}
                    </div>
                  ) : (
                    <div>
                      <TimeGrid
                        slots={availableSlots}
                        allSlots={allTimeSlots}
                        busySlots={busySlots}
                        value={bookingTime}
                        onChange={setBookingTime}
                        serviceDuration={serviceDuration}
                        lang={lang}
                        bookingDate={bookingDate}
                      />
                      {allTimeSlots.length > 0 && (
                        <div style={{marginTop:"12px",display:"flex",alignItems:"center",gap:"20px",fontSize:"12px",fontFamily:"DM Sans,sans-serif"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                            <div style={{width:"12px",height:"12px",borderRadius:"4px",background:"var(--cream,#FFF8F5)",border:"1px solid rgba(232,180,217,0.4)"}}></div>
                            <span style={{color:"var(--ink-light,#8B7788)",fontWeight:500}}>{lang==="ru"?"Свободно":"Bo'sh"}</span>
                          </div>
                          {busySlots.length > 0 && (
                          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                            <div style={{width:"12px",height:"12px",borderRadius:"4px",background:"rgba(255,190,60,0.12)",border:"1px solid rgba(255,190,60,0.5)"}}></div>
                            <span style={{color:"var(--ink-light,#8B7788)",fontWeight:500}}>{lang==="ru"?"Забронировано":"Bron qilingan"}</span>
                          </div>
                          )}
                          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                            <div style={{width:"12px",height:"12px",borderRadius:"4px",background:"linear-gradient(135deg,#E8B4D9,#D4C9F0)"}}></div>
                            <span style={{color:"var(--ink-light,#8B7788)",fontWeight:500}}>{lang==="ru"?"Выбрано":"Tanlangan"}</span>
                          </div>
                        </div>
                      )}
                      {bookingTime && (() => {
                        const startMins = timeToMins(bookingTime);
                        const endMins   = startMins + serviceDuration;
                        const endStr    = `${String(Math.floor(endMins/60)).padStart(2,"0")}:${String(endMins%60).padStart(2,"0")}`;
                        const durH = Math.floor(serviceDuration/60);
                        const durM = serviceDuration % 60;
                        const durStr = (durH > 0 ? durH + (lang==="ru" ? " ч " : " soat ") : "") + (durM > 0 ? durM + (lang==="ru" ? " мин" : " min") : "");
                        return (
                          <div style={{marginTop:"8px",padding:"10px 14px",borderRadius:"10px",background:"rgba(232,180,217,0.1)",border:"1px solid rgba(232,180,217,0.4)",fontSize:"14px",color:"var(--ink,#2D1B2E)",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                            <i className="fas fa-check-circle" style={{color:"#E8B4D9",fontSize:"16px"}}></i>
                            <span style={{fontWeight:700,fontSize:"16px",color:"var(--primary-dark,#c9a0dc)"}}>{bookingTime} – {endStr}</span>
                            <span style={{fontSize:"12px",color:"var(--ink-light,#8B7788)",background:"rgba(232,180,217,0.15)",padding:"2px 8px",borderRadius:"6px"}}>{durStr}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label><i className="fas fa-comment"></i>{t.home_booking_comment_label}</label>
              <textarea name="message" placeholder={t.home_booking_comment_placeholder}
                value={bookingComment} onChange={(e)=>setBookingComment(e.target.value)}></textarea>
            </div>
            {bookingError && (
              <div style={{background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.4)",borderRadius:"10px",padding:"10px 14px",fontSize:"13px",color:"#ff6b6b",marginBottom:"8px"}}>
                <i className="fas fa-exclamation-circle" style={{marginRight:"8px"}}></i>{bookingError}
              </div>
            )}
            {bookingSuccess && (
              <div style={{background:"rgba(76,175,80,0.15)",border:"1px solid rgba(76,175,80,0.4)",borderRadius:"10px",padding:"10px 14px",fontSize:"13px",color:"#4caf50",marginBottom:"8px"}}>
                <i className="fas fa-check-circle" style={{marginRight:"8px"}}></i>{bookingSuccess}
              </div>
            )}
            <button type="submit" className={styles.btnSubmit} disabled={bookingLoading}>
              {bookingLoading ? <><i className="fas fa-spinner fa-spin"></i> {lang === "ru" ? "Yuborilmoqda..." : "Yuborilmoqda..."}</> : <><i className="fas fa-paper-plane"></i> {t.home_booking_submit}</>}
            </button>
          </form>
        </section>

        {/* ── CONTACT ── */}
        <section className={styles.contactSection}>
          <h3 className={styles.contactTitle}><i className="fas fa-phone-alt"></i>{t.home_contact_title}</h3>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}><i className="fas fa-map-marker-alt"></i><h4>{t.home_contact_address_title}</h4><p>Toshkent sh., Yashnobod tumani,<br />Noname ko'chasi</p></div>
            <div className={styles.contactItem}><i className="fas fa-phone"></i><h4>{t.home_contact_phone_title}</h4><p><a href="tel:+998909999999">+998 90 999 99 99</a></p></div>
            <div className={styles.contactItem}><i className="fas fa-envelope"></i><h4>{t.home_contact_email_title}</h4><p><a href="mailto:info@salonpro.uz">info@salonpro.uz</a></p></div>
            <div className={styles.contactItem}><i className="fas fa-clock"></i><h4>{t.home_contact_hours_title}</h4><p>Dushanba – Yakshanba<br />9:00 – 21:00</p></div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.socialLinks}>
          <a href="#" className={styles.socialLink}><i className="fab fa-instagram"></i></a>
          <a href="#" className={styles.socialLink}><i className="fab fa-telegram"></i></a>
          <a href="#" className={styles.socialLink}><i className="fab fa-facebook"></i></a>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {selectedMaster && (
        <div className={`${styles.modal} ${isModalActive?styles.active:""}`}>
          <div className={styles.modalContent}>
            <button onClick={closeModal} className={styles.modalClose}><i className="fas fa-times"></i></button>
            <div className={styles.modalHeader}>
                <div className={styles.modalMasterPhoto} style={{overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {selectedMaster.avatar
                    ? <img src={selectedMaster.avatar} alt={selectedMaster.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} />
                    : <i className="fas fa-user-tie"></i>
                  }
                </div>
              <h3 className={styles.modalMasterName}>{selectedMaster.name}</h3>
              <div className={styles.modalMasterSpecialty}>{lang==="ru" ? (selectedMaster.specialty_ru || selectedMaster.specialty) : (selectedMaster.specialty_uz || selectedMaster.specialty)}</div>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h4><i className="fas fa-user-circle"></i>{t.home_modal_personal}</h4>
                <div className={styles.modalInfoGrid}>
                  <div className={styles.modalInfoItem}><i className="fas fa-birthday-cake"></i><span>{selectedMaster.age} {t.home_modal_age}</span></div>
                  <div className={styles.modalInfoItem}><i className="fas fa-calendar-check"></i><span>{selectedMaster.experience} {t.home_modal_experience}</span></div>
                  <div className={styles.modalInfoItem}><i className="fas fa-phone"></i><span>{selectedMaster.phone}</span></div>
                </div>
              </div>
              <div className={styles.modalSection}>
                <h4><i className="fas fa-align-left"></i>{t.home_modal_bio_title}</h4>
                <p className={styles.modalBio}>{lang==="ru" ? (selectedMaster.bio_ru || selectedMaster.bio) : (selectedMaster.bio_uz || selectedMaster.bio)}</p>
              </div>
              <div className={styles.modalSection}>
                <h4><i className="fas fa-scissors"></i>{t.home_modal_services_title}</h4>
                <div className={styles.modalServicesList}>
                  {(selectedMaster.services||[]).map((service, index)=>(
                    <div key={index} className={styles.modalServiceItem}><i className="fas fa-check-circle"></i><span>{service}</span></div>
                  ))}
                </div>
              </div>
              <div className={styles.modalSection}>
                <h4><i className="fas fa-clock"></i>{t.home_modal_hours_title}</h4>
                <div className={styles.modalWorkingTime}>
                  <div className={styles.modalTimeInfo}>
                    <i className="fas fa-hourglass-start"></i>
                    <span>{selectedMaster.workingHours?.start} – {selectedMaster.workingHours?.end}</span>
                  </div>
                  <div className={styles.modalWorkingDays}>
                    {(selectedMaster.workingDays||[]).map((day,index)=>(
                      <span key={index} className={styles.modalDayBadge}>{lang==="ru" ? (DAY_LABELS[day]?.ru || day) : (DAY_LABELS[day]?.uz || day)}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={()=>{handleMasterBook(selectedMaster.name);closeModal();}} className={styles.modalBookBtn}><i className="fas fa-calendar-plus"></i>{t.home_modal_book_btn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}