"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Pieces from './ChessPieces';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];

export default function ChessBoard({ opening='King\'s Indian Defense (Classical Variation)', mode='learn', onDone, onHistoryUpdate }) {
  const [sessionId, setSessionId] = useState(null);
  const [board, setBoard] = useState({});
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [practiceFail, setPracticeFail] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const boardRef = useRef(null);

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
        setBoard(getInitialBoard());
        setHistory([]);
        setSelected(null);
        setLegalMoves([]);
        setHighlights([]);
        setLastMove(null);
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

  const applyMoveToBoard = useCallback((currentBoard, uci) => {
    const from = uci.slice(0,2);
    const to = uci.slice(2,4);
    const promotion = uci.length > 4 ? uci[4] : null;
    const piece = currentBoard[from];
    if (!piece) return currentBoard;
    
    const newBoard = { ...currentBoard };
    delete newBoard[from];
    
    // Handle castling
    if (piece === 'wK' && from === 'e1') {
      if (to === 'g1') { delete newBoard['h1']; newBoard['f1'] = 'wR'; }
      if (to === 'c1') { delete newBoard['a1']; newBoard['d1'] = 'wR'; }
    }
    if (piece === 'bK' && from === 'e8') {
      if (to === 'g8') { delete newBoard['h8']; newBoard['f8'] = 'bR'; }
      if (to === 'c8') { delete newBoard['a8']; newBoard['d8'] = 'bR'; }
    }
    
    // Handle en passant
    if (piece[1] === 'P' && from[0] !== to[0] && !currentBoard[to]) {
      const capturedPawnRank = piece[0] === 'w' ? '5' : '4';
      delete newBoard[to[0] + capturedPawnRank];
    }
    
    if (promotion) {
      const promoted = (piece[0] === 'w' ? 'w' : 'b') + promotion.toUpperCase();
      newBoard[to] = promoted;
    } else {
      newBoard[to] = piece;
    }
    return newBoard;
  }, []);

  // Get legal moves for a piece (simplified - just show possible destinations)
  const getLegalSquares = useCallback((square) => {
    const piece = board[square];
    if (!piece || piece[0] !== 'w') return []; // Only allow white moves
    
    const moves = [];
    const [file, rank] = [square[0], square[1]];
    const fileIdx = files.indexOf(file);
    const rankIdx = ranks.indexOf(rank);
    
    // Simplified legal move generation for visual feedback
    // The actual legality is checked by the server
    const pieceType = piece[1];
    
    if (pieceType === 'P') {
      // Pawn moves
      const direction = -1; // White pawns move up (lower rank index)
      const newRankIdx = rankIdx + direction;
      if (newRankIdx >= 0 && newRankIdx < 8) {
        const targetSq = files[fileIdx] + ranks[newRankIdx];
        if (!board[targetSq]) moves.push(targetSq);
        // Double move from starting position
        if (rank === '2' && newRankIdx - 1 >= 0) {
          const doubleSq = files[fileIdx] + ranks[newRankIdx - 1];
          if (!board[targetSq] && !board[doubleSq]) moves.push(doubleSq);
        }
        // Captures
        if (fileIdx > 0) {
          const captureSq = files[fileIdx - 1] + ranks[newRankIdx];
          if (board[captureSq] && board[captureSq][0] === 'b') moves.push(captureSq);
        }
        if (fileIdx < 7) {
          const captureSq = files[fileIdx + 1] + ranks[newRankIdx];
          if (board[captureSq] && board[captureSq][0] === 'b') moves.push(captureSq);
        }
      }
    } else if (pieceType === 'N') {
      // Knight moves
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [df, dr] of knightMoves) {
        const newFileIdx = fileIdx + df;
        const newRankIdx = rankIdx + dr;
        if (newFileIdx >= 0 && newFileIdx < 8 && newRankIdx >= 0 && newRankIdx < 8) {
          const targetSq = files[newFileIdx] + ranks[newRankIdx];
          if (!board[targetSq] || board[targetSq][0] === 'b') moves.push(targetSq);
        }
      }
    } else if (pieceType === 'K') {
      // King moves
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const newFileIdx = fileIdx + df;
          const newRankIdx = rankIdx + dr;
          if (newFileIdx >= 0 && newFileIdx < 8 && newRankIdx >= 0 && newRankIdx < 8) {
            const targetSq = files[newFileIdx] + ranks[newRankIdx];
            if (!board[targetSq] || board[targetSq][0] === 'b') moves.push(targetSq);
          }
        }
      }
      // Castling
      if (square === 'e1') {
        if (!board['f1'] && !board['g1'] && board['h1'] === 'wR') moves.push('g1');
        if (!board['d1'] && !board['c1'] && !board['b1'] && board['a1'] === 'wR') moves.push('c1');
      }
    } else if (pieceType === 'R' || pieceType === 'Q') {
      // Rook/Queen moves (straight lines)
      const directions = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [df, dr] of directions) {
        let newFileIdx = fileIdx + df;
        let newRankIdx = rankIdx + dr;
        while (newFileIdx >= 0 && newFileIdx < 8 && newRankIdx >= 0 && newRankIdx < 8) {
          const targetSq = files[newFileIdx] + ranks[newRankIdx];
          if (board[targetSq]) {
            if (board[targetSq][0] === 'b') moves.push(targetSq);
            break;
          }
          moves.push(targetSq);
          newFileIdx += df;
          newRankIdx += dr;
        }
      }
    }
    if (pieceType === 'B' || pieceType === 'Q') {
      // Bishop/Queen moves (diagonals)
      const directions = [[1,1],[1,-1],[-1,1],[-1,-1]];
      for (const [df, dr] of directions) {
        let newFileIdx = fileIdx + df;
        let newRankIdx = rankIdx + dr;
        while (newFileIdx >= 0 && newFileIdx < 8 && newRankIdx >= 0 && newRankIdx < 8) {
          const targetSq = files[newFileIdx] + ranks[newRankIdx];
          if (board[targetSq]) {
            if (board[targetSq][0] === 'b') moves.push(targetSq);
            break;
          }
          moves.push(targetSq);
          newFileIdx += df;
          newRankIdx += dr;
        }
      }
    }
    
    return moves;
  }, [board]);

  async function processMove(uci) {
    if (!sessionId || loading || practiceFail) return;
    setLoading(true);
    setSelected(null);
    setLegalMoves([]);
    
    try {
      const res = await fetch('/api/chess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submitMove', sessionId, move: uci })
      });
      const result = await res.json();

      if (result.status === 'correct') {
        // Apply the player's move
        let newBd = applyMoveToBoard(board, uci);
        setLastMove({ from: uci.slice(0,2), to: uci.slice(2,4) });
        
        // Update history with white move
        const newHistory = [...history, { uci, san: result.playedMove?.san || uci, explanation: result.playedMove?.explanation }];
        
        // If there's a black reply, apply it after a short delay
        if (result.blackReply) {
          setBoard(newBd);
          await new Promise(resolve => setTimeout(resolve, 300));
          newBd = applyMoveToBoard(newBd, result.blackReply.uci);
          setLastMove({ from: result.blackReply.uci.slice(0,2), to: result.blackReply.uci.slice(2,4) });
          newHistory.push({ uci: result.blackReply.uci, san: result.blackReply.san, explanation: result.blackReply.explanation });
        }
        
        setBoard(newBd);
        setHistory(newHistory);
        if (typeof onHistoryUpdate === 'function') onHistoryUpdate(newHistory);

        if (result.isCompleted) {
          onDone && onDone();
        }
      } else if (result.status === 'incorrect') {
        if (mode === 'learn' && result.highlightSquares) {
          setHighlights(result.highlightSquares || []);
          setTimeout(() => setHighlights([]), 1500);
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

  function handleSquareClick(sq) {
    if (practiceFail) return;
    
    if (!selected) {
      const piece = board[sq];
      if (piece && piece[0] === 'w') {
        setSelected(sq);
        setLegalMoves(getLegalSquares(sq));
      }
    } else {
      if (selected === sq) {
        setSelected(null);
        setLegalMoves([]);
        return;
      }
      const uci = selected + sq;
      processMove(uci);
    }
  }

  // Drag and drop handlers
  function handleDragStart(e, sq) {
    if (practiceFail) return;
    const piece = board[sq];
    if (!piece || piece[0] !== 'w') return;
    
    setDragging(sq);
    setSelected(sq);
    setLegalMoves(getLegalSquares(sq));
    
    // Create custom drag image (invisible)
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    e.dataTransfer.setData('text/plain', sq);
  }

  function handleDrag(e) {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDragPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }

  function handleDragEnd() {
    setDragging(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e, toSq) {
    e.preventDefault();
    const fromSq = e.dataTransfer.getData('text/plain');
    if (!fromSq || fromSq === toSq) {
      setDragging(null);
      return;
    }
    const uci = fromSq + toSq;
    processMove(uci);
    setDragging(null);
  }

  function renderSquare(file, rank) {
    const sq = file + rank;
    const fileIdx = files.indexOf(file);
    const rankIdx = ranks.indexOf(rank);
    const isLight = (fileIdx + rankIdx) % 2 === 0;
    const pieceCode = board[sq];
    const PieceComp = pieceCode ? Pieces[pieceCode] : null;
    
    const isSelected = selected === sq;
    const isLegalTarget = legalMoves.includes(sq);
    const isHighlighted = highlights.includes(sq);
    const isLastMoveFrom = lastMove?.from === sq;
    const isLastMoveTo = lastMove?.to === sq;
    const isDraggingThis = dragging === sq;

    const lightColor = '#f0d9b5';
    const darkColor = '#b58863';
    const selectedColor = 'rgba(255, 255, 100, 0.5)';
    const lastMoveColor = 'rgba(155, 199, 0, 0.41)';

    return (
      <div
        key={sq}
        className="relative flex items-center justify-center"
        style={{
          backgroundColor: isLight ? lightColor : darkColor,
          width: '100%',
          height: '100%',
        }}
        onClick={() => handleSquareClick(sq)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, sq)}
      >
        {/* Last move highlight */}
        {(isLastMoveFrom || isLastMoveTo) && (
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: lastMoveColor }} />
        )}
        
        {/* Selected square highlight */}
        {isSelected && !isDraggingThis && (
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: selectedColor }} />
        )}
        
        {/* Hint highlight (for learn mode) */}
        {isHighlighted && (
          <div className="absolute inset-0 pointer-events-none animate-pulse" 
               style={{ backgroundColor: 'rgba(16, 185, 129, 0.5)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)' }} />
        )}
        
        {/* Legal move indicator */}
        {isLegalTarget && !pieceCode && (
          <div className="absolute w-[30%] h-[30%] rounded-full bg-black/20 pointer-events-none" />
        )}
        {isLegalTarget && pieceCode && (
          <div className="absolute inset-0 pointer-events-none" 
               style={{ 
                 border: '4px solid rgba(0,0,0,0.2)', 
                 borderRadius: '50%',
                 margin: '3px'
               }} />
        )}
        
        {/* Piece */}
        {PieceComp && !isDraggingThis && (
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, sq)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="w-[85%] h-[85%] cursor-grab active:cursor-grabbing z-10 transition-transform"
          >
            <PieceComp />
          </div>
        )}
        
        {/* File/Rank labels */}
        {rank === '1' && (
          <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold select-none pointer-events-none"
                style={{ color: isLight ? darkColor : lightColor }}>
            {file}
          </span>
        )}
        {file === 'a' && (
          <span className="absolute top-0.5 left-1 text-[10px] font-semibold select-none pointer-events-none"
                style={{ color: isLight ? darkColor : lightColor }}>
            {rank}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${practiceFail ? 'animate-red-flash' : ''}`}>
      {/* Dragged piece overlay */}
      {dragging && board[dragging] && (
        <div 
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPos.x - 30,
            top: dragPos.y - 30,
            width: 60,
            height: 60,
          }}
        >
          {(() => {
            const DragPiece = Pieces[board[dragging]];
            return DragPiece ? <DragPiece /> : null;
          })()}
        </div>
      )}
      
      {/* Board */}
      <div 
        ref={boardRef}
        className="grid grid-cols-8 rounded-md overflow-hidden shadow-2xl"
        style={{ 
          width: 'min(560px, 85vw)', 
          height: 'min(560px, 85vw)',
          border: '2px solid #404040'
        }}
      >
        {ranks.map(rank => 
          files.map(file => renderSquare(file, rank))
        )}
      </div>

      {practiceFail && (
        <div className="mt-4 text-red-400 font-medium text-center">
          Run Failed. Press Restart to try again.
        </div>
      )}
      {loading && (
        <div className="mt-2 text-sm text-zinc-400">Processing...</div>
      )}
    </div>
  );
}
