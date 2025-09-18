"use client";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useParams } from "next/navigation";

type Finance = {
  id: number;
  type: "profit" | "expense";
  description?: string;
  amount: number;
  date: string;
  job_id?: number;
  pdfs?: { id: number; filename: string; url: string }[];
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";

export default function FinanceDetailPage() {
  const params = useParams();
  const financeId = params?.id;
  const [finance, setFinance] = useState<Finance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Omit<Finance, "id" | "pdfs">>({
    type: "expense",
    description: "",
    amount: 0,
    date: "",
    job_id: undefined,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    async function fetchFinance() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/finances/${financeId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setFinance(data.finance || null);
        setForm({
          type: data.finance?.type || "expense",
          description: data.finance?.description || "",
          amount: Number(data.finance?.amount) || 0,
          date: data.finance?.date?.slice(0, 10) || "",
          job_id: data.finance?.job_id,
        });
      } catch {
        setError("Failed to load transaction.");
      }
      setLoading(false);
    }
    if (financeId) fetchFinance();
  }, [financeId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/finances/${financeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setFinance(updated.finance || null);
        setEditing(false);
      } else {
        setError("Failed to save changes.");
      }
    } catch {
      setError("Failed to save changes.");
    }
    setLoading(false);
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setUploadingPdf(true);
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    try {
      const res = await fetch(`${API_BASE}/finances/${financeId}/pdf`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Refresh finance to show new PDF
        const updated = await res.json();
        setFinance(updated.finance || null);
        setPdfFile(null);
      }
    } catch {
      setError("Failed to upload PDF.");
    }
    setUploadingPdf(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !finance) return <div className="p-6 text-red-600">{error || "Transaction not found."}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>
      <div className="bg-white p-6 rounded shadow space-y-3">
        {!editing ? (
          <>
            <div>
              <span className="font-semibold">Type:</span> {finance.type === "profit" ? "Profit" : "Expense"}
            </div>
            <div>
              <span className="font-semibold">Amount:</span> ${Number(finance.amount).toFixed(2)}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {finance.date?.slice(0, 10)}
            </div>
            <div>
              <span className="font-semibold">Description:</span> {finance.description}
            </div>
            <div>
              <span className="font-semibold">Job ID:</span> {finance.job_id ?? "N/A"}
            </div>
            <div>
              <span className="font-semibold">PDF Invoices:</span>
              <ul className="list-disc ml-6">
                {finance.pdfs && finance.pdfs.length > 0 ? (
                  finance.pdfs.map((pdf) => (
                    <li key={pdf.id}>
                      <a
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {pdf.filename}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No PDFs uploaded.</li>
                )}
              </ul>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="block mb-2"
                />
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={handlePdfUpload}
                  disabled={uploadingPdf || !pdfFile}
                >
                  {uploadingPdf ? "Uploading..." : "Upload PDF"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block font-semibold mb-1">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="expense">Expense</option>
                <option value="profit">Profit</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Description"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Job ID</label>
              <input
                type="number"
                name="job_id"
                value={form.job_id ?? ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Job ID"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}