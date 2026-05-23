/**
 * @fileoverview SessionState - Manages the state of a chess opening training session.
 *
 * @typedef {import('../OpeningTree.js').default} OpeningTree
 * @typedef {import('../OpeningTree.js').MoveNode} MoveNode
 */

export default class SessionState {
  /**
   * @param {OpeningTree} openingTree - The opening tree being trained.
   * @param {'learn'|'practice'} [mode='learn'] - Training mode.
   */
  constructor(openingTree, mode = 'learn') {
    if (mode !== 'learn' && mode !== 'practice') {
      throw new Error(`Invalid mode "${mode}". Must be "learn" or "practice".`);
    }

    this.openingTree = openingTree;

    /** @type {'learn'|'practice'} */
    this.mode = mode;

    /** @type {string|null} */
    this.currentNodeId = null;

    /** @type {Array<{ uci: string, san: string, nodeId: string, timestamp: Date }>} */
    this.moveHistory = [];

    /** @type {number} */
    this.failCount = 0;

    /** @type {boolean} */
    this.completed = false;

    /** @type {Date} */
    this.startTime = new Date();

    /** @type {boolean} */
    this.locked = false;
  }

  /**
   * Advances the session to the matched node's position.
   * Pushes the move to history, checks for leaf completion.
   *
   * @param {MoveNode} matchedNode - The node that was matched by the validator.
   * @returns {ReturnType<SessionState['getSnapshot']>} Updated state snapshot.
   */
  advance(matchedNode) {
    this.currentNodeId = matchedNode.id;

    this.moveHistory.push({
      uci: matchedNode.uci,
      san: matchedNode.san,
      nodeId: matchedNode.id,
      timestamp: new Date()
    });

    // Check if we've reached a leaf node (no children)
    const children = this.openingTree.getNextExpectedMoves(matchedNode.id);
    if (children.length === 0) {
      this.completed = true;
    }

    return this.getSnapshot();
  }

  /**
   * Records a failed move attempt.
   *
   * In 'learn' mode: increments failCount and returns hint data.
   * In 'practice' mode: locks the session, resets to root, increments failCount.
   *
   * @param {string} uciAttempt - The UCI string the user attempted.
   * @returns {{ failCount: number, locked: boolean, hint?: string, resetToRoot?: boolean }}
   */
  recordFailure(uciAttempt) {
    this.failCount += 1;

    if (this.mode === 'learn') {
      const children = this.openingTree.getNextExpectedMoves(this.currentNodeId);
      const expectedMoves = children.map(n => n.uci).join(', ');
      return {
        failCount: this.failCount,
        locked: this.locked,
        hint: `Incorrect move "${uciAttempt}". Expected: ${expectedMoves}`
      };
    }

    // practice mode: lock and reset to root
    this.locked = true;
    this.currentNodeId = null;

    return {
      failCount: this.failCount,
      locked: true,
      resetToRoot: true,
      hint: `Wrong move in practice mode. Session locked. Call reset() to try again.`
    };
  }

  /**
   * Resets the session back to its initial state (root node, empty history).
   */
  reset() {
    this.currentNodeId = null;
    this.moveHistory = [];
    this.failCount = 0;
    this.completed = false;
    this.locked = false;
  }

  /**
   * Returns a full state snapshot of the current session.
   *
   * @returns {{
   *   mode: string,
   *   currentNodeId: string,
   *   moveCount: number,
   *   failCount: number,
   *   completed: boolean,
   *   locked: boolean,
   *   elapsedMs: number
   * }}
   */
  getSnapshot() {
    return {
      mode: this.mode,
      currentNodeId: this.currentNodeId,
      moveCount: this.moveHistory.length,
      failCount: this.failCount,
      completed: this.completed,
      locked: this.locked,
      elapsedMs: Date.now() - this.startTime.getTime()
    };
  }

  /**
   * Returns whether the session is currently locked.
   *
   * @returns {boolean}
   */
  isLocked() {
    return this.locked;
  }
}
