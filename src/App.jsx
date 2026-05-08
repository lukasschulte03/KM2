import { useNavigate } from "react-router";

const AMNEN = [
	{
		id: "infektion",
		titel: "Infektioner",
		beskrivning: "Behandlingar, antibiotika & antivirala medel",
		path: "/infektion",
		emoji: "🦠",
		aktiv: true,
	},
	{
		id: "km1",
		titel: "KM1",
		beskrivning: "Internmedicin repetition",
		path: "/km1",
		emoji: "📚",
		aktiv: true,
	},
];

export default function App() {
  const navigate = useNavigate();

  return (
		<div className="min-h-screen bg-zinc-50 flex flex-col">
			<div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
				<div className="w-full max-w-lg">
					<p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1 text-center">Medicin</p>
					<h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2 text-center">Studieöversikt KM2</h1>
					<p className="text-sm text-zinc-500 text-center mb-10">Välj ett ämne för att komma igång</p>

					<div className="space-y-3">
						{AMNEN.map((amne) => (
							<button
								key={amne.id}
								onClick={() => amne.aktiv && navigate(amne.path)}
								disabled={!amne.aktiv}
								className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
									amne.aktiv
										? "bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-sm cursor-pointer"
										: "bg-zinc-100 border-zinc-200 opacity-50 cursor-not-allowed"
								}`}>
								<span className="text-2xl">{amne.emoji}</span>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-zinc-900 text-sm">{amne.titel}</p>
									<p className="text-xs text-zinc-500 truncate">{amne.beskrivning}</p>
								</div>
								{amne.aktiv ? (
									<svg
										className="w-4 h-4 text-zinc-400 flex-shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								) : (
									<span className="text-xs text-zinc-400 flex-shrink-0">Kommer snart</span>
								)}
							</button>
						))}
					</div>
				</div>
			</div>

			<p className="text-center text-xs text-zinc-300 pb-6">
				{AMNEN.filter((a) => a.aktiv).length} av {AMNEN.length} ämnen tillgängliga
			</p>
		</div>
  );
}
