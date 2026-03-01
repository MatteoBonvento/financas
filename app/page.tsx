"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type TransactionType = "income" | "expense";
type Category =
  | "Salário"
  | "Freelance"
  | "Investimentos"
  | "Outros"
  | "Moradia"
  | "Alimentação"
  | "Transporte"
  | "Saúde"
  | "Lazer"
  | "Educação"
  | "Vestuário"
  | "Tecnologia";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED: Transaction[] = [
  { id: "1", description: "Salário mensal", amount: 8500, type: "income", category: "Salário", date: "2025-02-05" },
  { id: "2", description: "Projeto freelance", amount: 2200, type: "income", category: "Freelance", date: "2025-02-10" },
  { id: "3", description: "Dividendos", amount: 420, type: "income", category: "Investimentos", date: "2025-02-15" },
  { id: "4", description: "Aluguel", amount: 1800, type: "expense", category: "Moradia", date: "2025-02-01" },
  { id: "5", description: "Supermercado", amount: 650, type: "expense", category: "Alimentação", date: "2025-02-03" },
  { id: "6", description: "Uber/Gasolina", amount: 280, type: "expense", category: "Transporte", date: "2025-02-07" },
  { id: "7", description: "Plano de saúde", amount: 380, type: "expense", category: "Saúde", date: "2025-02-01" },
  { id: "8", description: "Netflix + Spotify", amount: 85, type: "expense", category: "Lazer", date: "2025-02-01" },
  { id: "9", description: "Curso online", amount: 197, type: "expense", category: "Educação", date: "2025-02-12" },
  { id: "10", description: "Restaurante", amount: 220, type: "expense", category: "Alimentação", date: "2025-02-14" },
  { id: "11", description: "Roupas", amount: 340, type: "expense", category: "Vestuário", date: "2025-02-18" },
  { id: "12", description: "Teclado mecânico", amount: 450, type: "expense", category: "Tecnologia", date: "2025-02-20" },
  { id: "13", description: "Salário mensal", amount: 8500, type: "income", category: "Salário", date: "2025-01-05" },
  { id: "14", description: "Aluguel", amount: 1800, type: "expense", category: "Moradia", date: "2025-01-01" },
  { id: "15", description: "Supermercado", amount: 590, type: "expense", category: "Alimentação", date: "2025-01-08" },
  { id: "16", description: "Freelance app", amount: 1800, type: "income", category: "Freelance", date: "2025-01-20" },
  { id: "17", description: "Transporte", amount: 310, type: "expense", category: "Transporte", date: "2025-01-15" },
  { id: "18", description: "Saúde", amount: 380, type: "expense", category: "Saúde", date: "2025-01-01" },
  { id: "19", description: "Salário mensal", amount: 8500, type: "income", category: "Salário", date: "2024-12-05" },
  { id: "20", description: "Presentes natal", amount: 800, type: "expense", category: "Lazer", date: "2024-12-22" },
  { id: "21", description: "Aluguel", amount: 1800, type: "expense", category: "Moradia", date: "2024-12-01" },
  { id: "22", description: "Supermercado", amount: 720, type: "expense", category: "Alimentação", date: "2024-12-10" },
  { id: "23", description: "Freelance", amount: 3000, type: "income", category: "Freelance", date: "2024-12-15" },
];

const INCOME_CATS: Category[] = ["Salário", "Freelance", "Investimentos", "Outros"];
const EXPENSE_CATS: Category[] = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Vestuário", "Tecnologia"];
const ALL_CATS = [...INCOME_CATS, ...EXPENSE_CATS];

const CAT_COLORS: Record<string, string> = {
  Salário: "#10b981", Freelance: "#34d399", Investimentos: "#6ee7b7", Outros: "#a7f3d0",
  Moradia: "#f43f5e", Alimentação: "#fb923c", Transporte: "#fbbf24", Saúde: "#a78bfa",
  Lazer: "#38bdf8", Educação: "#818cf8", Vestuário: "#f472b6", Tecnologia: "#67e8f9",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,17,26,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12, padding: "10px 16px", fontSize: 13, backdropFilter: "blur(8px)"
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#fff", margin: "2px 0" }}>
          {p.name}: <strong>{typeof p.value === "number" ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(SEED);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "add">("dashboard");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQ, setSearchQ] = useState("");

  // Form state
  const [form, setForm] = useState({
    description: "", amount: "", type: "expense" as TransactionType,
    category: "Alimentação" as Category, date: new Date().toISOString().split("T")[0],
  });

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() =>
    transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0.0";

  // ── Monthly area chart data ────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][t.type] += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => new Date(a.split(" ")[1] + "-" + (months.indexOf(a.split(" ")[0]) + 1)).getTime() -
        new Date(b.split(" ")[1] + "-" + (months.indexOf(b.split(" ")[0]) + 1)).getTime())
      .map(([name, v]) => ({ name, ...v, balance: v.income - v.expense }));
  }, [transactions]);

  // ── Expense breakdown pie ──────────────────────────────────────────────────
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // ── Filtered transactions ──────────────────────────────────────────────────
  const filtered = useMemo(() =>
    transactions
      .filter(t => filterType === "all" || t.type === filterType)
      .filter(t => t.description.toLowerCase().includes(searchQ.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQ.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, filterType, searchQ]);

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    const newT: Transaction = {
      id: Date.now().toString(),
      description: form.description,
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
    };
    setTransactions(prev => [newT, ...prev]);
    setForm({ description: "", amount: "", type: "expense", category: "Alimentação", date: new Date().toISOString().split("T")[0] });
    setActiveTab("transactions");
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

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
        }

        html, body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .app { min-height: 100vh; display: flex; flex-direction: column; }

        /* ── Header ── */
        .header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(8,11,20,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0 clamp(16px, 4vw, 48px);
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; gap: 16px;
        }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px;
          background: linear-gradient(135deg, var(--accent), #a5b4fc); -webkit-background-clip: text;
          -webkit-text-fill-color: transparent; white-space: nowrap; }
        .logo span { font-weight: 400; opacity: 0.6; font-size: 14px; }

        /* ── Nav ── */
        .nav { display: flex; gap: 4px; background: var(--surface2); border-radius: 12px; padding: 4px; }
        .nav-btn {
          border: none; cursor: pointer; border-radius: 9px; padding: 7px 16px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          transition: all 0.2s; color: var(--muted); background: transparent;
        }
        .nav-btn.active { background: var(--accent); color: #fff; box-shadow: 0 4px 15px rgba(99,102,241,0.35); }
        .nav-btn:hover:not(.active) { color: var(--text); background: rgba(255,255,255,0.05); }

        /* ── Main ── */
        .main { flex: 1; padding: clamp(16px, 3vw, 32px) clamp(16px, 4vw, 48px); display: flex; flex-direction: column; gap: 24px; max-width: 1400px; width: 100%; margin: 0 auto; }

        /* ── Stats grid ── */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .stat-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
          padding: 20px 24px; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: var(--radius) var(--radius) 0 0; }
        .stat-card.green::before { background: linear-gradient(90deg, var(--green), #34d399); }
        .stat-card.red::before { background: linear-gradient(90deg, var(--red), #fb7185); }
        .stat-card.accent::before { background: linear-gradient(90deg, var(--accent), var(--accent2)); }
        .stat-card.yellow::before { background: linear-gradient(90deg, var(--yellow), #fcd34d); }
        .stat-label { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: clamp(20px, 3vw, 28px); font-weight: 700; }
        .stat-value.green { color: var(--green); }
        .stat-value.red { color: var(--red); }
        .stat-value.accent { color: #a5b4fc; }
        .stat-value.yellow { color: var(--yellow); }
        .stat-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

        /* ── Charts grid ── */
        .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }

        .chart-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px;
        }
        .chart-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--text); }
        .chart-title span { color: var(--muted); font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 400; margin-left: 8px; }

        /* ── Bar chart section ── */
        .bar-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 700px) { .bar-section { grid-template-columns: 1fr; } }

        /* ── Transactions ── */
        .txn-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .search-input {
          flex: 1; min-width: 180px; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 10px; padding: 9px 14px; color: var(--text); font-family: 'DM Sans', sans-serif;
          font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        .search-input:focus { border-color: var(--accent); }
        .search-input::placeholder { color: var(--muted); }
        .filter-btns { display: flex; gap: 6px; }
        .filter-btn {
          border: 1px solid var(--border); background: var(--surface2); color: var(--muted);
          border-radius: 8px; padding: 7px 14px; font-size: 13px; cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-btn.active-all { border-color: var(--accent); color: #a5b4fc; background: rgba(99,102,241,0.1); }
        .filter-btn.active-income { border-color: var(--green); color: var(--green); background: rgba(16,185,129,0.08); }
        .filter-btn.active-expense { border-color: var(--red); color: var(--red); background: rgba(244,63,94,0.08); }

        .txn-list { display: flex; flex-direction: column; gap: 8px; }
        .txn-item {
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
          padding: 14px 18px; display: flex; align-items: center; gap: 14px;
          transition: transform 0.15s, background 0.15s;
        }
        .txn-item:hover { background: var(--surface2); transform: translateX(4px); }
        .txn-icon {
          width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
        }
        .txn-info { flex: 1; min-width: 0; }
        .txn-desc { font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .txn-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .txn-amount { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; flex-shrink: 0; }
        .txn-del { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; padding: 4px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .txn-del:hover { color: var(--red); background: rgba(244,63,94,0.1); }

        /* ── Add form ── */
        .form-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px;
          max-width: 560px;
        }
        .form-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
        .form-input, .form-select {
          background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
          padding: 10px 14px; color: var(--text); font-family: 'DM Sans', sans-serif;
          font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%;
        }
        .form-input:focus, .form-select:focus { border-color: var(--accent); }
        .form-select option { background: var(--surface2); }
        .type-toggle { display: flex; gap: 8px; }
        .type-btn {
          flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--surface2); color: var(--muted); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .type-btn.income-active { border-color: var(--green); color: var(--green); background: rgba(16,185,129,0.1); }
        .type-btn.expense-active { border-color: var(--red); color: var(--red); background: rgba(244,63,94,0.1); }
        .submit-btn {
          width: 100%; margin-top: 8px; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 20px rgba(99,102,241,0.35);
        }
        .submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); }

        /* ── Legend dot ── */
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .cat-legend { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .cat-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .cat-row-bar {
          flex: 1; height: 4px; border-radius: 4px; background: var(--surface2); overflow: hidden;
        }
        .cat-row-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(.23,1,.32,1); }
        .cat-row-val { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; min-width: 72px; text-align: right; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 6px; }

        /* ── Empty state ── */
        .empty { text-align: center; padding: 60px 20px; color: var(--muted); }
        .empty-icon { font-size: 48px; margin-bottom: 12px; }
      `}</style>

      <div className="app">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="header">
          <div className="logo">Finança<span>.app</span></div>
          <nav className="nav">
            <button className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            <button className={`nav-btn ${activeTab === "transactions" ? "active" : ""}`} onClick={() => setActiveTab("transactions")}>Transações</button>
            <button className={`nav-btn ${activeTab === "add" ? "active" : ""}`} onClick={() => setActiveTab("add")}>+ Nova</button>
          </nav>
        </header>

        {/* ── Main ───────────────────────────────────────────────── */}
        <main className="main">

          {/* ══ DASHBOARD ══════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card green">
                  <p className="stat-label">Total Receitas</p>
                  <p className="stat-value green">{fmt(totalIncome)}</p>
                  <p className="stat-sub">{transactions.filter(t => t.type === "income").length} transações</p>
                </div>
                <div className="stat-card red">
                  <p className="stat-label">Total Despesas</p>
                  <p className="stat-value red">{fmt(totalExpense)}</p>
                  <p className="stat-sub">{transactions.filter(t => t.type === "expense").length} transações</p>
                </div>
                <div className="stat-card accent">
                  <p className="stat-label">Saldo Atual</p>
                  <p className="stat-value accent">{fmt(balance)}</p>
                  <p className="stat-sub">{balance >= 0 ? "✓ Positivo" : "⚠ Negativo"}</p>
                </div>
                <div className="stat-card yellow">
                  <p className="stat-label">Taxa de Poupança</p>
                  <p className="stat-value yellow">{savingsRate}%</p>
                  <p className="stat-sub">da renda economizada</p>
                </div>
              </div>

              {/* Area chart + Pie */}
              <div className="charts-grid">
                <div className="chart-card">
                  <p className="chart-title">Fluxo de Caixa <span>Receitas vs Despesas por mês</span></p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                      <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" />
                      <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f43f5e" strokeWidth={2} fill="url(#gExpense)" />
                      <Area type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={2} fill="url(#gBalance)" strokeDasharray="5 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <p className="chart-title">Despesas <span>por categoria</span></p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        paddingAngle={3} dataKey="value" nameKey="name">
                        {expenseByCategory.map((e, i) => (
                          <Cell key={i} fill={CAT_COLORS[e.name] || "#64748b"} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="cat-legend">
                    {expenseByCategory.slice(0, 5).map((e) => (
                      <div className="cat-row" key={e.name}>
                        <span className="legend-dot" style={{ background: CAT_COLORS[e.name] }} />
                        <span style={{ flex: 1, color: "#94a3b8" }}>{e.name}</span>
                        <div className="cat-row-bar">
                          <div className="cat-row-fill" style={{
                            width: `${(e.value / expenseByCategory[0].value) * 100}%`,
                            background: CAT_COLORS[e.name]
                          }} />
                        </div>
                        <span className="cat-row-val" style={{ color: CAT_COLORS[e.name] }}>{fmt(e.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bar section */}
              <div className="bar-section">
                <div className="chart-card">
                  <p className="chart-title">Receitas <span>por categoria</span></p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(() => {
                      const m: Record<string, number> = {};
                      transactions.filter(t => t.type === "income").forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
                      return Object.entries(m).map(([name, value]) => ({ name, value }));
                    })()} margin={{ top: 5, right: 0, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Valor" radius={[6, 6, 0, 0]}>
                        {(() => {
                          const m: Record<string, number> = {};
                          transactions.filter(t => t.type === "income").forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
                          return Object.keys(m).map((k, i) => <Cell key={i} fill={CAT_COLORS[k] || "#6366f1"} />);
                        })()}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <p className="chart-title">Despesas <span>por categoria</span></p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={expenseByCategory} margin={{ top: 5, right: 0, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Valor" radius={[6, 6, 0, 0]}>
                        {expenseByCategory.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name] || "#f43f5e"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent */}
              <div className="chart-card">
                <p className="chart-title">Últimas Transações</p>
                <div className="txn-list">
                  {transactions.slice(0, 6).map(t => (
                    <TxnItem key={t.id} t={t} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══ TRANSACTIONS ═══════════════════════════════════════ */}
          {activeTab === "transactions" && (
            <>
              <div className="txn-header">
                <input className="search-input" placeholder="Buscar transações..." value={searchQ}
                  onChange={e => setSearchQ(e.target.value)} />
                <div className="filter-btns">
                  <button className={`filter-btn ${filterType === "all" ? "active-all" : ""}`} onClick={() => setFilterType("all")}>Todos</button>
                  <button className={`filter-btn ${filterType === "income" ? "active-income" : ""}`} onClick={() => setFilterType("income")}>Receitas</button>
                  <button className={`filter-btn ${filterType === "expense" ? "active-expense" : ""}`} onClick={() => setFilterType("expense")}>Despesas</button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🔍</div>
                  <p>Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="txn-list">
                  {filtered.map(t => <TxnItem key={t.id} t={t} onDelete={handleDelete} />)}
                </div>
              )}
            </>
          )}

          {/* ══ ADD ════════════════════════════════════════════════ */}
          {activeTab === "add" && (
            <div className="form-card">
              <p className="form-title">Nova Transação</p>
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Tipo</label>
                  <div className="type-toggle">
                    <button className={`type-btn ${form.type === "income" ? "income-active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, type: "income", category: "Salário" }))}>
                      ↑ Receita
                    </button>
                    <button className={`type-btn ${form.type === "expense" ? "expense-active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, type: "expense", category: "Alimentação" }))}>
                      ↓ Despesa
                    </button>
                  </div>
                </div>
                <div className="form-group full">
                  <label className="form-label">Descrição</label>
                  <input className="form-input" placeholder="Ex: Salário mensal..." value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input className="form-input" type="number" placeholder="0,00" min="0" step="0.01"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input className="form-input" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                    {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <button className="submit-btn" onClick={handleAdd}>Adicionar Transação</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────
const CAT_EMOJI: Record<string, string> = {
  Salário: "💼", Freelance: "💻", Investimentos: "📈", Outros: "💡",
  Moradia: "🏠", Alimentação: "🍔", Transporte: "🚗", Saúde: "💊",
  Lazer: "🎮", Educação: "📚", Vestuário: "👕", Tecnologia: "⚡",
};

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