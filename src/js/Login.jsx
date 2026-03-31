import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../css/Login.css";
import Navbar from "./Navbar";
import { useTranslation } from "../hooks/useTranslation";
import { login, fetchMe, apiFetch } from "../api";

const BASE = "http://localhost:8000/api";

export default function Login() {
  const [step,     setStep]     = useState("login"); // login | forgot | forgot_otp | forgot_pass
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp,   setForgotOtp]   = useState("");
  const [newPass,     setNewPass]      = useState("");
  const [newPass2,    setNewPass2]     = useState("");

  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useTranslation();

  /* ── LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await login(username, password);
      const user = await fetchMe();
      setSuccess(t.login_success || "Muvaffaqiyatli kirildi!");
      setTimeout(() => {
        const params = new URLSearchParams(location.search);
        const next = params.get("next") || sessionStorage.getItem("bookingRedirect");
        sessionStorage.removeItem("bookingRedirect");
        if (next) { navigate(next); }
        else if (user.is_super_admin || user.role === "admin" || user.role === "boss") { navigate("/admin"); }
        else if (user.role === "master") {
          const p = user.profile || {};
          const complete = p.first_name && p.specialty_uz && p.services && p.services.length > 0;
          navigate(complete ? "/masters" : "/profile");
        } else { navigate("/"); }
      }, 600);
    } catch (err) {
      setError(err.message || t.login_error || "Username yoki parol noto'g'ri");
    } finally { setLoading(false); }
  };

  /* ── SEND FORGOT OTP ── */
  const handleForgotSend = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.email?.[0] || "Email topilmadi");
      setSuccess(t.forgot_sent || "OTP kod yuborildi!");
      setStep("forgot_otp");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  /* ── VERIFY OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "OTP kod noto'g'ri");
      setSuccess(t.otp_verified || "OTP tasdiqlandi! Yangi parol kiriting.");
      setStep("forgot_pass");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  /* ── RESET PASSWORD ── */
  const handleResetPass = async (e) => {
    e.preventDefault();
    setError("");
    if (newPass !== newPass2) { setError(t.new_pass_mismatch || "Parollar mos kelmadi!"); return; }
    if (newPass.length < 6)   { setError(t.new_pass_short || "Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, new_password: newPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Xatolik yuz berdi");
      setSuccess(t.new_pass_saved || "Parol muvaffaqiyatli yangilandi! Endi kirishingiz mumkin.");
      setTimeout(() => { setStep("login"); setSuccess(""); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const goBack = () => { setStep("login"); setError(""); setSuccess(""); };

  return (
    <div className="body">
      <Navbar />
      <div className="main_container">
        <div className="container">
          <div className="login-box">
            <div className="logo">
              <div className="logo-icon"><i className="fas fa-cut"></i></div>
              <h1>Salon Pro</h1>
              <p>{step === "login" ? t.login_title : step === "forgot" ? (t.forgot_title||"Parolni tiklash") : step === "forgot_otp" ? (t.otp_title||"OTP tasdiqlash") : (t.new_pass_title||"Yangi parol")}</p>
            </div>

            <div className={`alert alert-error ${error ? "show" : ""}`}>
              <i className="fas fa-exclamation-circle"></i><span>{error}</span>
            </div>
            <div className={`alert alert-success ${success ? "show" : ""}`}>
              <i className="fas fa-check-circle"></i><span>{success}</span>
            </div>

            {/* ── LOGIN FORM ── */}
            {step === "login" && (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label><i className="fas fa-user"></i>{t.login_username_label}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user"></i>
                    <input type="text" placeholder={t.login_username_placeholder}
                      value={username} onChange={e=>setUsername(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-lock"></i>{t.login_password_label}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock"></i>
                    <input type={showPass?"text":"password"} placeholder={t.login_password_placeholder}
                      value={password} onChange={e=>setPassword(e.target.value)} required />
                    <button type="button" onClick={()=>setShowPass(v=>!v)} className="eye-btn">
                      <i className={`fas fa-${showPass?"eye-slash":"eye"}`}></i>
                    </button>
                  </div>
                </div>
                <div style={{textAlign:"right",marginBottom:"20px",marginTop:"-10px"}}>
                  <button type="button" onClick={()=>setStep("forgot")} className="forgot-link">
                    <i className="fas fa-key"></i> {t.forgot_btn||"Parolni unutdim?"}
                  </button>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i><span>{t.login_loading}</span></>)
                           : (<><i className="fas fa-sign-in-alt"></i><span>{t.login_btn}</span></>)}
                </button>
              </form>
            )}

            {/* ── FORGOT EMAIL ── */}
            {step === "forgot" && (
              <form onSubmit={handleForgotSend}>
                <p style={{fontSize:"14px",color:"var(--ink-mid)",marginBottom:"20px",lineHeight:"1.6"}}>
                  <i className="fas fa-info-circle" style={{color:"var(--primary)",marginRight:"6px"}}></i>
                  {t.forgot_info||"Emailingizni kiriting, parolni tiklash uchun OTP kod yuboramiz"}
                </p>
                <div className="form-group">
                  <label><i className="fas fa-envelope"></i>{t.forgot_email_label||"Email"}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope"></i>
                    <input type="email" placeholder="email@example.com"
                      value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i><span>{t.forgot_sending || "Yuborilmoqda..."}</span></>)
                           : (<><i className="fas fa-paper-plane"></i><span>{t.forgot_send||"OTP yuborish"}</span></>)}
                </button>
                <button type="button" onClick={goBack} className="btn btn-back">
                  <i className="fas fa-arrow-left"></i><span>{t.forgot_back||"Orqaga"}</span>
                </button>
              </form>
            )}

            {/* ── OTP VERIFY ── */}
            {step === "forgot_otp" && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{fontSize:"14px",color:"var(--ink-mid)",marginBottom:"20px",lineHeight:"1.6"}}>
                  <i className="fas fa-envelope-open-text" style={{color:"var(--primary)",marginRight:"6px"}}></i>
                  <strong>{forgotEmail}</strong> {t.otp_info||"manziliga 6 raqamli kod yuborildi"}
                </p>
                <div className="form-group">
                  <label><i className="fas fa-shield-alt"></i>{t.otp_label||"OTP Kod"}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-shield-alt"></i>
                    <input type="text" placeholder="000000" maxLength={6}
                      value={forgotOtp} onChange={e=>setForgotOtp(e.target.value.replace(/\D/g,""))} required
                      style={{letterSpacing:"0.3em",fontSize:"22px",textAlign:"center"}} />
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading||forgotOtp.length!==6}>
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i><span>{t.otp_verifying || "Tekshirilmoqda..."}</span></>)
                           : (<><i className="fas fa-check-circle"></i><span>{t.otp_verify||"Tasdiqlash"}</span></>)}
                </button>
                <button type="button" onClick={()=>setStep("forgot")} className="btn btn-back">
                  <i className="fas fa-arrow-left"></i><span>{t.forgot_back||"Orqaga"}</span>
                </button>
              </form>
            )}

            {/* ── NEW PASSWORD ── */}
            {step === "forgot_pass" && (
              <form onSubmit={handleResetPass}>
                <div className="form-group">
                  <label><i className="fas fa-lock"></i>{t.new_pass_label||"Yangi parol"}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock"></i>
                    <input type={showPass?"text":"password"} placeholder="Yangi parol kiriting"
                      value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={6} />
                    <button type="button" onClick={()=>setShowPass(v=>!v)} className="eye-btn">
                      <i className={`fas fa-${showPass?"eye-slash":"eye"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-lock"></i>{t.new_pass_confirm||"Parolni tasdiqlang"}</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock"></i>
                    <input type={showPass?"text":"password"} placeholder="Parolni takrorlang"
                      value={newPass2} onChange={e=>setNewPass2(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? (<><i className="fas fa-spinner fa-spin"></i><span>{t.new_pass_saving || "Saqlanmoqda..."}</span></>)
                           : (<><i className="fas fa-save"></i><span>{t.new_pass_save||"Saqlash"}</span></>)}
                </button>
              </form>
            )}

            {step === "login" && (
              <div className="register-link">
                {t.login_no_account} <Link to="/register">{t.login_register_link}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
