import { useState, useMemo } from "react";
import hudData from "../assets/hudsjukdomar.json";

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const KATEGORIER = [
  "Alla",
  ...Array.from(new Set(hudData.map((d) => d.kategori))),
];

const SECTION_LABELS = {
  info:       { label: "Info",       color: "text-sky-700",    bg: "bg-sky-50",    border: "border-sky-200"    },
  symptom:    { label: "Symptom",    color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  },
  diagnostik: { label: "Diagnostik", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  behandling: { label: "Behandling", color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200"},
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Render a single item which is either a string or {text, note} or {heading, items[]} */
function BulletItem({ item, depth = 0 }) {
  if (typeof item === "string") {
    return (
      <li className={`flex gap-2 items-start ${depth > 0 ? "ml-4" : ""}`}>
        <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />
        <span className="text-zinc-700 text-sm leading-snug">{item}</span>
      </li>
    );
  }

  if (item && typeof item === "object" && "heading" in item) {
    return (
      <li className={depth > 0 ? "ml-4" : ""}>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-2 mb-1">
          {item.heading}
        </p>
        <ul className="space-y-1">
          {(item.items || []).map((sub, i) => (
            <BulletItem key={i} item={sub} depth={depth + 1} />
          ))}
        </ul>
      </li>
    );
  }

  if (item && typeof item === "object" && "text" in item) {
    return (
      <li className={`flex gap-2 items-start ${depth > 0 ? "ml-4" : ""}`}>
        <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />
        <span className="text-sm leading-snug">
          <span className="text-zinc-700">{item.text}</span>
          {item.note && (
            <span className="ml-1.5 text-zinc-400 italic text-xs">— {item.note}</span>
          )}
        </span>
      </li>
    );
  }

  return null;
}

function SectionBlock({ sectionKey, items }) {
  const cfg = SECTION_LABELS[sectionKey];
  if (!items || items.length === 0) return null;
  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2.5`}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${cfg.color}`}>
        {cfg.label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <BulletItem key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}

function DiagnosCard({ diag }) {
  const [open, setOpen] = useState(false);
  const hasSections =
    diag.info?.length || diag.symptom?.length ||
    diag.diagnostik?.length || diag.behandling?.length;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <button
        onClick={() => hasSections && setOpen((o) => !o)}
        className={`w-full flex items-start justify-between gap-3 px-5 py-4 text-left transition-colors ${
          hasSections ? "hover:bg-zinc-50 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-zinc-900 text-sm leading-snug">
              {diag.diagnos}
            </span>
            <span className="text-xs text-zinc-400 font-normal">{diag.kategori}</span>
          </div>
          {/* Preview: first info item */}
          {!open && diag.info?.[0] && (
            <p className="text-xs text-zinc-400 truncate mt-0.5 leading-snug">
              {typeof diag.info[0] === "string"
                ? diag.info[0]
                : diag.info[0].text ?? ""}
            </p>
          )}
        </div>
        {hasSections && (
          <svg
            className={`w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-2.5">
          {["info", "symptom", "diagnostik", "behandling"].map((sec) => (
            <SectionBlock key={sec} sectionKey={sec} items={diag[sec]} />
          ))}
          {diag.kommentar && (
            <p className="text-xs text-zinc-400 italic px-1">{diag.kommentar}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────
export default function Hud() {
  const [search, setSearch]       = useState("");
  const [activeKat, setActiveKat] = useState("Alla");
  const [activeKurs, setActiveKurs] = useState("Alla");

  // Derive unique categories from data
  const kursKategorier = useMemo(() => {
    return ["Alla", ...Array.from(new Set(hudData.map((d) => d.kategori)))];
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const matchesSearch = (diag) => {
      if (!q) return true;
      const texts = [
        diag.diagnos,
        diag.kategori,
        ...flattenItems(diag.info),
        ...flattenItems(diag.symptom),
        ...flattenItems(diag.diagnostik),
        ...flattenItems(diag.behandling),
        diag.kommentar,
      ].join(" ").toLowerCase();
      return texts.includes(q);
    };

    return hudData.filter((d) => {
      if (activeKat !== "Alla" && d.kategori !== activeKat) return false;
      return matchesSearch(d);
    });
  }, [search, activeKat]);

  // Group by kategori for display
  const grouped = useMemo(() => {
    const map = new Map();
    for (const d of filtered) {
      if (!map.has(d.kategori)) map.set(d.kategori, []);
      map.get(d.kategori).push(d);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            Hudkursen
          </p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
            Hudsjukdomar
          </h1>
          <p className="text-sm text-zinc-500">
            {hudData.length} diagnoser · {kursKategorier.length - 1} kategorier
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            placeholder="Sök diagnos, symptom, läkemedel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition text-zinc-800 placeholder:text-zinc-400"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {kursKategorier.map((k) => (
            <button
              key={k}
              onClick={() => setActiveKat(k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                activeKat === k
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="text-xs text-zinc-400">
          {filtered.length} av {hudData.length} diagnoser visas
        </p>

        {/* Grouped results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">
            Inga resultat – prova en annan sökning
          </div>
        ) : (
          Array.from(grouped.entries()).map(([cat, diags]) => (
            <section key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 mt-4 px-1">
                {cat}
                <span className="ml-2 font-normal normal-case tracking-normal text-zinc-300">
                  {diags.length} diagnoser
                </span>
              </h2>
              <div className="space-y-2">
                {diags.map((d) => (
                  <DiagnosCard key={d.id} diag={d} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

// ── util: flatten all text from items array for search ──────────────────────
function flattenItems(items) {
  if (!items) return [];
  const out = [];
  for (const item of items) {
    if (typeof item === "string") out.push(item);
    else if (item?.text) out.push(item.text);
    else if (item?.heading) out.push(item.heading);
    if (item?.items) out.push(...flattenItems(item.items));
  }
  return out;
}
