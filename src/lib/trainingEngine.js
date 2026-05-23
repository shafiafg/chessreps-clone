import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openingsPath = path.resolve(__dirname, 'openings.json');
const openings = JSON.parse(fs.readFileSync(openingsPath, 'utf8'));

export default class TrainingEngine {
  constructor(openingName, mode = 'learn') {
    if (!openings[openingName]) {
      throw new Error(`Opening "${openingName}" not found.`);
    }
    this.openingName = openingName;
    this.moves = openings[openingName];
    this.mode = mode; // 'learn' or 'practice'
    this.currentIndex = 0;
    this.failed = false;
  }

  getExpectedMove() {
    if (this.currentIndex >= this.moves.length) {
      return null;
    }
    return this.moves[this.currentIndex];
  }

  submitMove(uciMove) {
    if (this.mode === 'practice' && this.failed) {
      return {
        status: 'failed',
        message: 'Engine is in a failed state. Reset required.'
      };
    }

    if (this.currentIndex >= this.moves.length) {
      return {
        status: 'completed',
        message: 'Opening is already completed.',
        isCompleted: true
      };
    }

    const expected = this.getExpectedMove();

    if (uciMove === expected.uci) {
      const correctWhiteMove = expected;
      
      // Progress the index to Black's turn
      this.currentIndex++;
      
      let blackReply = null;
      if (this.currentIndex < this.moves.length) {
        blackReply = this.moves[this.currentIndex];
        // Progress index past Black's move to the next White move
        this.currentIndex++;
      }

      const isCompleted = this.currentIndex >= this.moves.length;

      return {
        status: 'correct',
        message: `Correct! Played ${correctWhiteMove.san}. ${correctWhiteMove.explanation}`,
        playedMove: correctWhiteMove,
        blackReply: blackReply ? {
          step: blackReply.step,
          uci: blackReply.uci,
          san: blackReply.san,
          highlightSquares: blackReply.highlightSquares,
          explanation: blackReply.explanation
        } : null,
        isCompleted
      };
    } else {
      if (this.mode === 'learn') {
        return {
          status: 'incorrect',
          message: 'Incorrect move. Try again!',
          hint: `Expected move is ${expected.san}. Try moving from ${expected.highlightSquares[0]} to ${expected.highlightSquares[1]}.`,
          highlightSquares: expected.highlightSquares
        };
      } else {
        // practice mode: strictly resets progress and flags a failure
        this.currentIndex = 0;
        this.failed = true;
        return {
          status: 'failed',
          message: 'Incorrect move! Practice run failed. Progress reset.'
        };
      }
    }
  }

  reset() {
    this.currentIndex = 0;
    this.failed = false;
  }
}
