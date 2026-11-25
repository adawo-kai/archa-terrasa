"use client";

import dynamic from "next/dynamic";

// Виджет зависит от текущего времени (Бишкек), поэтому рисуется только в браузере — не на этапе сборки
const Booking = dynamic(() => import("./Booking"), {
  ssr: false,
  loading: () => <div className="h-[640px] animate-pulse border border-line bg-ink-2" />,
});

export default function BookingClient() {
  return <Booking />;
}
