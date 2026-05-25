"use client";

import { useState } from "react";
import type { Event } from "@/types/ticket";

// ─── Replace this with your Formspree form ID after creating a form at formspree.io ───
const FORMSPREE_ID = "YOUR_FORM_ID";

interface Props {
  event: Event;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function PriceAlert({ event }: Props) {
  const [email,       setEmail]       = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [tickets,     setTickets]     = useState("2");
  const [status,      setStatus]      = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          target_price: `$${targetPrice}`,
          tickets,
          event:  event.artist,
          venue:  event.venue,
          date:   event.date,
          time:   event.time,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-[#0f172a] rounded-xl border border-white/10 shadow-lg p-5 mb-4">

      {/* ── Header ── */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4.5 h-4.5 text-slate-300" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h2 className="text-white font-bold text-base leading-tight">Get a Price Alert</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            We&apos;ll notify you when tickets drop to your target price.
          </p>
        </div>
      </div>

      {/* ── Success state ── */}
      {status === "success" ? (
        <div className="flex items-center gap-3 bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-4">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-green-300 font-semibold text-sm">Alert set!</p>
            <p className="text-slate-400 text-xs mt-0.5">
              We&apos;ll email you at <span className="text-slate-300">{email}</span> when prices hit your target.
            </p>
          </div>
        </div>
      ) : (
        /* ── Form ── */
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Row 1: Email (full width) */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/[0.06] border border-white/[0.12] text-white placeholder-slate-600
                         rounded-lg px-3 py-2.5 text-sm outline-none
                         focus:border-white/30 focus:ring-2 focus:ring-white/10 transition"
            />
          </div>

          {/* Row 2: Target price + Ticket count side by side */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Target Price (all-in)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="150"
                  className="w-full bg-white/[0.06] border border-white/[0.12] text-white placeholder-slate-600
                             rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none
                             focus:border-white/30 focus:ring-2 focus:ring-white/10 transition"
                />
              </div>
            </div>

            <div className="w-32">
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                # of Tickets
              </label>
              <select
                value={tickets}
                onChange={(e) => setTickets(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.12] text-white
                           rounded-lg px-3 py-2.5 text-sm outline-none appearance-none cursor-pointer
                           focus:border-white/30 focus:ring-2 focus:ring-white/10 transition"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n} className="bg-slate-900">{n} ticket{n !== 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error message */}
          {status === "error" && (
            <p className="text-red-400 text-xs">
              Something went wrong. Please try again.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed
                       text-gray-900 font-semibold text-sm rounded-lg py-2.5 transition-colors mt-1
                       flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Setting alert…
              </>
            ) : (
              "Set Price Alert"
            )}
          </button>

          <p className="text-slate-600 text-xs text-center">
            No account needed · Unsubscribe any time
          </p>
        </form>
      )}
    </div>
  );
}
