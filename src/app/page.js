"use client";

import './globals.css';
import React, { useState, useEffect } from 'react';
import ChessBoard from '../lib/components/ChessBoard';

export default function Page() {
  const [openings, setOpenings] = useState([]);
  const [mode, setMode] = useState('learn');
  const [opening, setOpening] = useState('');
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [showSM2, setShowSM2] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch openings on mount
  useEffect(() => {
    const fetchOpenings = async () => {
      try {
        const res = await fetch('/api/chess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getOpenings' })
        });
        const data = await res.json();
        setOpenings(data.openings || []);
        if (data.openings && data.openings.length > 0) {
          setOpening(data.openings[0]);
        }
      } catch (err) {
        console.error('Failed to fetch openings:', err);
      }
      setLoading(false);
    };
    fetchOpenings();
  }, []);

  function handleHistoryUpdate(h) { setHistory(h || []); }

  function handleDone() {
    setDone(true);
    setShowSM2(true);
  }

  function handleRating(r) {
    // TODO: Persist SM-2 data to backend/localStorage
    console.log(`Rated ${r}/5 for ${opening}`);
    setShowSM2(false);
    setDone(false);
    setHistory([]);
    setReloadKey(k=>k+1);
  }

  function handleReset() {
    setHistory([]);
    setDone(false);
    setShowSM2(false);
    setReloadKey(k=>k+1);
  }

  if (loading) {
    return <main className="min-h-screen p-6 bg-charcoal-900 text-gray-100 flex items-center justify-center">
      <div>Loading openings...</div>
    </main>;
  }

  return (
    <main className="min-h-screen p-6 bg-charcoal-900 text-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
        <header className="col-span-3 flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-emerald-neon">Chessreps — Antigravity</h1>
            <div className="ml-4">
              <select 
                value={opening} 
                onChange={(e)=>{setOpening(e.target.value); handleReset();}} 
                className="bg-slate-700 text-sm rounded px-3 py-1 text-white"
              >
                {openings.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={()=>{setMode('learn'); handleReset();}} 
              className={`px-3 py-1 rounded text-sm ${mode==='learn' ? 'bg-emerald-neon text-black font-medium' : 'bg-slate-700'}`}
            >
              Learn
            </button>
            <button 
              onClick={()=>{setMode('practice'); handleReset();}} 
              className={`px-3 py-1 rounded text-sm ${mode==='practice' ? 'bg-emerald-neon text-black font-medium' : 'bg-slate-700'}`}
            >
              Practice
            </button>
            <button 
              onClick={handleReset}
              className="px-3 py-1 rounded text-sm bg-slate-700 hover:bg-slate-600 ml-2"
            >
              Restart
            </button>
          </div>
        </header>

        <section className="col-span-2 flex items-center justify-center">
          <div className="card p-4 flex items-center justify-center">
            <ChessBoard 
              key={reloadKey} 
              opening={opening} 
              mode={mode} 
              onDone={handleDone} 
              onHistoryUpdate={handleHistoryUpdate}
            />
          </div>
        </section>

        <aside className="col-span-1 card p-4">
          <h2 className="text-lg font-medium mb-2">Move History</h2>
          <ol className="space-y-2 max-h-[60vh] overflow-auto text-sm">
            {history.length === 0 && <li className="text-xs text-gray-400">No moves yet</li>}
            {history.map((h,i)=> (
              <li key={i} className="text-sm">
                <span className="font-semibold text-emerald-neon">{i+1}. {h.san}</span>
                <div className="text-xs text-gray-400">{h.explanation}</div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {showSM2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="card p-6 w-[420px]">
            <h3 className="text-xl mb-4 font-medium">How well did you recall?</h3>
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-4">Rate 0 = forgot, 5 = perfect recall</p>
              <div className="flex gap-2">
                {[0,1,2,3,4,5].map(n => (
                  <button 
                    key={n} 
                    onClick={()=>handleRating(n)} 
                    className="flex-1 py-2 rounded bg-slate-700 hover:bg-emerald-neon hover:text-black transition-colors font-medium"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
