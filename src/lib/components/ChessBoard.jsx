"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Pieces from './ChessPieces';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];

export default function ChessBoard({ opening='King\'s Indian Defense (Classical Variation)', mode='learn', onDone, onEngineReady, onHistoryUpdate }) {
  const [sessionId, setSessionId] = useState(null);
  const [board, setBoard] = useState({});
  const [selected, setSelected] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [practiceFail, setPracticeFail] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize board and session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/chess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'init', openingName: opening, mode })
        });
        const data = await res.json();
        setSessionId(data.sessionId);
        setBoard(getInitialBoard()); // Reset to initial position
        setHistory([]);
        setSelected(null);
        setHighlights([]);
        setPracticeFail(false);
      } catch (err) {
        console.error('Failed to init session:', err);
      }
      setLoading(false);
    };
    initSession();
  }, [opening, mode]);

  function getInitialBoard() {
    const b = {};
    const fls = ['a','b','c','d','e','f','g','h'];
    for (let i=0; i<8; i++) {
      b[fls[i] + '2'] = 'wP';
      b[fls[i] + '7'] = 'bP';
    }
    b['a1']='wR'; b['h1']='wR'; b['a8']='bR'; b['h8']='bR';
    b['b1']='wN'; b['g1']='wN'; b['b8']='bN'; b['g8']='bN';
    b['c1']='wB'; b['f1']='wB'; b['c8']='bB'; b['f8']='bB';
    b['d1']='wQ'; b['d8']='bQ';
    b['e1']='wK'; b['e8']='bK';
    return b;
  }

  function applyMoveToBoard(uci) {
    const from = uci.slice(0,2);
    const to = uci.slice(2,4);
    const promotion = uci.length > 4 ? uci[4] : null;
    const piece = board[from];
    if (!piece) return;
    const newBoard = { ...board };
    delete newBoard[from];
    if (promotion) {
      const promoted = (piece[0] === 'w' ? 'w' : 'b') + promotion.toUpperCase();
      newBoard[to] = promoted;
    } else {
      newBoard[to] = piece;
    }
    return newBoard;
  }

  function renderSquare(file, rank) {
    const sq = file + rank;
    const isLight = ((files.indexOf(file) + ranks.indexOf(rank)) % 2) === 0;
    const pieceCode = board[sq];
    const PieceComp = pieceCode ? Pieces[pieceCode] : null;
    const highlight = highlights.includes(sq);

    return (
      <div key={sq}
        className={`w-full h-full flex items-center justify-center relative cursor-pointer ${isLight? 'bg-[#f0d9b5]':'bg-[#b58863]'}`}
        onClick={() => handleClick(sq)}
        onDragOver={(e)=>e.preventDefault()}
        onDrop={(e)=>handleDrop(e, sq)}
      >
        {highlight && <div className="absolute inset-0 rounded-md animate-emerald-glow pointer-events-none" />}
        {selected === sq && <div className="absolute inset-0 bg-yellow-400 rounded-md opacity-40" />}
        {PieceComp && (
          <motion.div
            layout
            draggable
            onDragStart={(e)=>handleDragStart(e, sq)}
            onDragEnd={(e)=>{}}
            style={{ width: '80%', height: '80%', cursor: 'grab' }}
            className="z-10"
            title={pieceCode}
            >
            <PieceComp />
          </motion.div>
        )}
      </div>
    );
  }

  function handleDragStart(e, from) {
    try { e.dataTransfer.setData('text/plain', from); } catch (err) {}
  }

  function handleDrop(e, to) {
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain');
    if (!from) return;
    const uci = from + to;
    processMove(uci);
  }

  function handleClick(sq) {
    if (!selected) {
      if (board[sq]) setSelected(sq);
    } else {
      if (selected === sq) { setSelected(null); return; }
      const uci = selected + sq;
      processMove(uci);
      setSelected(null);
    }
  }

  async function processMove(uci) {
    if (!sessionId || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submitMove', sessionId, move: uci })
      });
      const result = await res.json();

      if (result.status === 'correct') {
        // Apply the move
        let newBd = applyMoveToBoard(uci);
        if (result.blackReply) {
          newBd = applyMoveToBoard(result.blackReply.uci);
        }
        setBoard(newBd);

        // Update history with white move and black reply if any
        const newHistory = [...history, { uci, san: result.playedMove.san, explanation: result.playedMove.explanation }];
        if (result.blackReply) {
          newHistory.push({ uci: result.blackReply.uci, san: result.blackReply.san, explanation: result.blackReply.explanation });
        }
        setHistory(newHistory);
        if (typeof onHistoryUpdate === 'function') onHistoryUpdate(newHistory);

        if (result.isCompleted) {
          onDone && onDone();
        }
      } else if (result.status === 'incorrect') {
        if (mode === 'learn' && result.highlightSquares) {
          setHighlights(result.highlightSquares || []);
          setTimeout(()=>setHighlights([]), 1200);
        }
      } else if (result.status === 'failed') {
        if (mode === 'practice') {
          setPracticeFail(true);
        }
      }
    } catch (err) {
      console.error('Move submission error:', err);
    }
    setLoading(false);
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${practiceFail ? 'animate-red-flash' : ''}`}>
      <div className="chess-board grid grid-cols-8 grid-rows-8 gap-0 rounded-md overflow-hidden shadow-lg border-2 border-slate-600">
        {ranks.map(rank => files.map(file => (
          <div key={file+rank} className="w-full h-full">
            {renderSquare(file, rank)}
          </div>
        ))).flat()}
      </div>

      {practiceFail && (
        <div className="mt-4 text-red-400 font-medium">Run Failed — board locked. Press Restart to continue.</div>
      )}
      {loading && <div className="mt-2 text-sm text-gray-400">Submitting...</div>}
    </div>
  );
}
