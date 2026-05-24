import repertoire from './repertoire.json';

function initialBoard() {
  // Simple initial placement mapping square -> piece code
  const board = {};
  const files = ['a','b','c','d','e','f','g','h'];
  // Pawns
  for (let i=0;i<8;i++) {
    board[files[i] + '2'] = 'wP';
    board[files[i] + '7'] = 'bP';
  }
  // Rooks
  board['a1']='wR'; board['h1']='wR'; board['a8']='bR'; board['h8']='bR';
  // Knights
  board['b1']='wN'; board['g1']='wN'; board['b8']='bN'; board['g8']='bN';
  // Bishops
  board['c1']='wB'; board['f1']='wB'; board['c8']='bB'; board['f8']='bB';
  // Queens
  board['d1']='wQ'; board['d8']='bQ';
  // Kings
  board['e1']='wK'; board['e8']='bK';
  return board;
}

function cloneBoard(b) { return Object.assign({}, b); }

export default class TrainingEngine {
  constructor(openingName='King\'s Indian', mode='learn') {
    this.openingName = openingName;
    this.mode = mode; // 'learn' or 'practice'
    this.opening = repertoire[openingName];
    if (!this.opening) throw new Error('Opening not found: ' + openingName);
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.history = []; // array of {uci, san}
    this.currentIndex = 0; // index into opening.moves
    this.locked = false; // for practice mode on failure
    this.done = false;
  }

  getExpected() {
    if (!this.opening || !this.opening.moves) return null;
    return this.opening.moves[this.currentIndex] || null;
  }

  isDone() { return this.done; }

  getBoard() { return cloneBoard(this.board); }

  getHistory() { return Array.from(this.history); }

  applyUci(uci) {
    // Basic mover: move piece from 'e2' to 'e4' (first 4 chars)
    const from = uci.slice(0,2);
    const to = uci.slice(2,4);
    const promotion = uci.length > 4 ? uci[4] : null;
    const piece = this.board[from];
    if (!piece) {
      // no piece to move — still record attempt
      return false;
    }
    // handle captures
    delete this.board[from];
    if (promotion) {
      const promoted = (piece[0] === 'w' ? 'w' : 'b') + promotion.toUpperCase();
      this.board[to] = promoted;
    } else {
      this.board[to] = piece;
    }
    return true;
  }

  submitMove(uciMove) {
    if (this.locked || this.done) return { ok: false, reason: 'locked_or_done' };
    const expected = this.getExpected();
    const correct = expected && expected.uci === uciMove;

    if (correct) {
      this.applyUci(uciMove);
      this.history.push({ uci: uciMove, san: expected.san, explanation: expected.explanation });
      this.currentIndex += 1;
      if (this.currentIndex >= this.opening.moves.length) {
        this.done = true;
      }
      return { ok: true, correct: true, done: this.done };
    }

    // wrong move
    if (this.mode === 'learn') {
      // highlight the target squares for the expected move
      return { ok: true, correct: false, mode: 'learn', highlightSquares: expected ? expected.highlightSquares : [] };
    }

    if (this.mode === 'practice') {
      // lock the board and signal failure
      this.locked = true;
      return { ok: true, correct: false, mode: 'practice', action: 'lock', expected: expected ? expected.uci : null };
    }

    return { ok: true, correct: false };
  }

  unlock() { this.locked = false; }

  reviewPerformance(rating) {
    // rating: 0-5
    if (typeof window === 'undefined') return null;
    const key = `sm2:${this.openingName}`;
    const now = Date.now();
    let data = null;
    try { data = JSON.parse(localStorage.getItem(key)) || null; } catch(e) { data = null; }
    if (!data) {
      data = { repetitions: 0, interval: 0, easiness: 2.5, lastReviewed: null };
    }

    if (rating < 3) {
      data.repetitions = 0;
      data.interval = 1;
    } else {
      data.repetitions += 1;
      if (data.repetitions === 1) data.interval = 1;
      else if (data.repetitions === 2) data.interval = 6;
      else data.interval = Math.round(data.interval * data.easiness);
    }

    // update easiness factor
    const q = rating;
    let ef = data.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3) ef = 1.3;
    data.easiness = Number(ef.toFixed(2));
    data.lastReviewed = now;

    localStorage.setItem(key, JSON.stringify(data));
    // also store a review log
    try {
      const logKey = `sm2log:${this.openingName}`;
      const existing = JSON.parse(localStorage.getItem(logKey) || '[]');
      existing.push({ at: now, rating, snapshot: { repetitions: data.repetitions, interval: data.interval, easiness: data.easiness } });
      localStorage.setItem(logKey, JSON.stringify(existing));
    } catch (e) {}

    return data;
  }
}
