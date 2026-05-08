import { useMemo, useState } from "react";
import km1Data from "../assets/km1.json";

const CATEGORY_STYLES = {
  njure: "bg-sky-50 text-sky-800 ring-sky-200",
  reuma: "bg-rose-50 text-rose-800 ring-rose-200",
  kardio: "bg-red-50 text-red-800 ring-red-200",
  endokrin: "bg-amber-50 text-amber-800 ring-amber-200",
  lungor: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  hematologi: "bg-purple-50 text-purple-800 ring-purple-200",
  neurologi: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  infektion: "bg-orange-50 text-orange-800 ring-orange-200",
  allmant: "bg-slate-50 text-slate-800 ring-slate-200",
};

const TYPE_STYLES = {
  diagnos: "border-blue-200 bg-blue-50 text-blue-900",
  behandling: "border-emerald-200 bg-emerald-50 text-emerald-900",
  varning: "border-red-200 bg-red-50 text-red-900",
  lab: "border-violet-200 bg-violet-50 text-violet-900",
  klinik: "border-amber-200 bg-amber-50 text-amber-900",
  komihag: "border-slate-200 bg-slate-50 text-slate-900",
};

const TYPE_LABELS = {
  diagnos: "Diagnos",
  behandling: "Behandling",
  varning: "Varning",
  lab: "Lab/prov",
  klinik: "Klinik",
  komihag: "Kom ihåg",
};

const CATEGORY_LABELS = {
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

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function flattenText(entry) {
  return [
    entry.title,
    entry.category,
    entry.summary,
    entry.tags?.join(" "),
    ...(entry.points || []).flatMap((point) => [point.label, point.text, point.type]),
  ]
    .filter(Boolean)
    .join(" ");
}

function ArrowPoint({ point }) {
  const typeClass = TYPE_STYLES[point.type] || TYPE_STYLES.komihag;
  const label = TYPE_LABELS[point.type] || "Punkt";

  return (
    <li className="relative pl-9">
      <span className="absolute left-0 top-2 h-px w-6 bg-slate-300" />
      <span className="absolute left-5 top-[3px] text-slate-400">›</span>
      <div className={`rounded-xl border px-3 py-2 ${typeClass}`}>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
            {label}
          </span>
          {point.label && <span className="font-semibold">{point.label}</span>}
        </div>
        <p className="text-sm leading-relaxed">{point.text}</p>
      </div>
    </li>
  );
}

function Km1Card({ entry }) {
  const categoryClass = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.allmant;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${categoryClass}`}>
              {CATEGORY_LABELS[entry.category] || entry.category}
            </span>
            {entry.sourceNote && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {entry.sourceNote}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl">{entry.title}</h2>
          {entry.summary && <p className="mt-1 text-sm text-slate-600">{entry.summary}</p>}
        </div>
      </div>

      <ul className="space-y-3">
        {(entry.points || []).map((point, index) => (
          <ArrowPoint key={`${entry.id}-${index}`} point={point} />
        ))}
      </ul>

      {!!entry.tags?.length && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function KM1() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("alla");
  const [type, setType] = useState("alla");

  const categories = useMemo(() => {
    const unique = [...new Set(km1Data.map((entry) => entry.category))];
    return ["alla", ...unique];
  }, []);

  const types = useMemo(() => {
    const unique = [...new Set(km1Data.flatMap((entry) => entry.points?.map((point) => point.type) || []))];
    return ["alla", ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return km1Data
      .filter((entry) => category === "alla" || entry.category === category)
      .filter((entry) => type === "alla" || entry.points?.some((point) => point.type === type))
      .filter((entry) => !q || normalize(flattenText(entry)).includes(q));
  }, [query, category, type]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">KM1</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Internmedicin – snabböversikt</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Sökbar sammanställning av handskrivna KM1-anteckningar. Varje punkt är separerad och markerad efter typ: klinik, diagnostik, behandling, lab eller varning.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto_auto] sm:p-5">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Sök</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök t.ex. RAAS, synkope, GCA, troponin..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition placeholder:text-slate-400 focus:ring-4"
              />
            </label>

            <label className="block sm:min-w-44">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kategori</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:ring-4"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "alla" ? "Alla kategorier" : CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:min-w-44">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Punkttyp</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300 transition focus:ring-4"
              >
                {types.map((item) => (
                  <option key={item} value={item}>
                    {item === "alla" ? "Alla punkter" : TYPE_LABELS[item] || item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-600">
            Visar <span className="font-black text-slate-950">{filtered.length}</span> av {km1Data.length} ämneskort
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("alla");
              setType("alla");
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Rensa filter
          </button>
        </div>

        {filtered.length > 0 ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {filtered.map((entry) => (
              <Km1Card key={entry.id} entry={entry} />
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Inga träffar</h2>
            <p className="mt-2 text-sm text-slate-600">Testa att söka bredare eller rensa filtren.</p>
          </section>
        )}
      </div>
    </main>
  );
}
