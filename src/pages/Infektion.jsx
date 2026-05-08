import { useState, useMemo } from "react";
import infektionData from "../assets/infektion.json";

const KATEGORIER = ["Alla", "Bakteriell", "Viral", "Svamp", "Parasit/mask"];

const KATEGORI_STYLES = {
  Bakteriell:   { pill: "bg-sky-100 text-sky-800",     dot: "bg-sky-500" },
  Viral:        { pill: "bg-amber-100 text-amber-800",  dot: "bg-amber-500" },
  Svamp:        { pill: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  "Parasit/mask": { pill: "bg-rose-100 text-rose-800",   dot: "bg-rose-500" },
};

export default function Infektion() {
  const [search, setSearch]       = useState("");
  const [activeKat, setActiveKat] = useState("Alla");
  const [expanded, setExpanded]   = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return infektionData.filter((row) => {
      const matchKat = activeKat === "Alla" || row.kategori === activeKat;
      if (!matchKat) return false;
      if (!q) return true;
      return (
        row.diagnos.toLowerCase().includes(q) ||
        row.behandling.some((b) => b.toLowerCase().includes(q)) ||
        row.kommentar.toLowerCase().includes(q)
      );
    });
  }, [search, activeKat]);

  const toggleRow = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            Infektionskursen
          </p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
            Behandlingsöversikt
          </h1>
          <p className="text-sm text-zinc-500">
            {infektionData.length} diagnoser · Antibiotika, antivirala, antiparasitära medel
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              placeholder="Sök diagnos, läkemedel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition text-zinc-800 placeholder:text-zinc-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {KATEGORIER.map((k) => (
              <button
                key={k}
                onClick={() => setActiveKat(k)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  activeKat === k
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {k !== "Alla" && (
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 ${
                      KATEGORI_STYLES[k]?.dot ?? "bg-zinc-400"
                    }`}
                  />
                )}
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <p className="text-xs text-zinc-400">
          {filtered.length} av {infektionData.length} diagnoser visas
        </p>

        {/* Table – desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 w-52">
                  Diagnos
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 w-28">
                  Typ
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">
                  Behandling
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 w-64">
                  Kommentar
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-zinc-400 text-sm">
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
                    <td className="px-5 py-4 font-semibold text-zinc-900 align-top">
                      {row.diagnos}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                          KATEGORI_STYLES[row.kategori]?.pill ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            KATEGORI_STYLES[row.kategori]?.dot ?? "bg-zinc-400"
                          }`}
                        />
                        {row.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ul className="space-y-1">
                        {row.behandling.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-zinc-700">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-zinc-500 leading-relaxed">
                      {row.kommentar || (
                        <span className="text-zinc-300">—</span>
                      )}
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
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${
                          KATEGORI_STYLES[row.kategori]?.pill ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            KATEGORI_STYLES[row.kategori]?.dot ?? "bg-zinc-400"
                          }`}
                        />
                        {row.kategori}
                      </span>
                      <span className="font-semibold text-zinc-900 text-sm truncate">
                        {row.diagnos}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-zinc-400 flex-shrink-0 ml-2 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Behandling
                        </p>
                        <ul className="space-y-1">
                          {row.behandling.map((b, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-zinc-700">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {row.kommentar && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                            Kommentar
                          </p>
                          <p className="text-xs text-zinc-500 leading-relaxed">{row.kommentar}</p>
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
