import { useState, useMemo } from "react";
import km1Data from "../assets/km1.json";

const KATEGORI_LABELS = {
  alla: "Alla",
  njure: "Njure",
  reuma: "Reuma",
  kardio: "Kardiologi",
  endokrin: "Endokrin",
  lungor: "Lungor",
  hematologi: "Hematologi",
  neurologi: "Neurologi",
  infektion: "Infektion",
  allmant: "Allmänt",
};

const KATEGORI_STYLES = {
  njure:       { pill: "bg-sky-100 text-sky-800",        dot: "bg-sky-500" },
  reuma:       { pill: "bg-rose-100 text-rose-800",      dot: "bg-rose-500" },
  kardio:      { pill: "bg-red-100 text-red-800",        dot: "bg-red-500" },
  endokrin:    { pill: "bg-amber-100 text-amber-800",    dot: "bg-amber-500" },
  lungor:      { pill: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  hematologi:  { pill: "bg-purple-100 text-purple-800",  dot: "bg-purple-500" },
  neurologi:   { pill: "bg-indigo-100 text-indigo-800",  dot: "bg-indigo-500" },
  infektion:   { pill: "bg-orange-100 text-orange-800",  dot: "bg-orange-500" },
  allmant:     { pill: "bg-zinc-100 text-zinc-700",      dot: "bg-zinc-400" },
};

const PUNKTTYPER = ["alla", "klinik", "diagnos", "lab", "behandling", "varning", "komihag"];

const PUNKTTYP_LABELS = {
  alla: "Alla punkter",
  klinik: "Klinik",
  diagnos: "Diagnos",
  lab: "Lab/prov",
  behandling: "Behandling",
  varning: "Varning",
  komihag: "Kom ihåg",
};

const PUNKTTYP_STYLES = {
  klinik:     "bg-amber-50 text-amber-800 border-amber-200",
  diagnos:   "bg-sky-50 text-sky-800 border-sky-200",
  lab:       "bg-violet-50 text-violet-800 border-violet-200",
  behandling:"bg-emerald-50 text-emerald-800 border-emerald-200",
  varning:   "bg-red-50 text-red-800 border-red-200",
  komihag:   "bg-zinc-50 text-zinc-700 border-zinc-200",
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function entryText(row) {
  return [
    row.title,
    row.summary,
    KATEGORI_LABELS[row.category],
    row.tags?.join(" "),
    ...(row.points || []).flatMap((p) => [p.type, PUNKTTYP_LABELS[p.type], p.label, p.text]),
  ]
    .filter(Boolean)
    .join(" ");
}

function categoryLabel(category) {
  return KATEGORI_LABELS[category] || category;
}

function CategoryPill({ category, small = false }) {
  const style = KATEGORI_STYLES[category] || KATEGORI_STYLES.allmant;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md ${style.pill} ${
        small ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-1"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {categoryLabel(category)}
    </span>
  );
}

function PointItem({ point }) {
  return (
    <li className="flex items-start gap-2 text-zinc-700">
      <span className="mt-1.5 text-zinc-300 flex-shrink-0">→</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${
              PUNKTTYP_STYLES[point.type] ?? PUNKTTYP_STYLES.komihag
            }`}
          >
            {PUNKTTYP_LABELS[point.type] || "Punkt"}
          </span>
          {point.label && <span className="font-semibold text-zinc-800">{point.label}</span>}
        </div>
        <p className="mt-0.5 leading-relaxed">{point.text}</p>
      </div>
    </li>
  );
}

function PointList({ points }) {
  return (
    <ul className="space-y-2">
      {(points || []).map((point, index) => (
        <PointItem key={index} point={point} />
      ))}
    </ul>
  );
}

export default function KM1() {
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState("alla");
  const [activeTypes, setActiveTypes] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const kategorier = useMemo(() => {
    const unique = [...new Set(km1Data.map((row) => row.category))];
    return ["alla", ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    const hasTypeFilter = activeTypes.length > 0;

    return km1Data
      .map((row) => {
        const matchKat = activeKat === "alla" || row.category === activeKat;
        if (!matchKat) return null;

        const visiblePoints = hasTypeFilter
          ? (row.points || []).filter((point) => activeTypes.includes(point.type))
          : row.points || [];

        if (hasTypeFilter && visiblePoints.length === 0) return null;

        if (q && !normalize(entryText(row)).includes(q)) return null;

        return { ...row, visiblePoints };
      })
      .filter(Boolean);
  }, [search, activeKat, activeTypes]);

  const togglePointType = (type) => {
    if (type === "alla") {
      setActiveTypes([]);
      return;
    }

    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const toggleRow = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            KM1
          </p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
            Internmedicin – snabböversikt
          </h1>
          <p className="text-sm text-zinc-500">
            {km1Data.length} ämneskort · njure, reuma, kardiologi, lungor, endokrinologi och hematologi
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* Search + category filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Sök t.ex. RAAS, synkope, GCA, troponin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition text-zinc-800 placeholder:text-zinc-400"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveKat("alla");
                setActiveTypes([]);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg border bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all"
            >
              Rensa filter
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {kategorier.map((k) => (
              <button
                key={k}
                onClick={() => setActiveKat(k)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  activeKat === k
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {k !== "alla" && (
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 ${
                      KATEGORI_STYLES[k]?.dot ?? "bg-zinc-400"
                    }`}
                  />
                )}
                {k === "alla" ? "Alla" : categoryLabel(k)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {PUNKTTYPER.map((t) => (
              <button
                key={t}
                onClick={() => togglePointType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  (t === "alla" ? activeTypes.length === 0 : activeTypes.includes(t))
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {PUNKTTYP_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <p className="text-xs text-zinc-400">
          {filtered.length} av {km1Data.length} ämneskort visas
          {activeTypes.length > 0 && ` · endast ${activeTypes.map((t) => PUNKTTYP_LABELS[t]).join(", ").toLowerCase()}`}
        </p>

        {/* Table – desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 w-64">
                  Ämne
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 w-36">
                  Kategori
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">
                  Punkter
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-zinc-400 text-sm">
                    Inga resultat – prova en annan sökning
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors ${
                      i % 2 === 0 ? "" : "bg-zinc-50/30"
                    }`}
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-zinc-900">{row.title}</p>
                      {row.summary && (
                        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{row.summary}</p>
                      )}
                      {!!row.tags?.length && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {row.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="text-[11px] text-zinc-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <CategoryPill category={row.category} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <PointList points={row.visiblePoints} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards – mobile */}
        <div className="md:hidden space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              Inga resultat – prova en annan sökning
            </div>
          ) : (
            filtered.map((row) => {
              const isOpen = expanded === row.id;
              return (
                <button
                  key={row.id}
                  onClick={() => toggleRow(row.id)}
                  className="w-full text-left bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryPill category={row.category} small />
                      <span className="font-semibold text-zinc-900 text-sm truncate">
                        {row.title}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-zinc-400 flex-shrink-0 ml-2 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-3">
                      {row.summary && (
                        <p className="text-xs text-zinc-500 leading-relaxed">{row.summary}</p>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Punkter
                        </p>
                        <PointList points={row.visiblePoints} />
                      </div>


                      {!!row.tags?.length && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
