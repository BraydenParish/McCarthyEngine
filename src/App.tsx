import { useState } from 'react';

/**
 * Root application component housing the McCarthy Engine interface.
 * Detailed UI wiring will arrive in subsequent iterations.
 */
export default function App() {
  const [placeholder] = useState('McCarthy Engine UI coming soon');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <header>
          <h1 className="text-3xl font-semibold">McCarthy Engine</h1>
          <p className="mt-2 text-slate-300">
            Neuro-symbolic reasoning playground — UI scaffolding placeholder.
          </p>
        </header>
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-200">{placeholder}</p>
          <p className="mt-2 text-sm text-slate-500">
            Chat input, trace visualisations, and settings will be implemented shortly.
          </p>
        </section>
      </div>
    </main>
  );
}
