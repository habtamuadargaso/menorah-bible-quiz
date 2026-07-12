"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  const [status, setStatus] = useState("Testing Supabase connection...");

  useEffect(() => {
    async function test() {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      setStatus(error ? `Connected, but query returned: ${error.message}` : "Supabase Connected 🚀");
    }
    test();
  }, []);

  return <main className="grid min-h-screen place-items-center"><h1>{status}</h1></main>;
}
