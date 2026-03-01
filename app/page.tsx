"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";

type TransactionType = "income" | "expense";
type Category =
  | "Salário" | "Freelance" | "Investimentos" | "Outros"
  | "Moradia" | "Alimentação" | "Transporte" | "Saúde"
  | "Lazer" | "Educação" | "Vestuário" | "Tecnologia";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

const INCOME_CATS: Category[] = ["Salário", "Freelance", "Investimentos", "Outros"];
const EXPENSE_CATS: Category[] = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Vestuário", "Tecnologia"];

const CAT_COLORS: Record<string, string> = {
  Salário: "#10b981", Freelance: "#34d399", Investimentos: "#6ee7b7", Outros: "#a7f3d0",
  Moradia: "#f43f5e", Alimentação: "#fb923c", Transporte: "#fbbf24", Saúde: "#a78bfa",
  Lazer: "#38bdf8", Educação: "#818cf8", Vestuário: "#f472b6", Tecnologia: "#67e8f9",
};

const CAT_EMOJI: Record<string, string> = {
  Salário: "💼", Freelance: "💻", Investimentos: "📈", Outros: "💡",
  Moradia: "🏠", Alimentação: "🍔", Transporte: "🚗", Saúde: "💊",
  Lazer: "🎮", Educação: "📚", Vestuário: "👕", Tecnologia: "⚡",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,17,26,0.97)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12, padding: "10px 14px", fontSize: 12, backdropFilter: "blur(8px)",
      maxWidth: 200,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#fff", margin: "2px 0" }}>
          {p.name}: <strong>{typeof p.value === "number" ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "add">("dashboard");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQ, setSearchQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("transactions").select("*").order("date", { ascending: false });
      if (data) setTransactions(data);
      setLoading(false);
    }
    load();
  }, []);

  const [form, setForm] = useState({
    description: "", amount: "", type: "expense" as TransactionType,
    category: "Alimentação" as Category, date: new Date().toISOString().split("T")[0],
  });

  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() =>
    transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0.0";

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][t.type] += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => {
        const toDate = (s: string) => {
          const [m, y] = s.split(" ");
          return new Date(`20${y}-${String(months.indexOf(m) + 1).padStart(2, "0")}-01`).getTime();
        };
        return toDate(a) - toDate(b);
      })
      .map(([name, v]) => ({ name, ...v, balance: v.income - v.expense }));
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const filtered = useMemo(() =>
    transactions
      .filter(t => filterType === "all" || t.type === filterType)
      .filter(t => t.description.toLowerCase().includes(searchQ.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQ.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, filterType, searchQ]);

  const handleAdd = async () => {
    if (!form.description || !form.amount) return;
    const newT = {
      description: form.description, amount: parseFloat(form.amount),
      type: form.type, category: form.category, date: form.date,
    };
    const { data } = await supabase.from("transactions").insert(newT).select().single();
    if (data) setTransactions(prev => [data, ...prev]);
    setForm({ description: "", amount: "", type: "expense", category: "Alimentação", date: new Date().toISOString().split("T")[0] });
    setActiveTab("transactions");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const navTo = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080b14;
          --surface: #0f1320;
          --surface2: #161c2d;
          --border: rgba(255,255,255,0.07);
          --text: #e2e8f0;
          --muted: #64748b;
          --accent: #6366f1;
          --accent2: #8b5cf6;
          --green: #10b981;
          --red: #f43f5e;
          --yellow: #f59e0b;
          --radius: 16px;
          --header-h: 60px;
          --bottom-nav-h: 60px;
        }

        html { font-size: 16px; -webkit-text-size-adjust: 100%; }
        body {
          background: var(--bg); color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh; min-height: 100dvh;
          overscroll-behavior: none;
        }

        .app { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }

        /* ── Header ── */
        .header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(8,11,20,0.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0 clamp(12px, 4vw, 48px);
          display: flex; align-items: center; justify-content: space-between;
          height: var(--header-h); gap: 12px;
        }
        .logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(17px, 4vw, 22px);
          background: linear-gradient(135deg, var(--accent), #a5b4fc);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; white-space: nowrap; flex-shrink: 0;
        }
        .logo span { font-weight: 400; opacity: 0.6; font-size: 0.65em; }

        .nav-desktop { display: flex; gap: 4px; background: var(--surface2); border-radius: 12px; padding: 4px; }
        .nav-btn {
          border: none; cursor: pointer; border-radius: 9px; padding: 7px 16px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          transition: all 0.2s; color: var(--muted); background: transparent; white-space: nowrap;
        }
        .nav-btn.active { background: var(--accent); color: #fff; box-shadow: 0 4px 15px rgba(99,102,241,0.35); }
        .nav-btn:hover:not(.active) { color: var(--text); background: rgba(255,255,255,0.05); }

        .hamburger {
          display: none; background: none; border: none; color: var(--text);
          cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .hamburger:hover { background: rgba(255,255,255,0.07); }
        .hamburger svg { width: 22px; height: 22px; display: block; }

        .mobile-menu {
          display: none; position: fixed;
          top: var(--header-h); left: 0; right: 0; z-index: 99;
          background: rgba(13,16,28,0.98); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          flex-direction: column; padding: 4px 0 8px;
          animation: slideDown 0.18s ease;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu-btn {
          border: none; background: none; color: var(--muted);
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          padding: 14px 20px; text-align: left; cursor: pointer;
          transition: color 0.15s, background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .mobile-menu-btn.active { color: #a5b4fc; background: rgba(99,102,241,0.06); }
        .mobile-menu-btn:hover { color: var(--text); background: rgba(255,255,255,0.04); }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Bottom nav (mobile only) ── */
        .bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: rgba(8,11,20,0.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .bottom-nav-inner { display: flex; height: var(--bottom-nav-h); }
        .bottom-nav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; border: none; background: none; color: var(--muted); cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
          transition: color 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .bottom-nav-btn.active { color: #a5b4fc; }
        .bottom-nav-btn svg { width: 20px; height: 20px; }

        /* ── Main content ── */
        .main {
          flex: 1;
          padding: clamp(12px, 3vw, 32px) clamp(12px, 4vw, 48px);
          display: flex; flex-direction: column; gap: 16px;
          max-width: 1400px; width: 100%; margin: 0 auto;
        }

        .loading {
          display: flex; align-items: center; justify-content: center;
          height: 200px; color: var(--muted); font-size: 14px; gap: 10px;
        }
        .spinner {
          width: 20px; height: 20px; border: 2px solid var(--border);
          border-top-color: var(--accent); border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Stats ── */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .stat-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
          padding: clamp(13px, 2vw, 20px) clamp(13px, 2vw, 22px);
          position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          border-radius: var(--radius) var(--radius) 0 0;
        }
        .stat-card.green::before { background: linear-gradient(90deg, var(--green), #34d399); }
        .stat-card.red::before { background: linear-gradient(90deg, var(--red), #fb7185); }
        .stat-card.accent::before { background: linear-gradient(90deg, var(--accent), var(--accent2)); }
        .stat-card.yellow::before { background: linear-gradient(90deg, var(--yellow), #fcd34d); }
        .stat-label { font-size: clamp(9px, 1.5vw, 11px); font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: clamp(15px, 2.2vw, 26px); font-weight: 700; line-height: 1.1; word-break: break-all; }
        .stat-value.green { color: var(--green); }
        .stat-value.red { color: var(--red); }
        .stat-value.accent { color: #a5b4fc; }
        .stat-value.yellow { color: var(--yellow); }
        .stat-sub { font-size: clamp(9px, 1.5vw, 11px); color: var(--muted); margin-top: 4px; }

        /* ── Charts ── */
        .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: clamp(14px, 2vw, 24px); }
        .chart-title { font-family: 'Syne', sans-serif; font-size: clamp(12px, 2vw, 15px); font-weight: 700; margin-bottom: 14px; color: var(--text); }
        .chart-title span { color: var(--muted); font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 400; margin-left: 6px; }

        .bar-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ── Transactions ── */
        .txn-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .search-input {
          flex: 1; min-width: 120px; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 10px; padding: 9px 13px; color: var(--text);
          font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none;
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
        }
        .search-input:focus { border-color: var(--accent); }
        .search-input::placeholder { color: var(--muted); }
        .filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-btn {
          border: 1px solid var(--border); background: var(--surface2); color: var(--muted);
          border-radius: 8px; padding: 7px 12px; font-size: 12px; cursor: pointer;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif; white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
        }
        .filter-btn.active-all { border-color: var(--accent); color: #a5b4fc; background: rgba(99,102,241,0.1); }
        .filter-btn.active-income { border-color: var(--green); color: var(--green); background: rgba(16,185,129,0.08); }
        .filter-btn.active-expense { border-color: var(--red); color: var(--red); background: rgba(244,63,94,0.08); }

        .txn-list { display: flex; flex-direction: column; gap: 8px; }
        .txn-item {
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
          padding: clamp(10px, 2vw, 14px) clamp(12px, 2vw, 18px);
          display: flex; align-items: center; gap: 12px;
          transition: background 0.15s, transform 0.15s;
        }
        @media (hover: hover) { .txn-item:hover { background: var(--surface2); transform: translateX(3px); } }
        .txn-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .txn-info { flex: 1; min-width: 0; }
        .txn-desc { font-weight: 500; font-size: clamp(12px, 2vw, 14px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .txn-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .txn-amount { font-family: 'Syne', sans-serif; font-weight: 700; font-size: clamp(12px, 2vw, 15px); flex-shrink: 0; }
        .txn-del {
          background: none; border: none; color: var(--muted); cursor: pointer;
          font-size: 14px; padding: 6px; border-radius: 6px; flex-shrink: 0;
          transition: color 0.15s, background 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .txn-del:hover { color: var(--red); background: rgba(244,63,94,0.1); }

        /* ── Form ── */
        .form-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
          padding: clamp(16px, 3vw, 28px); max-width: 560px; width: 100%;
        }
        .form-title { font-family: 'Syne', sans-serif; font-size: clamp(16px, 3vw, 20px); font-weight: 700; margin-bottom: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
        .form-input, .form-select {
          background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
          padding: 11px 13px; color: var(--text); font-family: 'DM Sans', sans-serif;
          font-size: 15px; outline: none; transition: border-color 0.2s; width: 100%;
          -webkit-appearance: none; appearance: none;
        }
        .form-input:focus, .form-select:focus { border-color: var(--accent); }
        .form-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2364748b' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 13px center; padding-right: 34px;
        }
        .form-select option { background: #161c2d; }
        .type-toggle { display: flex; gap: 8px; }
        .type-btn {
          flex: 1; padding: 11px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--surface2); color: var(--muted); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .type-btn.income-active { border-color: var(--green); color: var(--green); background: rgba(16,185,129,0.1); }
        .type-btn.expense-active { border-color: var(--red); color: var(--red); background: rgba(244,63,94,0.1); }
        .submit-btn {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          -webkit-tap-highlight-color: transparent;
        }
        .submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); opacity: 0.85; }

        /* ── Legend ── */
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cat-legend { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }
        .cat-row { display: flex; align-items: center; gap: 7px; font-size: 12px; }
        .cat-row-bar { flex: 1; height: 3px; border-radius: 4px; background: var(--surface2); overflow: hidden; min-width: 30px; }
        .cat-row-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(.23,1,.32,1); }
        .cat-row-val { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; min-width: 64px; text-align: right; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .empty { text-align: center; padding: 40px 20px; color: var(--muted); }
        .empty-icon { font-size: 36px; margin-bottom: 8px; }
        .empty p { font-size: 13px; }

        /* ══ BREAKPOINTS ══ */

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .charts-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          :root { --header-h: 56px; }
          .nav-desktop { display: none; }
          .hamburger { display: flex; align-items: center; justify-content: center; }
          .bottom-nav { display: flex; flex-direction: column; }
          .main {
            padding: 12px;
            padding-bottom: calc(var(--bottom-nav-h) + 16px + env(safe-area-inset-bottom, 0px));
          }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .bar-section { grid-template-columns: 1fr; }
          .charts-grid { gap: 10px; }
        }

        @media (max-width: 480px) {
          .stats-grid { gap: 8px; }
          .stat-card { padding: 12px 13px; }
          .chart-card { padding: 13px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: 1; }
          .filter-btn { padding: 6px 10px; font-size: 11px; }
          .txn-item { gap: 10px; padding: 10px 12px; }
          .txn-icon { width: 34px; height: 34px; font-size: 14px; border-radius: 8px; }
        }

        @media (max-width: 360px) {
          .stat-value { font-size: 14px; }
          .logo { font-size: 15px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo">Finança<span>.app</span></div>

          <nav className="nav-desktop">
            {(["dashboard", "transactions", "add"] as const).map(tab => (
              <button key={tab} className={`nav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => navTo(tab)}>
                {tab === "dashboard" ? "Dashboard" : tab === "transactions" ? "Transações" : "+ Nova"}
              </button>
            ))}
          </nav>

          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </header>

        {/* Mobile dropdown */}
        <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          <button className={`mobile-menu-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => navTo("dashboard")}>📊 Dashboard</button>
          <button className={`mobile-menu-btn ${activeTab === "transactions" ? "active" : ""}`} onClick={() => navTo("transactions")}>📋 Transações</button>
          <button className={`mobile-menu-btn ${activeTab === "add" ? "active" : ""}`} onClick={() => navTo("add")}>➕ Nova Transação</button>
        </div>

        {/* Main */}
        <main className="main">
          {loading ? (
            <div className="loading"><div className="spinner" /> Carregando...</div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <>
                  <div className="stats-grid">
                    {[
                      { label: "Total Receitas", value: fmt(totalIncome), cls: "green", sub: `${transactions.filter(t => t.type === "income").length} transações` },
                      { label: "Total Despesas", value: fmt(totalExpense), cls: "red", sub: `${transactions.filter(t => t.type === "expense").length} transações` },
                      { label: "Saldo Atual", value: fmt(balance), cls: "accent", sub: balance >= 0 ? "✓ Positivo" : "⚠ Negativo" },
                      { label: "Taxa de Poupança", value: `${savingsRate}%`, cls: "yellow", sub: "da renda economizada" },
                    ].map(({ label, value, cls, sub }) => (
                      <div key={label} className={`stat-card ${cls}`}>
                        <p className="stat-label">{label}</p>
                        <p className={`stat-value ${cls}`}>{value}</p>
                        <p className="stat-sub">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="charts-grid">
                    <div className="chart-card">
                      <p className="chart-title">Fluxo de Caixa <span>Receitas vs Despesas</span></p>
                      <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={monthlyData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
                          <defs>
                            {[["gIncome","#10b981"],["gExpense","#f43f5e"],["gBalance","#6366f1"]].map(([id, color]) => (
                              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                          <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" />
                          <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f43f5e" strokeWidth={2} fill="url(#gExpense)" />
                          <Area type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={2} fill="url(#gBalance)" strokeDasharray="5 3" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <p className="chart-title">Despesas <span>por categoria</span></p>
                      {expenseByCategory.length === 0 ? (
                        <div className="empty"><div className="empty-icon">📊</div><p>Sem despesas ainda</p></div>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={155}>
                            <PieChart>
                              <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" nameKey="name">
                                {expenseByCategory.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name] || "#64748b"} stroke="none" />)}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="cat-legend">
                            {expenseByCategory.slice(0, 5).map(e => (
                              <div className="cat-row" key={e.name}>
                                <span className="legend-dot" style={{ background: CAT_COLORS[e.name] }} />
                                <span style={{ flex: 1, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{e.name}</span>
                                <div className="cat-row-bar">
                                  <div className="cat-row-fill" style={{ width: `${(e.value / expenseByCategory[0].value) * 100}%`, background: CAT_COLORS[e.name] }} />
                                </div>
                                <span className="cat-row-val" style={{ color: CAT_COLORS[e.name] }}>{fmt(e.value)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bar-section">
                    {([
                      { title: "Receitas", type: "income" as const, fallbackColor: "#6366f1" },
                      { title: "Despesas", type: "expense" as const, fallbackColor: "#f43f5e" },
                    ]).map(({ title, type, fallbackColor }) => {
                      const data = (() => {
                        const m: Record<string, number> = {};
                        transactions.filter(t => t.type === type).forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
                        return Object.entries(m).map(([name, value]) => ({ name, value }));
                      })();
                      return (
                        <div className="chart-card" key={title}>
                          <p className="chart-title">{title} <span>por categoria</span></p>
                          <ResponsiveContainer width="100%" height={195}>
                            <BarChart data={data} margin={{ top: 5, right: 4, left: -10, bottom: 24 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} interval={0} />
                              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" name="Valor" radius={[5, 5, 0, 0]}>
                                {data.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name] || fallbackColor} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })}
                  </div>

                  <div className="chart-card">
                    <p className="chart-title">Últimas Transações</p>
                    {transactions.length === 0
                      ? <div className="empty"><div className="empty-icon">💸</div><p>Nenhuma transação ainda</p></div>
                      : <div className="txn-list">{transactions.slice(0, 6).map(t => <TxnItem key={t.id} t={t} onDelete={handleDelete} />)}</div>
                    }
                  </div>
                </>
              )}

              {activeTab === "transactions" && (
                <>
                  <div className="txn-header">
                    <input className="search-input" placeholder="Buscar transações..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                    <div className="filter-btns">
                      <button className={`filter-btn ${filterType === "all" ? "active-all" : ""}`} onClick={() => setFilterType("all")}>Todos</button>
                      <button className={`filter-btn ${filterType === "income" ? "active-income" : ""}`} onClick={() => setFilterType("income")}>Receitas</button>
                      <button className={`filter-btn ${filterType === "expense" ? "active-expense" : ""}`} onClick={() => setFilterType("expense")}>Despesas</button>
                    </div>
                  </div>
                  {filtered.length === 0
                    ? <div className="empty"><div className="empty-icon">🔍</div><p>Nenhuma transação encontrada</p></div>
                    : <div className="txn-list">{filtered.map(t => <TxnItem key={t.id} t={t} onDelete={handleDelete} />)}</div>
                  }
                </>
              )}

              {activeTab === "add" && (
                <div className="form-card">
                  <p className="form-title">Nova Transação</p>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Tipo</label>
                      <div className="type-toggle">
                        <button className={`type-btn ${form.type === "income" ? "income-active" : ""}`} onClick={() => setForm(f => ({ ...f, type: "income", category: "Salário" }))}>↑ Receita</button>
                        <button className={`type-btn ${form.type === "expense" ? "expense-active" : ""}`} onClick={() => setForm(f => ({ ...f, type: "expense", category: "Alimentação" }))}>↓ Despesa</button>
                      </div>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Descrição</label>
                      <input className="form-input" placeholder="Ex: Salário mensal..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Valor (R$)</label>
                      <input className="form-input" type="number" inputMode="decimal" placeholder="0,00" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data</label>
                      <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Categoria</label>
                      <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                        {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group full">
                      <button className="submit-btn" onClick={handleAdd}>Adicionar Transação</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Bottom Nav mobile */}
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            <button className={`bottom-nav-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => navTo("dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span>Dashboard</span>
            </button>
            <button className={`bottom-nav-btn ${activeTab === "transactions" ? "active" : ""}`} onClick={() => navTo("transactions")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/>
                <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
                <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
              </svg>
              <span>Transações</span>
            </button>
            <button className={`bottom-nav-btn ${activeTab === "add" ? "active" : ""}`} onClick={() => navTo("add")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>Nova</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

function TxnItem({ t, onDelete }: { t: Transaction; onDelete: (id: string) => void }) {
  const d = new Date(t.date + "T00:00:00");
  return (
    <div className="txn-item">
      <div className="txn-icon" style={{ background: `${CAT_COLORS[t.category]}18` }}>
        {CAT_EMOJI[t.category] || "💰"}
      </div>
      <div className="txn-info">
        <p className="txn-desc">{t.description}</p>
        <p className="txn-meta">{t.category} · {d.toLocaleDateString("pt-BR")}</p>
      </div>
      <p className="txn-amount" style={{ color: t.type === "income" ? "var(--green)" : "var(--red)" }}>
        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
      </p>
      <button className="txn-del" onClick={() => onDelete(t.id)} title="Remover">✕</button>
    </div>
  );
}