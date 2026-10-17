"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { AdminShell } from "../layout/AdminShell";

type ReportData = {
  byCategory: { category: string; _count: { _all: number } }[];
  byPriority: { priority: string; _count: { _all: number } }[];
  resolved: number;
};
export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({
    byCategory: [],
    byPriority: [],
    resolved: 0,
  });
  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData);
  }, []);
  const categories = data.byCategory.map((x) => ({
    name: x.category,
    tickets: x._count._all,
  }));
  const priorities = data.byPriority.map((x) => ({
    name: x.priority,
    value: x._count._all,
  }));
  const colors = ["#4d7ef0", "#e7aa4b", "#9b7bed", "#e27c75"];
  return (
    <AdminShell active="Reports">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">
            <BarChart3 size={13} /> Operations reporting
          </span>
          <h1>Maintenance performance</h1>
          <p>Grounded in ticket activity from your MySQL workspace.</p>
        </div>
        <button className="primary-btn" onClick={() => window.print()}>
          Print report
        </button>
      </div>
      <div className="report-grid">
        <section className="admin-card">
          <h2>Tickets by category</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="tickets" fill="#5b83ef" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="admin-card">
          <h2>Priority mix</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={priorities}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {priorities.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="report-stat">
            <b>{data.resolved}</b>
            <span>resolved or closed tickets</span>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
