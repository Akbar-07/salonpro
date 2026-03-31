import React, { useState } from "react";
import "../css/Register.css";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useTranslation } from "../hooks/useTranslation";
import { register, apiFetch } from "../api";

const BASE = "https://salonpro.pythonanywhere.com/api";

export default function Register() {
  const [step,     setStep]     = useState("register"); // register | otp
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp,      setOtp]      = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ── STEP 1: Register → sends OTP ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      // Register user (backend creates inactive user + sends OTP)
      const res = await fetch(`${BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.username?.[0] || data.email?.[0] || data.password?.[0] || data.detail || "Xatolik yuz berdi";
        throw new Error(msg);
      }
      setSuccess(`OTP kod ${email} manziliga yuborildi!`);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  /* ── STEP 2: Verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/verify-register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "OTP kod noto'g'ri yoki muddati o'tgan");
      setSuccess("Ro'yxatdan muvaffaqiyatli o'tildi!");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  /* Resend OTP */
  const handleResend = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/resend-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Qayta yuborishda xatolik");
      setSuccess("Yangi OTP kod yuborildi!");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="body">
      <Navbar />
      <div className="main_container">
        <div className="container">
          <div className="register-box">
            <div className="logo">
              <div className="logo-icon"><i className="fas fa-cut"></i></div>
              <h1>Salon Pro</h1>
              <p>{step === "register" ? t.register_title : (t.otp_title||"Email tasdiqlash")}</p>
            </div>

            <div className={`alert alert-error ${error ? "show" : ""}`}>
              <i className="fas fa-exclamation-circle"></i><span>{error}</span>
            </div>
            <div className={`alert alert-success ${success ? "show" : ""}`}>
              <i className="fas fa-check-circle"></i><span>{success}</span>
            </div>

            {/* ── STEP 1: REGISTER ── */}
            {step === "register" && (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label><i className="fas fa-user"></i>{t.register_username_label}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user"></i>
                    <input type="text" placeholder={t.register_username_placeholder}
                      value={username} onChange={e=>setUsername(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-envelope"></i>{t.register_email_label}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope"></i>
                    <input type="email" placeholder={t.register_email_placeholder}
                      value={email} onChange={e=>setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-lock"></i>{t.register_password_label}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock"></i>
                    <input type={showPass?"text":"password"} placeholder={t.register_password_placeholder}
                      value={password} onChange={e=>setPassword(e.target.value)} required />
                    <button type="button" onClick={()=>setShowPass(v=>!v)} className="eye-btn">
                      <i className={`fas fa-${showPass?"eye-slash":"eye"}`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i><span>{t.register_loading}</span></>)
                           : (<><i className="fas fa-user-plus"></i><span>{t.register_btn}</span></>)}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <div className="otp-info-box">
                  <div className="otp-icon"><i className="fas fa-envelope-open-text"></i></div>
                  <p>{t.otp_sent_info||"Emailingizga"} <strong>{email}</strong> {t.otp_code_sent||"6 raqamli tasdiqlash kodi yuborildi"}</p>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-shield-alt"></i>{t.otp_label||"OTP Kod"}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-shield-alt"></i>
                    <input type="text" placeholder="000000" maxLength={6}
                      value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} required
                      className="otp-input" />
                  </div>
                  <div style={{marginTop:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"13px",color:"var(--ink-light)"}}>
                      {t.otp_no_code||"Kod kelmadimi?"}
                    </span>
                    <button type="button" onClick={handleResend} className="resend-btn" disabled={loading}>
                      <i className="fas fa-redo"></i> {t.otp_resend||"Qayta yuborish"}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading||otp.length!==6}>
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i><span>Tekshirilmoqda...</span></>)
                           : (<><i className="fas fa-check-circle"></i><span>{t.otp_verify||"Tasdiqlash"}</span></>)}
                </button>
                <button type="button" onClick={()=>{setStep("register");setError("");setSuccess("");setOtp("");}} className="btn btn-back">
                  <i className="fas fa-arrow-left"></i><span>{t.forgot_back||"Orqaga"}</span>
                </button>
              </form>
            )}

            {step === "register" && (
              <div className="login-link">
                {t.register_has_account} <Link to="/login">{t.register_login_link}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
