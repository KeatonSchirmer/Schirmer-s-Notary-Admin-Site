"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import dynamic from "next/dynamic";

const CalendarClient = dynamic(() => import("./CalendarClient"), { ssr: false });

export default function Page() {
  return (
    <GoogleOAuthProvider clientId="131000715689-16b27f57ks2jvasq3m6tvqkfcmdcjtpu.apps.googleusercontent.com">
      <CalendarClient />
    </GoogleOAuthProvider>
  );
}