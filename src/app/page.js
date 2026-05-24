"use client";

import './globals.css';
import React, { useState, useEffect, useRef } from 'react';
import ChessBoard from '../lib/components/ChessBoard';

// Icons
function BookIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <circle cx="12" cy="12" r="6" strokeWidth={2} />
      <circle cx="12" cy="12" r="2" strokeWidth={2} />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

const modes = [
  { id: 'learn', label: 'Learn', icon: BookIcon, description: 'See hints for correct moves' },
  { id: 'practice', label: 'Practice', icon: TargetIcon, description: 'Test without hints' },
  { id: 'drill', label: 'Drill', icon: ZapIcon, description: 'Rapid repetition' },
  { id: 'timetrial', label: 'Time Trial', icon: ClockIcon, description: 'Beat the clock' },
];

export default function Page() {
  const [openings, setOpenings] = useState([]);
  const [mode, setMode] = useState('learn');
  const [opening, setOpening] = useState('');
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [showSM2, setShowSM2] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredOpenings = openings.filter(o => 
    o.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleHistoryUpdate(h) { setHistory(h || []); }

  function handleDone() {
    setDone(true);
    setShowSM2(true);
  }

  function handleRating(r) {
    console.log(`Rated ${r}/5 for ${opening}`);
    setShowSM2(false);
    setDone(false);
    setHistory([]);
    setReloadKey(k => k + 1);
  }

  function handleReset() {
    setHistory([]);
    setDone(false);
    setShowSM2(false);
    setReloadKey(k => k + 1);
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    handleReset();
  }

  function handleOpeningSelect(o) {
    setOpening(o);
    handleReset();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400">Loading openings...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex h-screen">
        {/* Left Sidebar - Opening Selection */}
        <aside className={`bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ${sidebarExpanded ? 'w-72' : 'w-16'}`}>
          {/* Logo */}
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-zinc-900">
              C
            </div>
            {sidebarExpanded && (
              <span className="font-semibold text-lg">ChessReps</span>
            )}
          </div>

          {/* Search */}
          {sidebarExpanded && (
            <div className="p-3">
              <input
                type="text"
                placeholder="Search openings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {/* Repertoire Header */}
          <div 
            className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            {sidebarExpanded && (
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Repertoire ({filteredOpenings.length})
              </span>
            )}
            <ChevronIcon expanded={sidebarExpanded} />
          </div>

          {/* Openings List */}
          {sidebarExpanded && (
            <div className="flex-1 overflow-y-auto">
              {filteredOpenings.map((o) => (
                <button
                  key={o}
                  onClick={() => handleOpeningSelect(o)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                    opening === o 
                      ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' 
                      : 'text-zinc-300 hover:bg-zinc-800/70 border-l-2 border-transparent'
                  }`}
                >
                  <span className="truncate">{o}</span>
                </button>
              ))}
              {filteredOpenings.length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No openings found
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center - Chess Board */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
          {/* Board Container */}
          <div className="flex flex-col items-center">
            <ChessBoard 
              key={reloadKey} 
              opening={opening} 
              mode={mode} 
              onDone={handleDone} 
              onHistoryUpdate={handleHistoryUpdate}
            />

            {/* Mode Buttons */}
            <div className="mt-6 flex gap-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const isActive = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-emerald-500 text-zinc-900' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                    title={m.description}
                  >
                    <Icon />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Opening Display */}
            <div className="mt-4 text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Currently Training</div>
              <div className="text-lg font-medium text-zinc-200">{opening}</div>
            </div>
          </div>
        </div>

        {/* Right Panel - Moves & Analysis */}
        <aside className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">Moves</h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              <RefreshIcon />
              <span>Restart</span>
            </button>
          </div>

          {/* Evaluation Bar (placeholder) */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400">Evaluation</span>
              <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-300 w-1/2" />
              </div>
              <span className="text-zinc-300 font-mono text-xs">0.0</span>
            </div>
          </div>

          {/* Move List */}
          <div className="flex-1 overflow-y-auto p-4">
            {history.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-8">
                <div className="mb-2">No moves yet</div>
                <div className="text-xs">Make a move to start training</div>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => {
                  const moveNumber = Math.floor(i / 2) + 1;
                  const isWhite = i % 2 === 0;
                  return (
                    <div key={i} className={`flex gap-2 py-1.5 px-2 rounded ${isWhite ? '' : 'ml-6'}`}>
                      {isWhite && (
                        <span className="text-zinc-500 font-mono text-sm w-6">{moveNumber}.</span>
                      )}
                      <div className="flex-1">
                        <span className={`font-medium ${isWhite ? 'text-zinc-100' : 'text-zinc-400'}`}>
                          {h.san}
                        </span>
                        {h.explanation && (
                          <div className="text-xs text-zinc-500 mt-0.5">{h.explanation}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status */}
          {done && (
            <div className="p-4 border-t border-zinc-800 bg-emerald-500/10">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Opening Complete!
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* SM-2 Rating Modal */}
      {showSM2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-[420px] shadow-2xl">
            <h3 className="text-xl font-semibold mb-2">How well did you recall?</h3>
            <p className="text-sm text-zinc-400 mb-6">Rate your performance for spaced repetition</p>
            <div className="grid grid-cols-6 gap-2">
              {[0,1,2,3,4,5].map(n => (
                <button 
                  key={n} 
                  onClick={() => handleRating(n)} 
                  className="py-3 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-900 transition-all font-semibold text-lg"
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2 px-1">
              <span>Forgot</span>
              <span>Perfect</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
