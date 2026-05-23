/**
 * EngineFacade.js
 * Unified API layer that wires together OpeningTree, MoveValidator, SpacedRep, and SessionState.
 * This is the single entry point for the frontend.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import OpeningTree from '../models/OpeningTree.js';
import MoveValidator from '../core/MoveValidator.js';
import SpacedRep from '../core/SpacedRep.js';
import SessionState from '../core/SessionState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPERTOIRE_PATH = path.resolve(__dirname, '../data/repertoire.json');

export default class EngineFacade {
  /**
   * @param {string} openingName - Key in repertoire.json (e.g. "kings-indian-defense")
   * @param {'learn'|'practice'} [mode='learn']
   */
  constructor(openingName, mode = 'learn') {
    const repertoire = JSON.parse(readFileSync(REPERTOIRE_PATH, 'utf8'));

    if (!repertoire[openingName]) {
      throw new Error(
        `Opening "${openingName}" not found. Available: ${Object.keys(repertoire).join(', ')}`
      );
    }

    /** @type {OpeningTree} */
    this.tree = new OpeningTree(repertoire[openingName]);

    /** @type {MoveValidator} */
    this.validator = new MoveValidator(this.tree);

    /** @type {SessionState} */
    this.session = new SessionState(this.tree, mode);

    /** @type {SpacedRep} */
    this.spacedRep = new SpacedRep();

    this.openingName = openingName;
    this.mode = mode;
  }

  /**
   * Main entry point for the frontend. Accepts a White UCI move, validates it,
   * advances the session state, and automatically replies with Black's move if one exists.
   *
   * @param {string} uciMove - UCI coordinate string (e.g. 'd2d4')
   * @returns {{
   *   status: 'correct'|'incorrect'|'failed'|'locked',
   *   san?: string,
   *   commentary?: string,
   *   blackReply?: { uci: string, san: string, commentary: string }|null,
   *   sessionSnapshot?: object,
   *   isCompleted?: boolean,
   *   hint?: string,
   *   highlightSquares?: string[],
   *   message?: string
   * }}
   */
  submitMove(uciMove) {
    // Block if session is locked (practice mode after failure)
    if (this.session.isLocked()) {
      return {
        status: 'locked',
        message: 'Session is locked after a failed practice run. Call reset() to continue.',
        sessionSnapshot: this.session.getSnapshot()
      };
    }

    const validationResult = this.validator.validate(uciMove, this.session.currentNodeId);

    if (!validationResult.valid) {
      const failureData = this.session.recordFailure(uciMove);

      if (this.mode === 'practice' || failureData.locked) {
        return {
          status: 'failed',
          message: 'Incorrect move! Practice run failed. Progress has been reset.',
          sessionSnapshot: this.session.getSnapshot()
        };
      }

      // Learn mode: return hint + highlight squares
      const expectedNode = validationResult.expectedMoves[0];
      return {
        status: 'incorrect',
        hint: validationResult.hint,
        highlightSquares: expectedNode ? expectedNode.uci
          ? [expectedNode.uci.slice(0, 2), expectedNode.uci.slice(2, 4)]
          : [] : [],
        sessionSnapshot: this.session.getSnapshot()
      };
    }

    // Correct White move — advance session
    const { matchedNode } = validationResult;
    this.session.advance(matchedNode);

    // Auto-reply with Black's move if one exists as the next node
    let blackReply = null;
    const nextMoves = this.tree.getNextExpectedMoves(matchedNode.id);

    if (nextMoves.length === 1) {
      // Unambiguous Black reply — auto-advance
      const blackNode = nextMoves[0];
      this.session.advance(blackNode);
      blackReply = {
        uci: blackNode.uci,
        san: blackNode.san,
        commentary: blackNode.commentary
      };
    } else if (nextMoves.length > 1) {
      // Multiple branches — it's White's choice next, no auto-reply
      blackReply = null;
    }

    const snapshot = this.session.getSnapshot();

    return {
      status: 'correct',
      san: matchedNode.san,
      commentary: matchedNode.commentary,
      blackReply,
      sessionSnapshot: snapshot,
      isCompleted: snapshot.completed
    };
  }

  /**
   * Submits a performance rating to the SM-2 spaced repetition algorithm.
   * @param {number} rating - 0 to 5
   * @returns {object} SM-2 review result
   */
  reviewPerformance(rating) {
    return this.spacedRep.review(rating);
  }

  /**
   * Resets the session state and optionally the spaced repetition state.
   * @param {boolean} [resetSpacedRep=false]
   */
  reset(resetSpacedRep = false) {
    this.session.reset();
    if (resetSpacedRep) {
      this.spacedRep = new SpacedRep();
    }
  }

  /**
   * Returns a combined status object covering the session and SM-2 state.
   * @returns {object}
   */
  getStatus() {
    return {
      opening: this.tree.name,
      mode: this.mode,
      ...this.session.getSnapshot(),
      spacedRep: this.spacedRep.getState()
    };
  }

  /**
   * Returns the list of valid next moves from the current position.
   * @returns {import('../models/MoveNode.js').default[]}
   */
  getAvailableMoves() {
    return this.tree.getNextExpectedMoves(this.session.currentNodeId);
  }
}
