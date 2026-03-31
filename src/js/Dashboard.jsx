import React, { useState, useEffect, useMemo } from 'react';
import styles from '../css/Dashboard.module.css';
import Navbar from './Navbar';
import { useTranslation } from '../hooks/useTranslation';
import { fetchClients } from '../api';

const getToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const TODAY = getToday();
const fmt   = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function Dashboard() {
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const { t, lang } = useTranslation();

  useEffect(() => {
    setLoading(true);
    fetchClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lang]);

  // ── TODAY STATS ──────────────────────────────────────────────────────────────
  const realClientsAll = useMemo(() => clients.filter((c) => !(c.price === 0 && c.my_price === 0)), [clients]);
  const todayClients = useMemo(() => realClientsAll.filter((c) => c.date === TODAY), [realClientsAll]);
  const todayTotal   = useMemo(() => todayClients.reduce((s,c) => s + (c.price   ||0), 0), [todayClients]);
  const todayMine    = useMemo(() => todayClients.reduce((s,c) => s + (c.my_price||0), 0), [todayClients]);
  const todayRent    = todayTotal - todayMine;

  // ── ALL TIME STATS ───────────────────────────────────────────────────────────
  const allTotal  = useMemo(() => realClientsAll.reduce((s,c) => s + (c.price   ||0), 0), [realClientsAll]);
  const allMine   = useMemo(() => realClientsAll.reduce((s,c) => s + (c.my_price||0), 0), [realClientsAll]);
  const allRent   = allTotal - allMine;
  const myPct     = allTotal > 0 ? ((allMine / allTotal) * 100).toFixed(1) : "0.0";
  const rentPct   = allTotal > 0 ? ((allRent  / allTotal) * 100).toFixed(1) : "0.0";

  // ── SEARCH / FILTER ──────────────────────────────────────────────────────────
  // Only show real clients (not bookings: booking = price=0 AND my_price=0)
  const realClients = clients.filter((c) => !(c.price === 0 && c.my_price === 0));

  const filtered = useMemo(() => {
    return realClients.filter((c) => {
      const nameMatch = !searchName || c.username.toLowerCase().includes(searchName.toLowerCase());
      const dateMatch = !searchDate || c.date === searchDate;
      return nameMatch && dateMatch;
    });
  }, [realClients, searchName, searchDate]);

  return (
    <div>
      <Navbar version='masters' />
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t.dash_title}</h1>
          <p className={styles.pageSubtitle}>{t.dash_subtitle}</p>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"60px"}}><i className="fas fa-spinner fa-spin" style={{fontSize:"2.5rem",color:"#c9a0dc"}}></i></div>
        ) : (
          <>
            {/* Today Stats */}
            <div className={styles.todaySection}>
              <div className={styles.todayTitle}><i className="fas fa-calendar-day"></i><span>{t.dash_today}</span></div>
              <div className={styles.todayStats}>
                <div className={styles.todayStat}>
                  <div className={styles.todayStatLabel}>{t.dash_total}</div>
                  <div className={styles.todayStatValue}>{fmt(todayTotal)} so'm</div>
                </div>
                <div className={styles.todayStat}>
                  <div className={styles.todayStatLabel}>{t.dash_mine}</div>
                  <div className={styles.todayStatValue}>{fmt(todayMine)} so'm</div>
                </div>
                <div className={styles.todayStat}>
                  <div className={styles.todayStatLabel}>{t.dash_rent}</div>
                  <div className={styles.todayStatValue}>{fmt(todayRent)} so'm</div>
                </div>
                <div className={styles.todayStat}>
                  <div className={styles.todayStatLabel}>{t.dash_clients}</div>
                  <div className={styles.todayStatValue}>{todayClients.length}</div>
                </div>
              </div>
            </div>

            {/* All Time Stats */}
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.total}`}>
                <div className={styles.statIcon}><i className="fas fa-coins"></i></div>
                <div className={styles.statLabel}>{t.dash_all_income}</div>
                <div className={styles.statValue}>{fmt(allTotal)} so'm</div>
                <div className={styles.statPercent}>{realClientsAll.length} {t.dash_all_clients}</div>
              </div>
              <div className={`${styles.statCard} ${styles.mine}`}>
                <div className={styles.statIcon}><i className="fas fa-wallet"></i></div>
                <div className={styles.statLabel}>{t.dash_my_share}</div>
                <div className={styles.statValue}>{fmt(allMine)} so'm</div>
                <div className={styles.statPercent}>{myPct}%</div>
              </div>
              <div className={`${styles.statCard} ${styles.rent}`}>
                <div className={styles.statIcon}><i className="fas fa-store"></i></div>
                <div className={styles.statLabel}>{t.dash_rent}</div>
                <div className={styles.statValue}>{fmt(allRent)} so'm</div>
                <div className={styles.statPercent}>{rentPct}%</div>
              </div>
            </div>

            {/* Breakdown bar */}
            <div className={styles.breakdownCard}>
              <div className={styles.breakdownTitle}><i className="fas fa-chart-pie"></i>{t.dash_distribution}</div>
              <div className={styles.breakdownBar}>
                <div className={`${styles.barSegment} ${styles.barMine}`} style={{ width: `${myPct}%` }}>{myPct}%</div>
                <div className={`${styles.barSegment} ${styles.barRent}`} style={{ width: `${rentPct}%` }}>{rentPct}%</div>
              </div>
              <div className={styles.breakdownLegend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.mine}`}></div>
                  <span>{t.dash_my_share} ({myPct}%)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.rent}`}></div>
                  <span>{t.dash_rent} ({rentPct}%)</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className={styles.searchSection}>
              <div className={styles.searchTitle}><i className="fas fa-search"></i>{t.dash_search_title}</div>
              <div className={styles.searchGrid}>
                <input type="text" className={styles.searchInput}
                  placeholder={t.dash_search_placeholder}
                  value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                <input type="date" className={styles.searchInput}
                  value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
                <button className={styles.searchBtn} onClick={() => {/* filter is reactive */}}>
                  <i className="fas fa-search"></i>{t.dash_search_btn}
                </button>
                <button className={styles.clearBtn} onClick={() => { setSearchName(""); setSearchDate(""); }}>
                  <i className="fas fa-times"></i>{t.dash_clear_btn}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableTitle}><i className="fas fa-table"></i>{t.dash_table_title} ({filtered.length})</div>
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th><i className="fas fa-user"></i> {t.dash_col_client}</th>
                      <th><i className="fas fa-scissors"></i> {t.dash_col_service}</th>
                      <th><i className="fas fa-calendar"></i> {t.dash_col_date}</th>
                      <th><i className="fas fa-money-bill-wave"></i> {t.dash_col_total}</th>
                      <th><i className="fas fa-wallet"></i> {t.dash_col_mine}</th>
                      <th><i className="fas fa-building"></i> {t.dash_col_rent}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{textAlign:"center",padding:"30px",color:"#8B7788"}}>Ma'lumot topilmadi</td></tr>
                    ) : filtered.map((c) => {
                      const rent = Math.max((c.price||0) - (c.my_price||0), 0);
                      const mPct = c.price > 0 ? ((c.my_price / c.price) * 100).toFixed(1) : "0.0";
                      const rPct = c.price > 0 ? ((rent      / c.price) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.username}</strong></td>
                          <td>{c.service}</td>
                          <td>{c.date} {c.time}</td>
                          <td className={styles.priceCell}>{fmt(c.price)} so'm</td>
                          <td style={{color:"#B8A4E8",fontWeight:700}}>
                            {fmt(c.my_price)} so'm
                            <span style={{fontSize:"12px",color:"#8B7788"}}> ({mPct}%)</span>
                          </td>
                          <td style={{color:"#E8B4D9",fontWeight:700}}>
                            {fmt(rent)} so'm
                            <span style={{fontSize:"12px",color:"#8B7788"}}> ({rPct}%)</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
