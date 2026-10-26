import { TourMap } from './map/TourMap';

export default function App() {
  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold">TSP Algoritma Görselleştirici</h1>
      </header>
      <main className="flex min-h-0 flex-1">
        {/* src/ui: kontrol paneli (UI ajanı, Faz 1) */}
        <section className="min-w-0 flex-1">
          <TourMap points={[]} />
        </section>
      </main>
    </div>
  );
}
