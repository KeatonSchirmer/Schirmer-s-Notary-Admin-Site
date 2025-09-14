"use client";
import dynamic from "next/dynamic";

const CalendarClient = dynamic(() => import("./CalendarClient"), { ssr: false });

export default function Page() {
  return <CalendarClient />;
}