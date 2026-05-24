import './globals.css'
"use client";
import React, { useState } from 'react';
import ChessBoard from '../lib/components/ChessBoard';
import repertoire from '../lib/engine/repertoire.json';

export default function Page() {
  const names = Object.keys(repertoire);
  const [mode, setMode] = useState('learn');
  const [opening, setOpening] = useState(names[0]);
  const [engine, setEngine] = useState(null);
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [showSM2, setShowSM2] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  function handleEngineReady(e) { setEngine(e); }
  function handleHistoryUpdate(h) { setHistory(h || []); }

  function handleDone() {
    setDone(true);
    setShowSM2(true);
  }

  function handleRating(r) {
    if (engine) {
      engine.reviewPerformance(r);
      engine.reset();
    }
    setShowSM2(false);
    setDone(false);
    setHistory([]);
    // trigger board remount to show reset position
    setReloadKey(k=>k+1);
  }

  return (
    <main className="min-h-screen p-6 bg-charcoal-900 text-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
        <header className="col-span-3 flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-emerald-neon">Chessreps — Antigravity</h1>
            <div className="ml-4">
              <select value={opening} onChange={(e)=>setOpening(e.target.value)} className="bg-slate-700 text-sm rounded px-3 py-1">
                {names.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={()=>setMode('learn')} className={`px-3 py-1 rounded ${mode==='learn' ? 'bg-emerald-neon text-black' : 'bg-slate-700'}`}>Learn</button>
            <button onClick={()=>setMode('practice')} className={`px-3 py-1 rounded ${mode==='practice' ? 'bg-emerald-neon text-black' : 'bg-slate-700'}`}>Practice</button>
          </div>
        </header>

        <section className="col-span-2 flex items-center justify-center">
          <div className="card p-4 flex items-center justify-center">
            <ChessBoard key={reloadKey} opening={opening} mode={mode} onDone={handleDone} onEngineReady={handleEngineReady} onHistoryUpdate={handleHistoryUpdate} />
          </div>
        </section>

        <aside className="col-span-1 card p-4">
          <h2 className="text-lg font-medium mb-2">Move History</h2>
          <ol className="space-y-2 max-h-[60vh] overflow-auto">
            {history.length === 0 && <li className="text-sm text-gray-400">No moves yet</li>}
            {history.map((h,i)=> (
              <li key={i} className="text-sm">
                <span className="font-semibold text-emerald-neon">{h.san}</span>
                <div className="text-xs text-gray-300">{h.explanation}</div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {showSM2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="card p-6 w-[420px]">
            <h3 className="text-xl mb-3">Rate your recall (SM-2)</h3>
            <div className="flex gap-2">
              {[0,1,2,3,4,5].map(n => (
                <button key={n} onClick={()=>handleRating(n)} className="flex-1 py-2 rounded bg-slate-700 hover:bg-slate-600">{n}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
    </div>
  );
}
