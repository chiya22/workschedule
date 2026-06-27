"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shift } from "@/types";

type Options = {
  initialData: Shift[];
};

const SHIFT_COLUMNS =
  "id, staff_name, role, start_at, end_at, created_by, created_at, updated_at" as const;

export function useShiftsRealtime({ initialData }: Options) {
  const [shifts, setShifts] = useState<Shift[]>(initialData);

  useEffect(() => {
    setShifts(initialData);
  }, [initialData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("shifts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shifts" },
        async (payload) => {
          const id = (payload.new as { id: string }).id;
          const { data } = await supabase
            .from("shifts")
            .select(SHIFT_COLUMNS)
            .eq("id", id)
            .single();
          if (data) {
            setShifts((prev) => {
              if (prev.some((s) => s.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shifts" },
        async (payload) => {
          const id = (payload.new as { id: string }).id;
          const { data } = await supabase
            .from("shifts")
            .select(SHIFT_COLUMNS)
            .eq("id", id)
            .single();
          if (data) {
            setShifts((prev) => prev.map((s) => (s.id === data.id ? data : s)));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "shifts" },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setShifts((prev) => prev.filter((s) => s.id !== id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { shifts, setShifts };
}
