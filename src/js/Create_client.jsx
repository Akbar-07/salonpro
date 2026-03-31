import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../css/Create_client.module.css';
import Navbar from './Navbar';
import { useTranslation } from '../hooks/useTranslation';
import { createClient, fetchMasters, fetchMe, getUser } from '../api';

const BASE = "https://salonpro.pythonanywhere.com/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeToMins = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };
const minsToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const buildSlots = (startStr, endStr) => {
  const slots = [];
  for (let m = timeToMins(startStr); m <= timeToMins(endStr); m += 30)
    slots.push(minsToTime(m));
  return slots;
};
const getTashkentNow = () => {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
};

// ─── CustomSelect ─────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(v => !v)} style={{
        width: "100%", padding: "16px 20px", borderRadius: "12px",
        border: `2px solid ${open ? "#E8B4D9" : "rgba(232,180,217,0.2)"}`,
        background: disabled ? "rgba(248,245,255,0.5)" : "#FFF8F5",
        color: selected ? "#2D1B2E" : "#8B7788",
        fontSize: "16px", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left", fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.25s", outline: "none", opacity: disabled ? 0.6 : 1,
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`fas fa-chevron-${open ? "up" : "down"}`}
          style={{ fontSize: "12px", color: "#E8B4D9", flexShrink: 0, marginLeft: "8px" }}></i>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#fff", borderRadius: "12px",
          border: "1px solid rgba(232,180,217,0.4)",
          boxShadow: "0 8px 32px rgba(232,180,217,0.25)", overflow: "hidden",
          maxHeight: "240px", overflowY: "auto",
        }}>
          {options.map(opt => (
            <div key={opt.value} onMouseDown={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }} style={{
              padding: "12px 18px", cursor: "pointer", fontSize: "15px", fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              color: String(opt.value) === String(value) ? "#E8B4D9" : "#2D1B2E",
              background: String(opt.value) === String(value) ? "rgba(232,180,217,0.1)" : "transparent",
              borderLeft: String(opt.value) === String(value) ? "3px solid #E8B4D9" : "3px solid transparent",
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

// ─── CustomCalendar ───────────────────────────────────────────────────────────
function CustomCalendar({ value, onChange, workingDays, lang }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split("-")[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : today.getMonth());

  const dayCodeToIndex = { "Ya": 0, "Du": 1, "Se": 2, "Ch": 3, "Pa": 4, "Ju": 5, "Sh": 6 };
  const hasWorkingDays = workingDays && workingDays.length > 0;
  const enabledDayNums = hasWorkingDays
    ? new Set(workingDays.map(d => dayCodeToIndex[d]).filter(d => d !== undefined))
    : new Set([0, 1, 2, 3, 4, 5, 6]);

  const monthNames = {
    uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
    ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  };
  const weekDayNames = {
    uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
    ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  };
  const l = lang === "ru" ? "ru" : "uz";
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const toStr = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const [tooltipDay, setTooltipDay] = useState(null);

  return (
    <div style={{
      background: "#FFF8F5", borderRadius: "14px",
      border: "2px solid rgba(232,180,217,0.2)",
      boxShadow: "0 4px 20px rgba(232,180,217,0.15)",
      padding: "16px", userSelect: "none",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#E8B4D9", fontSize: "16px", padding: "4px 8px", borderRadius: "8px" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(232,180,217,0.15)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <span style={{ fontWeight: 700, fontSize: "15px", color: "#2D1B2E" }}>
          {monthNames[l][viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#E8B4D9", fontSize: "16px", padding: "4px 8px", borderRadius: "8px" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(232,180,217,0.15)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "6px" }}>
        {weekDayNames[l].map((name, idx) => (
          <div key={name} style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: idx === 0 || idx === 6 ? "rgba(232,180,217,0.7)" : "#8B7788", padding: "4px 0" }}>{name}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px", position: "relative" }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = toStr(day);
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
          const isPast = new Date(viewYear, viewMonth, day) < today;
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === value;
          const isWorkDay = enabledDayNums.has(dayOfWeek);
          const isDisabled = isPast || !isWorkDay;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div key={day} style={{ position: "relative" }}>
              <div
                onClick={() => {
                  if (isDisabled) { setTooltipDay(idx); setTimeout(() => setTooltipDay(null), 1800); return; }
                  onChange(dateStr);
                }}
                style={{
                  textAlign: "center", padding: "7px 4px", borderRadius: "9px",
                  fontSize: "14px", fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isSelected ? "linear-gradient(135deg, #E8B4D9, #D4A8CC)" : isToday ? "rgba(232,180,217,0.2)" : "transparent",
                  color: isSelected ? "#fff" : isDisabled ? (isWeekend ? "rgba(232,180,217,0.3)" : "rgba(45,27,46,0.25)") : isToday ? "#E8B4D9" : isWeekend ? "rgba(232,180,217,0.6)" : "#2D1B2E",
                  border: isToday && !isSelected ? "1px solid rgba(232,180,217,0.5)" : "1px solid transparent",
                  textDecoration: !isWorkDay && !isPast ? "line-through" : "none",
                  opacity: isPast ? 0.35 : 1, transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = isSelected ? "linear-gradient(135deg, #E8B4D9, #D4A8CC)" : "rgba(232,180,217,0.12)"; }}
                onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = isSelected ? "linear-gradient(135deg, #E8B4D9, #D4A8CC)" : isToday ? "rgba(232,180,217,0.2)" : "transparent"; }}
              >
                {day}
              </div>
              {tooltipDay === idx && (
                <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "rgba(45,27,46,0.92)", color: "#fff", fontSize: "11px", fontWeight: 500, padding: "5px 9px", borderRadius: "7px", whiteSpace: "nowrap", zIndex: 999, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", pointerEvents: "none" }}>
                  {!isWorkDay ? (l === "ru" ? "Нерабочий день" : "Ish kuni emas") : (l === "ru" ? "Прошедшая дата" : "O'tgan sana")}
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", border: "4px solid transparent", borderTopColor: "rgba(45,27,46,0.92)" }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hasWorkingDays && (
        <div style={{ marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "11px", color: "#8B7788" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "linear-gradient(135deg,#E8B4D9,#D4A8CC)" }}></div>
            <span>{l === "ru" ? "Выбрано" : "Tanlangan"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "rgba(45,27,46,0.12)", border: "1px solid rgba(232,180,217,0.3)" }}></div>
            <span style={{ textDecoration: "line-through" }}>{l === "ru" ? "Нерабочий" : "Ish kuni emas"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TimeGrid ─────────────────────────────────────────────────────────────────
function TimeGrid({ allSlots, busySlots, value, onChange, serviceDuration, lang, bookingDate }) {
  const [tooltip, setTooltip] = useState(null);

  const nowTashkent = useMemo(() => {
    const t = getTashkentNow();
    return t.getHours() * 60 + t.getMinutes();
  }, []);

  const todayTashkent = useMemo(() => {
    const t = getTashkentNow();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  const isToday = bookingDate === todayTashkent;
  const endMins = allSlots.length > 0 ? timeToMins(allSlots[allSlots.length - 1]) : 18 * 60;

  const getSlotState = (slot) => {
    const slotStart = timeToMins(slot);
    if (isToday && slotStart < nowTashkent) return "past";

    const hasDur = serviceDuration > 0;

    // overflow: xizmat ish vaqtidan tashqariga chiqsa
    if (hasDur && slotStart + serviceDuration > endMins) return "overflow";

    // 1) To'g'ridan-to'g'ri BAND: bu slot o'zi bron oraliqda (SARIQ)
    //    xizmat tanlangan/tanlanmaganidan qat'iy nazar
    const directBooked = busySlots.find(b => {
      if (b.confirmed === true) return false;
      const bStart = timeToMins(b.time);
      const bEnd = b.end_time ? timeToMins(b.end_time) : (bStart + (b.duration || 60));
      return slotStart >= bStart && slotStart < bEnd;
    });
    if (directBooked) return "busy"; // sariq -- haqiqiy bron

    // 2) CONFLICT: slot o'zi bo'sh lekin xizmat davomiyligi keyingi bronga
    //    to'qnashadi (KULRANG, sariq EMAS)
    if (hasDur) {
      const slotEnd = slotStart + serviceDuration;
      const wouldConflict = busySlots.some(b => {
        if (b.confirmed === true) return false;
        const bStart = timeToMins(b.time);
        return slotStart < bStart && slotEnd > bStart;
      });
      if (wouldConflict) return "conflict"; // kulrang -- to'qnashuv
    }

    return "free";
  };

  if (allSlots.length === 0) return (
    <div style={{ padding: "16px", textAlign: "center", color: "#8B7788", fontSize: "13px" }}>
      <i className="fas fa-calendar-times" style={{ marginRight: "6px", color: "#E8B4D9" }}></i>
      {lang === "ru" ? "Нет доступных слотов" : "Bo'sh vaqt yo'q"}
    </div>
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
      {allSlots.map(slot => {
        const state = getSlotState(slot);
        const isFree     = state === "free";
        const isBusy     = state === "busy";      // sariq: haqiqiy bron
        const isConflict = state === "conflict";  // kulrang: davomiylik to'qnashuvi
        const isPast     = state === "past";
        const isOverflow = state === "overflow";
        const isDisabled = !isFree;
        const isSelected = value === slot && isFree;

        const busyInfo = isBusy ? busySlots.find(b => {
          if (b.confirmed === true) return false;
          const slotStart = timeToMins(slot);
          const bStart = timeToMins(b.time);
          const bEnd = b.end_time ? timeToMins(b.end_time) : (bStart + (b.duration || 60));
          return slotStart >= bStart && slotStart < bEnd;
        }) : null;

        return (
          <div key={slot}
            onClick={() => {
              if (isBusy) { setTooltip(t => t === slot ? null : slot); }
              else if (isConflict) { setTooltip(t => t === slot ? null : slot); }
              else if (isFree) { onChange(slot); setTooltip(null); }
            }}
            style={{
              position: "relative", padding: "9px 16px", borderRadius: "10px",
              fontSize: "14px", fontWeight: isSelected ? 700 : 500,
              fontFamily: "'DM Sans',sans-serif",
              cursor: isDisabled ? "not-allowed" : "pointer", transition: "all 0.2s",
              border: isSelected   ? "2px solid #E8B4D9"
                    : isBusy      ? "1px solid rgba(255,190,60,0.5)"
                    : isConflict  ? "1px solid rgba(200,200,200,0.25)"
                    : isPast || isOverflow ? "1px solid rgba(200,200,200,0.3)"
                    : "1px solid rgba(232,180,217,0.4)",
              background: isSelected   ? "linear-gradient(135deg,#E8B4D9,#D4C9F0)"
                        : isBusy      ? "rgba(255,190,60,0.08)"
                        : isConflict  ? "rgba(200,200,200,0.06)"
                        : isPast || isOverflow ? "rgba(200,200,200,0.07)"
                        : "#FFF8F5",
              color: isSelected   ? "#fff"
                   : isBusy      ? "#b8860b"
                   : isConflict  ? "rgba(150,140,150,0.45)"
                   : isPast || isOverflow ? "rgba(150,140,150,0.5)"
                   : "#5C4557",
              opacity: isPast || isOverflow ? 0.45 : isConflict ? 0.5 : isBusy ? 0.85 : 1,
              textDecoration: isBusy || isPast || isOverflow || isConflict ? "line-through" : "none",
              boxShadow: isSelected ? "0 4px 14px rgba(232,180,217,0.35)" : "none",
              userSelect: "none",
            }}
          >
            {slot}
            {isBusy && (
              <span style={{ position: "absolute", top: "-3px", right: "-3px", width: "8px", height: "8px", borderRadius: "50%", background: "#ffc107", border: "2px solid #fff" }} />
            )}
            {tooltip === slot && isBusy && (
              <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#fff", border: "1px solid rgba(255,118,117,0.3)", borderRadius: "12px", padding: "10px 16px", fontSize: "12px", whiteSpace: "nowrap", color: "#e17055", fontWeight: 600, boxShadow: "0 6px 24px rgba(232,180,217,0.3)", pointerEvents: "none" }}>
                <i className="fas fa-lock" style={{ marginRight: "6px" }}></i>
                {lang === "ru" ? "Время занято" : "Bu vaqt band"}
                {busyInfo?.service && (
                  <div style={{ color: "#8B7788", marginTop: "3px", fontWeight: 400 }}>
                    {busyInfo.service}
                    {busyInfo.time && busyInfo.end_time && <span style={{ marginLeft: "6px", opacity: 0.8 }}>{busyInfo.time}–{busyInfo.end_time}</span>}
                  </div>
                )}
                <div style={{ position: "absolute", bottom: "-6px", left: "50%", width: "10px", height: "10px", background: "#fff", border: "1px solid rgba(255,118,117,0.3)", borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }}></div>
              </div>
            )}
            {tooltip === slot && isConflict && (
              <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#fff", border: "1px solid rgba(150,140,150,0.3)", borderRadius: "12px", padding: "10px 16px", fontSize: "12px", whiteSpace: "nowrap", color: "#888", fontWeight: 600, boxShadow: "0 6px 24px rgba(0,0,0,0.1)", pointerEvents: "none" }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: "6px" }}></i>
                {lang === "ru" ? "Пересекается с другой записью" : "Bu vaqt bron bilan to'qnashadi"}
                <div style={{ position: "absolute", bottom: "-6px", left: "50%", width: "10px", height: "10px", background: "#fff", border: "1px solid rgba(150,140,150,0.3)", borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }}></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Create_client() {
  const location = useLocation();
  const getParam = (key) => new URLSearchParams(location.search).get(key) || "";
  const { t, lang } = useTranslation();

  // Login bo'lgan masterning ma'lumotlari — avtomatik topiladi
  const [currentMaster, setCurrentMaster] = useState(null);
  const [mastersLoading, setMastersLoading] = useState(true);

  // Form state
  const [isValue, setIsValue] = useState('percent');
  const [value, setValue] = useState("");
  const [name, setName] = useState(() => getParam("name"));
  const [service, setService] = useState(() => getParam("service"));
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(() => getParam("date"));
  const [time, setTime] = useState(() => getParam("time"));
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Busy slots
  const [busySlots, setBusySlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Login bo'lgan foydalanuvchining username'i orqali masterlar ichidan topamiz
  useEffect(() => {
    setMastersLoading(true);
    Promise.all([fetchMe(), fetchMasters()])
      .then(([me, masters]) => {
        // me.username yoki me.profile.master_id orqali mosini topamiz
        const matched =
          masters.find(m => m.user_id === me.id) ||
          masters.find(m => m.username === me.username) ||
          masters.find(m => m.name === me.username) ||
          masters.find(m => m.name === (me.first_name + " " + me.last_name).trim()) ||
          null;
        setCurrentMaster(matched);
      })
      .catch(console.error)
      .finally(() => setMastersLoading(false));
  }, []);

  // Services
  const masterServices = currentMaster ? (currentMaster.services || []) : [];

  // Service duration
  const serviceDuration = (currentMaster && service && currentMaster.service_durations)
    ? (currentMaster.service_durations[service] || 60)
    : 0;

  // All time slots
  const allTimeSlots = useMemo(() => {
    if (!currentMaster) return buildSlots("09:00", "21:00");
    const start = currentMaster.workingHours?.start || "09:00";
    const end = currentMaster.workingHours?.end || "18:00";
    return buildSlots(start, end);
  }, [currentMaster]);

  // Fetch busy slots
  const fetchBusySlots = useCallback((master, bookingDate, showLoading = false) => {
    if (!master || !bookingDate) { setBusySlots([]); return; }
    if (showLoading) setLoadingSlots(true);
    const langVal = localStorage.getItem("lang") || "uz";
    fetch(`${BASE_URL}/bookings/busy/?master_id=${master.id}&date=${bookingDate}`, {
      headers: { "Accept-Language": langVal }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setBusySlots(Array.isArray(data) ? data : []))
      .catch(() => setBusySlots([]))
      .finally(() => { if (showLoading) setLoadingSlots(false); });
  }, []);

  useEffect(() => {
    if (!currentMaster || !date) { setBusySlots([]); return; }
    fetchBusySlots(currentMaster, date, true);
    const interval = setInterval(() => fetchBusySlots(currentMaster, date, false), 30000);
    return () => clearInterval(interval);
  }, [currentMaster, date, fetchBusySlots]);

  // Now in Tashkent (updates every minute)
  const [nowTashkentMins, setNowTashkentMins] = useState(() => {
    const t = getTashkentNow();
    return t.getHours() * 60 + t.getMinutes();
  });
  useEffect(() => {
    const iv = setInterval(() => {
      const t = getTashkentNow();
      setNowTashkentMins(t.getHours() * 60 + t.getMinutes());
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  // Price calculations
  const setPriceType = (type) => { setIsValue(type); setValue(""); };
  const normalizeValue = (val, type) => {
    if (val === "") return "";
    let num = Number(val);
    if (type === "percent" && num > 100) return 100;
    return num;
  };
  const changeValue = (e) => setValue(normalizeValue(e.target.value, isValue));
  const myPrice = (() => {
    const p = Number(price) || 0;
    const v = Number(value) || 0;
    if (isValue === "percent") return Math.round(p * v / 100);
    return v;
  })();
  const rent = Math.max((Number(price) || 0) - myPrice, 0);

  // Submit: mijoz qo'shish (narx bilan)
  const handleAdd = async () => {
    setError(""); setSuccess("");
    if (!name.trim()) return setError(t.create_err_name || "Ism familiya kiritilmadi");
    if (!service.trim()) return setError(t.create_err_service || "Xizmat kiritilmadi");
    if (!price) return setError(t.create_err_price || "Narx kiritilmadi");
    if (!date) return setError(t.create_err_date || "Sana kiritilmadi");
    if (!time) return setError(t.create_err_time || "Vaqt kiritilmadi");

    setLoading(true);
    try {
      await createClient({
        ...(currentMaster ? { master_id: currentMaster.id } : {}),
        username: name.trim(),
        service: service.trim(),
        price: Number(price),
        my_price: myPrice,
        date,
        time,
        comment: comment.trim(),
      });
      setSuccess(t.create_added_success || "Mijoz qo'shildi!");
      setName(""); setService(""); setPrice(""); setValue(""); setDate(""); setTime(""); setComment("");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Submit: bron qilish (narxsiz)
  const handleBooking = async () => {
    setError(""); setSuccess("");
    if (!name.trim()) return setError(t.create_err_name || "Ism familiya kiritilmadi");
    if (!service.trim()) return setError(t.create_err_service || "Xizmat kiritilmadi");

    setLoading(true);
    try {
      await createClient({
        username: name.trim(),
        service: service.trim(),
        price: 0,
        my_price: 0,
        ...(date ? { date } : {}),
        ...(time ? { time } : {}),
        comment: comment.trim(),
      });
      setSuccess(t.create_booked_success || "Bron qilindi!");
      setName(""); setService(""); setPrice(""); setValue(""); setDate(""); setTime(""); setComment("");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", padding: "16px 20px", border: "2px solid rgba(232,180,217,0.2)",
    borderRadius: "12px", fontSize: "16px", fontWeight: 500,
    transition: "all 0.3s", fontFamily: "'DM Sans', sans-serif",
    background: "#FFF8F5", color: "#2D1B2E", boxSizing: "border-box", outline: "none",
  };
  const focusInput = (e) => { e.target.style.borderColor = "#E8B4D9"; e.target.style.boxShadow = "0 0 0 4px rgba(232,180,217,0.15)"; e.target.style.transform = "translateY(-2px)"; };
  const blurInput = (e) => { e.target.style.borderColor = "rgba(232,180,217,0.2)"; e.target.style.boxShadow = "none"; e.target.style.transform = "none"; };

  return (
    <div>
      <Navbar version="masters" />
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t.create_title}</h1>
          <p className={styles.pageSubtitle}>{t.create_subtitle}</p>
        </div>

        <div className={styles.formContainer}>
          {error && (
            <div className={`${styles.alert} ${styles.alertError}`} style={{ display: "flex" }}>
              <i className="fas fa-exclamation-circle"></i><span>{error}</span>
            </div>
          )}
          {success && (
            <div className={`${styles.alert} ${styles.alertSuccess}`} style={{ display: "flex" }}>
              <i className="fas fa-check-circle"></i><span>{success}</span>
            </div>
          )}

          {/* Ism */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label><i className="fas fa-user"></i>{t.create_name}</label>
            <input style={inputStyle} type="text" placeholder={t.create_name_placeholder}
              value={name} onChange={(e) => setName(e.target.value)}
              onFocus={focusInput} onBlur={blurInput} />
          </div>

          {/* Xizmat */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label><i className="fas fa-scissors"></i>{t.create_service}</label>
            {currentMaster && masterServices.length > 0 ? (
              <CustomSelect
                value={service}
                onChange={(v) => { setService(v); setTime(""); }}
                options={[
                  { value: "", label: lang === "ru" ? "— Xizmat tanlang —" : "— Xizmat tanlang —" },
                  ...masterServices.map(s => {
                    const dur = currentMaster?.service_durations?.[s];
                    const durStr = dur ? ` (${Math.floor(dur / 60) > 0 ? Math.floor(dur / 60) + "h " : ""}${dur % 60 > 0 ? dur % 60 + "min" : ""})` : "";
                    return { value: s, label: s + durStr };
                  })
                ]}
                placeholder={t.create_service_placeholder}
              />
            ) : (
              <input style={inputStyle} type="text" placeholder={t.create_service_placeholder}
                value={service} onChange={(e) => { setService(e.target.value); setTime(""); }}
                onFocus={focusInput} onBlur={blurInput} />
            )}
          </div>

          {/* Narx */}
          <div className={`${styles.priceSection} ${styles.fullWidth}`}>
            <div className={styles.priceHeader}>
              <label><i className="fas fa-money-bill-wave"></i>{t.create_price_info}</label>
              <div className={styles.priceTypeToggle}>
                <button className={`${styles.priceTypeBtn} ${isValue === 'percent' ? styles.active : ''}`} onClick={() => setPriceType('percent')}>
                  <i className="fas fa-percent"></i>{t.create_percent}
                </button>
                <button className={`${styles.priceTypeBtn} ${isValue === 'amount' ? styles.active : ''}`} onClick={() => setPriceType('amount')}>
                  <i className="fas fa-coins"></i>{t.create_amount}
                </button>
              </div>
            </div>
            <div className={styles.priceInputs}>
              <div className={styles.formGroup}>
                <label><i className="fas fa-hand-holding-usd"></i>{t.create_total_price}</label>
                <div className={styles.inputWithIcon}>
                  <input style={{ ...inputStyle, paddingRight: "60px" }} type="number"
                    placeholder={t.create_total_placeholder} value={price}
                    onChange={(e) => setPrice(e.target.value)} onFocus={focusInput} onBlur={blurInput} />
                  <span className={styles.inputIcon}>so'm</span>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label><i className="fas fa-wallet"></i>{t.create_my_price}</label>
                <div className={styles.inputWithIcon}>
                  <input style={{ ...inputStyle, paddingRight: "60px" }} type="number"
                    placeholder={isValue === 'percent' ? t.create_my_price_placeholder_percent : t.create_my_price_placeholder_amount}
                    onChange={changeValue} value={value} onFocus={focusInput} onBlur={blurInput} />
                  <span className={styles.inputIcon}>{isValue === 'percent' ? '%' : "so'm"}</span>
                </div>
              </div>
            </div>
            {price && value && (
              <div style={{ background: "rgba(201,160,220,0.1)", border: "1px solid rgba(201,160,220,0.3)", borderRadius: "10px", padding: "12px 16px", marginTop: "10px", fontSize: "13px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <span>💰 Menga: <strong style={{ color: "#c9a0dc" }}>{myPrice.toLocaleString()} so'm</strong></span>
                <span>🏠 Arenda: <strong style={{ color: "#e8b4d9" }}>{rent.toLocaleString()} so'm</strong></span>
              </div>
            )}
          </div>

          {/* Kalendar — DARHOL KO'RINADI, master yuklanishini kutadi */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label><i className="fas fa-calendar-alt"></i>{t.create_date || "Sana"}</label>
            {mastersLoading ? (
              <div style={{ padding: "14px", color: "#c9a0dc", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
                <i className="fas fa-spinner fa-spin"></i>
                {lang === "ru" ? "Yuklanmoqda..." : "Yuklanmoqda..."}
              </div>
            ) : (
              <CustomCalendar
                value={date}
                onChange={(v) => { setDate(v); setTime(""); }}
                workingDays={currentMaster?.workingDays || []}
                lang={lang}
              />
            )}
          </div>

          {/* Vaqt Grid — sana tanlanganda ko'rinadi */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label><i className="fas fa-clock"></i>{t.create_time || "Vaqt"}</label>
            {!date ? (
              <div style={{ padding: "14px", color: "#8B7788", fontSize: "13px", borderRadius: "12px", border: "2px solid rgba(232,180,217,0.15)", background: "rgba(248,245,255,0.5)" }}>
                <i className="fas fa-info-circle" style={{ marginRight: "6px", color: "#E8B4D9" }}></i>
                {lang === "ru" ? "Avval sanani tanlang" : "Avval sanani tanlang"}
              </div>
            ) : loadingSlots ? (
              <div style={{ padding: "14px", color: "#c9a0dc", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
                <i className="fas fa-spinner fa-spin"></i>
                {lang === "ru" ? "Yuklanmoqda..." : "Vaqtlar yuklanmoqda..."}
              </div>
            ) : (
              <div>
                <TimeGrid
                  allSlots={allTimeSlots}
                  busySlots={busySlots}
                  value={time}
                  onChange={setTime}
                  serviceDuration={serviceDuration}
                  lang={lang}
                  bookingDate={date}
                />
                {/* Legend */}
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "20px", fontSize: "12px", fontFamily: "DM Sans,sans-serif", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#FFF8F5", border: "1px solid rgba(232,180,217,0.4)" }}></div>
                    <span style={{ color: "#8B7788", fontWeight: 500 }}>{lang === "ru" ? "Свободно" : "Bo'sh"}</span>
                  </div>
                  {busySlots.filter(b => b.confirmed !== true).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "rgba(255,190,60,0.12)", border: "1px solid rgba(255,190,60,0.5)" }}></div>
                      <span style={{ color: "#8B7788", fontWeight: 500 }}>{lang === "ru" ? "Забронировано" : "Bron qilingan"}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "linear-gradient(135deg,#E8B4D9,#D4C9F0)" }}></div>
                    <span style={{ color: "#8B7788", fontWeight: 500 }}>{lang === "ru" ? "Выбрано" : "Tanlangan"}</span>
                  </div>
                </div>
                {/* Tanlangan vaqt diapazoni */}
                {time && serviceDuration > 0 && (() => {
                  const startMins = timeToMins(time);
                  const endMins = startMins + serviceDuration;
                  const endStr = minsToTime(endMins);
                  const durH = Math.floor(serviceDuration / 60);
                  const durM = serviceDuration % 60;
                  const durStr = (durH > 0 ? durH + (lang === "ru" ? " ч " : " soat ") : "") + (durM > 0 ? durM + (lang === "ru" ? " мин" : " min") : "");
                  return (
                    <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", background: "rgba(232,180,217,0.1)", border: "1px solid rgba(232,180,217,0.4)", fontSize: "14px", color: "#2D1B2E", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <i className="fas fa-check-circle" style={{ color: "#E8B4D9", fontSize: "16px" }}></i>
                      <span style={{ fontWeight: 700, fontSize: "16px", color: "#c9a0dc" }}>{time} – {endStr}</span>
                      <span style={{ fontSize: "12px", color: "#8B7788", background: "rgba(232,180,217,0.15)", padding: "2px 8px", borderRadius: "6px" }}>{durStr}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Izoh */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label><i className="fas fa-comment"></i>{lang === "ru" ? "Izoh (ixtiyoriy)" : "Izoh (ixtiyoriy)"}</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
              placeholder={lang === "ru" ? "Qo'shimcha ma'lumot..." : "Qo'shimcha ma'lumot..."}
              value={comment} onChange={(e) => setComment(e.target.value)}
              onFocus={e => { e.target.style.borderColor = "#E8B4D9"; e.target.style.boxShadow = "0 0 0 4px rgba(232,180,217,0.15)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(232,180,217,0.2)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Tugmalar */}
          <div className={styles.formButtons}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAdd} disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
              <span>{t.create_add_btn}</span>
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleBooking} disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-calendar-check"></i>}
              <span>{t.create_booking_btn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}