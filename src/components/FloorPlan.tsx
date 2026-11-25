"use client";

import { HALLS, seatsWord, type Hall, type TableRow } from "@/lib/rules";

export type TableState = "free" | "selected" | "taken" | "unfit" | "off" | "neutral";

const DECOR: Record<Hall, { top: string; bottom: string }> = {
  main: { top: "Камин · открытая кухня", bottom: "Окна на Токтогула" },
  terrace: { top: "Вход из основного зала", bottom: "Вид на хребет Ала-Тоо" },
  vip: { top: "Отдельный вход", bottom: "Окно во двор" },
};

function size(seats: number) {
  if (seats <= 2) return { w: 46, h: 46, round: true };
  if (seats <= 4) return { w: 62, h: 62, round: false };
  if (seats <= 6) return { w: 96, h: 58, round: false };
  return { w: 74 + seats * 12, h: 62, round: false };
}

/** Раскладка: столики зала по номеру, сеткой. Новые столики из админки встают автоматически. */
function layout(tables: TableRow[]) {
  const cols = tables.length <= 2 ? tables.length : tables.length <= 4 ? 2 : 3;
  const maxW = Math.max(0, ...tables.map((t) => size(t.seats).w));
  const cellW = Math.max(170, maxW + 60), cellH = 128;
  return {
    width: Math.max(cols, 1) * cellW,
    height: Math.ceil(tables.length / Math.max(cols, 1)) * cellH,
    items: tables.map((t, i) => ({ t, cx: (i % cols) * cellW + cellW / 2, cy: Math.floor(i / cols) * cellH + cellH / 2 })),
  };
}

function Chairs({ w, h, seats, round }: { w: number; h: number; seats: number; round: boolean }) {
  const out: { x: number; y: number }[] = [];
  if (round) {
    for (let i = 0; i < seats; i++) {
      const a = (i / seats) * Math.PI * 2 - Math.PI / 2;
      out.push({ x: Math.cos(a) * (w / 2 + 9), y: Math.sin(a) * (h / 2 + 9) });
    }
  } else if (seats <= 4) {
    const pos = [[0, -1], [0, 1], [-1, 0], [1, 0]].slice(0, seats);
    pos.forEach(([dx, dy]) => out.push({ x: dx * (w / 2 + 9), y: dy * (h / 2 + 9) }));
  } else {
    const perSide = Math.ceil(seats / 2);
    for (let i = 0; i < seats; i++) {
      const side = i < perSide ? -1 : 1;
      const k = i < perSide ? i : i - perSide;
      const n = i < perSide ? perSide : seats - perSide;
      out.push({ x: -w / 2 + ((k + 0.5) * w) / n, y: side * (h / 2 + 9) });
    }
  }
  return (
    <>
      {out.map((c, i) => (
        <rect key={i} x={c.x - 6} y={c.y - 4.5} width={12} height={9} rx={3} className="fill-current opacity-60" />
      ))}
    </>
  );
}

export default function FloorPlan({
  hall,
  tables,
  stateOf,
  onPick,
  caption,
}: {
  hall: Hall;
  tables: TableRow[];
  stateOf: (t: TableRow) => TableState;
  onPick?: (t: TableRow) => void;
  caption?: (t: TableRow) => string;
}) {
  const list = tables.filter((t) => t.hall === hall).sort((a, b) => a.number - b.number);
  const L = layout(list);
  const pad = 34;
  const W = L.width, H = L.height + pad * 2;

  if (!list.length) return <p className="label py-10 text-center text-paper-faint">В зале нет столиков</p>;

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label={`План: ${HALLS[hall].title}`}>
        <defs>
          <pattern id={`hatch-${hall}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
          </pattern>
        </defs>
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="var(--line-strong)" strokeDasharray="2 5" />
        <text x={W / 2} y={18} textAnchor="middle" className="fill-paper-faint font-mono text-[9px] uppercase tracking-[0.12em]">
          {DECOR[hall].top}
        </text>
        <text x={W / 2} y={H - 10} textAnchor="middle" className="fill-paper-faint font-mono text-[9px] uppercase tracking-[0.12em]">
          {DECOR[hall].bottom}
        </text>
        <g transform={`translate(0 ${pad})`}>
          {L.items.map(({ t, cx, cy }) => {
            const s = stateOf(t);
            const { w, h, round } = size(t.seats);
            const clickable = !!onPick && (s === "free" || s === "selected" || s === "neutral" || s === "off");
            const color =
              s === "selected" ? "text-brass" : s === "free" ? "text-paper" : s === "taken" ? "text-ember/70" : s === "neutral" ? "text-paper/80" : "text-paper/25";
            const label = caption ? caption(t) : `Столик №${t.number}, ${t.seats} ${seatsWord(t.seats)}`;
            return (
              <g
                key={t.id}
                transform={`translate(${cx} ${cy})`}
                className={`${color} outline-none transition-colors duration-300 ${clickable ? "cursor-pointer [&:hover_.tbl]:stroke-brass [&:focus-visible_.tbl]:stroke-brass" : ""}`}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-pressed={clickable ? s === "selected" : undefined}
                aria-label={label}
                onClick={clickable ? () => onPick!(t) : undefined}
                onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick!(t)) : undefined}
              >
                <title>{label}</title>
                <rect x={-w / 2 - 22} y={-h / 2 - 22} width={w + 44} height={h + 44} fill="transparent" />
                <Chairs w={w} h={h} seats={t.seats} round={round} />
                {round ? (
                  <circle
                    r={w / 2}
                    className="tbl"
                    fill={s === "selected" ? "currentColor" : s === "taken" ? `url(#hatch-${hall})` : "var(--ink-2)"}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray={s === "off" ? "3 3" : undefined}
                  />
                ) : (
                  <rect
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx="4"
                    className="tbl"
                    fill={s === "selected" ? "currentColor" : s === "taken" ? `url(#hatch-${hall})` : "var(--ink-2)"}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray={s === "off" ? "3 3" : undefined}
                  />
                )}
                <text y="-1" textAnchor="middle" style={{ fontVariantNumeric: "lining-nums" }} className={`font-serif text-[19px] ${s === "selected" ? "fill-ink" : "fill-current"}`}>
                  {t.number}
                </text>
                <text y="13" textAnchor="middle" className={`font-mono text-[8px] uppercase tracking-wider ${s === "selected" ? "fill-ink" : "fill-current opacity-70"}`}>
                  {t.seats} м.
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </figure>
  );
}

export function Legend({ items }: { items: [TableState, string][] }) {
  const sw: Record<TableState, string> = {
    free: "border-paper bg-ink-2",
    selected: "border-brass bg-brass",
    taken: "border-ember/70 bg-[repeating-linear-gradient(45deg,rgba(224,112,60,0.45)_0_1px,transparent_1px_4px)]",
    unfit: "border-paper/25 bg-ink-2",
    off: "border-dashed border-paper/40 bg-ink-2",
    neutral: "border-paper/80 bg-ink-2",
  };
  return (
    <ul className="label flex flex-wrap gap-x-5 gap-y-2 text-paper-faint">
      {items.map(([s, l]) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-[2px] border ${sw[s]}`} />
          {l}
        </li>
      ))}
    </ul>
  );
}
