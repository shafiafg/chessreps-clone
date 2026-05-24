"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TrainingEngine from '../engine/TrainingEngine';
import Pieces from './ChessPieces';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];

export default function ChessBoard({ opening='King\'s Indian', mode='learn', onDone, onEngineReady, onHistoryUpdate }) {
  const engineRef = useRef(null);
  const [board, setBoard] = useState({});
  const [selected, setSelected] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [practiceFail, setPracticeFail] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    engineRef.current = new TrainingEngine(opening, mode);
    setBoard(engineRef.current.getBoard());
    setHistory(engineRef.current.getHistory());
    setSelected(null);
    setHighlights([]);
    setPracticeFail(false);
    if (typeof onEngineReady === 'function') onEngineReady(engineRef.current);
  }, [opening, mode]);

  useEffect(() => {
    if (!engineRef.current) return;
    if (engineRef.current.isDone()) {
      onDone && onDone();
    }
  }, [history]);

  function renderSquare(file, rank) {
    const sq = file + rank;
    const isLight = ((files.indexOf(file) + ranks.indexOf(rank)) % 2) === 0;
    const bg = isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
    const pieceCode = board[sq];
    const PieceComp = pieceCode ? Pieces[pieceCode] : null;
    const highlight = highlights.includes(sq);

    return (
      <div key={sq}
        className={`square-inner w-full h-full ${isLight? 'bg-[#f0d9b5]':'bg-[#b58863]'} relative`}
        onClick={() => handleClick(sq)}
        onDragOver={(e)=>e.preventDefault()}
        onDrop={(e)=>handleDrop(e, sq)}
      >
        {highlight && <div className="absolute inset-0 rounded-md animate-emerald-glow pointer-events-none" />}
        {PieceComp && (
          <motion.div
            layout
            drag
            dragConstraints={{ top:0, left:0, right:0, bottom:0 }}
            onDragStart={(e)=>handleDragStart(e, sq)}
            onDragEnd={(e)=>{/* handled by drop on squares */}}
            style={{ width: '80%', height: '80%', cursor: 'grab' }}
            className="z-10"
            title={pieceCode}
            >
            <div draggable="false" onDragStart={(e)=>e.preventDefault()}>
              <PieceComp />
            </div>
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
      // pick up if there is a piece
      if (board[sq]) setSelected(sq);
    } else {
      if (selected === sq) { setSelected(null); return; }
      const uci = selected + sq;
      processMove(uci);
      setSelected(null);
    }
  }

  function processMove(uci) {
    const engine = engineRef.current;
    if (!engine) return;
    const res = engine.submitMove(uci);
    if (!res || !res.ok) return;
      if (res.correct) {
      // move applied
      setBoard(engine.getBoard());
      setHistory(engine.getHistory());
        if (typeof onHistoryUpdate === 'function') onHistoryUpdate(engine.getHistory());
      setHighlights([]);
      if (engine.isDone()) onDone && onDone();
      return;
    }

    // incorrect
    if (res.mode === 'learn' && res.highlightSquares) {
      setHighlights(res.highlightSquares || []);
      setTimeout(()=>setHighlights([]), 1200);
    }
    // propagate history change for cases where wrong move recorded or locked
    if (typeof onHistoryUpdate === 'function') onHistoryUpdate(engine.getHistory());
    if (res.mode === 'practice') {
      setPracticeFail(true);
    }
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${practiceFail ? 'animate-red-flash' : ''}`}>
      <div className="chess-board grid grid-cols-8 grid-rows-8 gap-0 rounded-md overflow-hidden shadow-lg">
        {ranks.map(rank => files.map(file => (
          <div key={file+rank} className={`w-full h-full border border-transparent`}>
            {renderSquare(file, rank)}
          </div>
        ))).flat()}
      </div>

      {practiceFail && (
        <div className="mt-4 text-red-400">Run Failed — board locked. Press Restart to continue.</div>
      )}

    </div>
  );
}
