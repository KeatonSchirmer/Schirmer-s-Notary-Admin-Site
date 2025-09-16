"use client";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import Link from "next/link";

type Finance = {
  id: number;
  type: "profit" | "expense";
  description?: string;
  amount: number;
  date: string;
  job_id?: number;
};

export default function FinancesPage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseType, setExpenseType] = useState<'expense' | 'profit'>('expense');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseJobId, setExpenseJobId] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchFinances() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://schirmer-s-notary-backend.onrender.com/finances/", {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
        });
        if (!res.ok) throw new Error("No transactions found");
        const data = await res.json();
        setFinances(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load finances");
      }
      setLoading(false);
    }
    if (userId) fetchFinances();
  }, [userId]);

  const handleAddExpense = async () => {
    if (!userId) return;
    setAddLoading(true);
    try {
      const res = await fetch('https://schirmer-s-notary-backend.onrender.com/finances/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(userId),
        },
        body: JSON.stringify({
          amount: parseFloat(expenseAmount),
          description: expenseDescription,
          type: expenseType,
          job_id: expenseJobId ? parseInt(expenseJobId) : undefined,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseType('expense');
        setExpenseJobId('');
        const data = await res.json();
        setFinances(Array.isArray(data) ? data : []);
      }
    } catch {
    }
    setAddLoading(false);
  };

  const profits = finances.filter((f) => f.type === "profit");
  const expenses = finances.filter((f) => f.type === "expense");
  const totalProfits = profits.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, f) => sum + f.amount, 0);
  const netIncome = totalProfits - totalExpenses;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Finances Summary", 10, 15);

    doc.setFontSize(12);
    doc.text(`Profits: $${totalProfits.toFixed(2)}`, 10, 25);
    doc.text(`Expenses: $${totalExpenses.toFixed(2)}`, 10, 32);
    doc.text(`Net Income: $${netIncome.toFixed(2)}`, 10, 39);

    doc.text("Transactions:", 10, 49);
    finances.forEach((f, i) => {
      doc.text(
        `${f.date} - ${f.type === "expense" ? "Expense" : "Profit"}${f.job_id ? " (Job #" + f.job_id + ")" : ""} - $${f.amount.toFixed(2)}${f.description ? " - " + f.description : ""}`,
        10,
        55 + i * 8
      );
    });

    doc.save("finances.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Finances</h1>
      <div className="flex gap-4 mb-6">
        <button
          className="bg-green-600 text-white px-6 py-4 rounded-full shadow-lg"
          style={{ boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}
          onClick={() => setShowExpenseModal(true)}
        >
          + Add Transaction
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg"
          style={{ boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>
      {showExpenseModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-2xl shadow w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
            <div className="mb-2">
              <label className="block text-sm mb-1">Type</label>
              <select value={expenseType} onChange={e => setExpenseType(e.target.value as 'expense' | 'profit')} className="w-full p-2 border rounded">
                <option value="expense">Expense</option>
                <option value="profit">Profit</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Amount</label>
              <input value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full p-2 border rounded" placeholder="Amount" type="number" />
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Description</label>
              <input value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full p-2 border rounded" placeholder="Description (optional)" />
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Job ID (optional)</label>
              <input value={expenseJobId} onChange={e => setExpenseJobId(e.target.value)} className="w-full p-2 border rounded" placeholder="Job ID" type="number" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddExpense} disabled={addLoading} className="bg-green-600 text-white px-4 py-2 rounded font-semibold">
                {addLoading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowExpenseModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-sm text-gray-500">Profits</p>
          <p className="text-xl font-semibold text-green-600">
            ${totalProfits.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-sm text-gray-500">Expenses</p>
          <p className="text-xl font-semibold text-red-600">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-sm text-gray-500">Net Income</p>
          <p
            className={`text-xl font-semibold ${
              netIncome >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${netIncome.toFixed(2)}
          </p>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : finances.length === 0 ? (
        <p className="text-gray-500">No financial records found.</p>
      ) : (
        <div className="space-y-4">
          {finances.map((f) => (
            <Link
              key={f.id}
              href={`/finances/${f.id}`}
              className="block bg-white p-4 rounded-2xl shadow hover:bg-blue-50 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {f.type === "expense" ? "Expense" : "Profit"}
                    {f.job_id ? ` (Job #${f.job_id})` : ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    {f.date}
                    {f.description && ` • ${f.description}`}
                  </p>
                </div>
                <p
                  className={`font-bold ${
                    f.type === "expense" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {f.type === "expense" ? "-" : "+"}${f.amount.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}