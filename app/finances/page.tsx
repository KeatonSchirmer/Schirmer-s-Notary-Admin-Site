"use client";
import React, { useEffect, useState } from "react";

type Finance = {
  id: number;
  type: "earning" | "expense";
  category: string;
  description?: string;
  amount: number;
  date: string;
  created_at: string;
};

export default function FinancesPage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseType, setExpenseType] = useState<'expense' | 'earning'>('expense');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
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
        const res = await fetch("http://localhost:5000/finances/", {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
        });
        if (!res.ok) throw new Error("No transactions found");
        const data = await res.json();
        setFinances(Array.isArray(data) ? data : []);
      } catch (err) {
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
      const res = await fetch('http://localhost:5000/finances/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(userId),
        },
        body: JSON.stringify({
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          description: expenseDescription,
          type: expenseType,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseCategory('');
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseType('expense');
        // Refresh finances
        const data = await res.json();
        setFinances(Array.isArray(data) ? data : []);
      }
    } catch {
      // Optionally show error
    }
    setAddLoading(false);
  };

  const earnings = finances.filter((f) => f.type === "earning");
  const expenses = finances.filter((f) => f.type === "expense");
  const totalEarnings = earnings.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, f) => sum + f.amount, 0);
  const netIncome = totalEarnings - totalExpenses;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Finances</h1>
      <button
        className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-full shadow-lg z-50"
        style={{ boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}
        onClick={() => setShowExpenseModal(true)}
      >
        + Add Expense
      </button>
      {showExpenseModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-2xl shadow w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Expense/Profit</h2>
            <div className="mb-2">
              <label className="block text-sm mb-1">Type</label>
              <select value={expenseType} onChange={e => setExpenseType(e.target.value as 'expense' | 'earning')} className="w-full p-2 border rounded">
                <option value="expense">Expense</option>
                <option value="earning">Profit</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Category</label>
              <input value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="w-full p-2 border rounded" placeholder="Category" />
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Amount</label>
              <input value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full p-2 border rounded" placeholder="Amount" type="number" />
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Description</label>
              <input value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full p-2 border rounded" placeholder="Description (optional)" />
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
      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-sm text-gray-500">Earnings</p>
          <p className="text-xl font-semibold text-green-600">
            ${totalEarnings.toFixed(2)}
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

      {/* Transaction List */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : finances.length === 0 ? (
        <p className="text-gray-500">No financial records found.</p>
      ) : (
        <div className="space-y-4">
          {finances.map((f) => (
            <div
              key={f.id}
              className="bg-white p-4 rounded-2xl shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {f.type === "expense" ? "Expense" : "Earning"} - {f.category}
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
          ))}
        </div>
      )}
    </div>
  );
}