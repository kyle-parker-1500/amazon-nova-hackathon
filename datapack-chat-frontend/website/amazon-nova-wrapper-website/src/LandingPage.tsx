interface LandingPageProps {
  onLaunch: () => void;
}

const STEPS = [
  {
    label: "01",
    title: "Describe your idea",
    body: "Tell the copilot what you want your datapack to do in plain English.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: "02",
    title: "Nova generates code",
    body: "Amazon Nova crafts the datapack files — JSON, mcfunction, and pack.mcmeta.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    label: "03",
    title: "Validate & download",
    body: "The built-in validator checks your pack before you drop it into your world.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

// Pixel-art grass block SVG
function GrassBlock() {
  return (
    <svg width="64" height="64" viewBox="0 0 16 16" className="pixelated" style={{ imageRendering: "pixelated" }}>
      {/* dirt */}
      <rect width="16" height="16" fill="#866043" />
      {/* grass top */}
      <rect y="0" width="16" height="4" fill="#5d9e3f" />
      {/* side grass patches */}
      <rect x="0" y="4" width="2" height="2" fill="#5d9e3f" />
      <rect x="5" y="3" width="3" height="2" fill="#5d9e3f" />
      <rect x="11" y="4" width="2" height="2" fill="#5d9e3f" />
      {/* subtle dirt shading */}
      <rect x="0" y="14" width="16" height="2" fill="#6a4d31" />
      <rect x="0" y="6" width="1" height="8" fill="#7a5638" />
      <rect x="15" y="6" width="1" height="8" fill="#9a7048" />
    </svg>
  );
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <GrassBlock />
          <span className="font-mono text-sm font-semibold tracking-widest text-zinc-100 uppercase">
            Datapack Copilot
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-600">powered by Amazon Nova</span>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 gap-8">
        <div className="flex flex-col items-center gap-6 max-w-2xl">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Amazon Nova · Minecraft 1.21
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 leading-tight">
            Build Minecraft datapacks
            <br />
            <span className="text-green-400">in seconds</span>
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
            Describe what you want, and the copilot writes the datapack for you — functions, advancements, loot tables, and more. Powered by{" "}
            <span className="text-zinc-200 font-medium">Amazon Nova</span>.
          </p>

          <button
            onClick={onLaunch}
            className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-zinc-950 font-semibold text-sm transition-colors duration-150 shadow-lg shadow-green-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Launch Copilot
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-mono text-zinc-600 uppercase tracking-widest mb-10">
            How it works
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.label}
                className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono text-zinc-700">{step.label}</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">{step.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture flow */}
      <section className="border-t border-zinc-800 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-mono text-zinc-600 uppercase tracking-widest mb-8">
            Architecture
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            {[
              { label: "Your Idea", color: "text-zinc-300 bg-zinc-800 border-zinc-700" },
              null,
              { label: "Copilot", color: "text-green-300 bg-green-500/10 border-green-500/30" },
              null,
              { label: "Amazon Nova", color: "text-purple-300 bg-purple-500/10 border-purple-500/30" },
              null,
              { label: "Validator", color: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30" },
              null,
              { label: "Datapack", color: "text-blue-300 bg-blue-500/10 border-blue-500/30" },
            ].map((node, i) =>
              node === null ? (
                <svg key={i} className="w-4 h-4 text-zinc-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              ) : (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-lg border ${node.color}`}
                >
                  {node.label}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-5 text-center">
        <p className="text-xs font-mono text-zinc-700">
          Minecraft Datapack Copilot · Amazon Nova Hackathon
        </p>
      </footer>
    </div>
  );
}
