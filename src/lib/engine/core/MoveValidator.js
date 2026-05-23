/**
 * @fileoverview MoveValidator - Validates raw UCI move strings against an OpeningTree.
 *
 * @typedef {import('../OpeningTree.js').default} OpeningTree
 * @typedef {import('../OpeningTree.js').MoveNode} MoveNode
 */

export default class MoveValidator {
  /**
   * @param {OpeningTree} openingTree - The opening tree to validate against.
   */
  constructor(openingTree) {
    this.openingTree = openingTree;
  }

  /**
   * Validates a UCI move string against the children of the current node.
   *
   * @param {string} uciMove - The UCI move string (e.g. 'd2d4').
   * @param {string} currentNodeId - The ID of the current node in the tree.
   * @returns {{ valid: true, matchedNode: MoveNode, isVariation: boolean }
   *          |{ valid: false, expectedMoves: MoveNode[], hint: string }}
   */
  validate(uciMove, currentNodeId) {
    if (!this.isValidUCIFormat(uciMove)) {
      const children = this.openingTree.getNextExpectedMoves(currentNodeId);
      return {
        valid: false,
        expectedMoves: children,
        hint: `"${uciMove}" is not a valid UCI move format. Expected moves: ${children.map(n => n.uci).join(', ')}`
      };
    }

    const children = this.openingTree.getNextExpectedMoves(currentNodeId);
    const matched = children.find(node => node.uci === uciMove);

    if (!matched) {
      return {
        valid: false,
        expectedMoves: children,
        hint: `Move "${uciMove}" not found. Expected: ${children.map(n => n.uci).join(', ')}`
      };
    }

    // isVariation is true when the parent had multiple children (siblings exist)
    const isVariation = children.length > 1;

    return {
      valid: true,
      matchedNode: matched,
      isVariation
    };
  }

  /**
   * Parses a UCI move string into its components.
   *
   * @param {string} uciStr - A UCI move string like 'd2d4' or 'e7e8q'.
   * @returns {{ from: string, to: string, promotion: string|null }}
   */
  parseUCI(uciStr) {
    const from = uciStr.slice(0, 2);
    const to = uciStr.slice(2, 4);
    const promotion = uciStr.length === 5 ? uciStr[4].toLowerCase() : null;
    return { from, to, promotion };
  }

  /**
   * Checks whether a string is a valid UCI move format.
   * Accepts 4-char moves (e.g. 'e2e4') or 5-char promotion moves (e.g. 'e7e8q').
   *
   * @param {string} uciStr - The string to validate.
   * @returns {boolean}
   */
  isValidUCIFormat(uciStr) {
    if (typeof uciStr !== 'string') return false;
    if (uciStr.length !== 4 && uciStr.length !== 5) return false;

    const squareRegex = /^[a-h][1-8]$/;
    const from = uciStr.slice(0, 2);
    const to = uciStr.slice(2, 4);

    if (!squareRegex.test(from) || !squareRegex.test(to)) return false;

    if (uciStr.length === 5) {
      const promotionPiece = uciStr[4].toLowerCase();
      if (!['q', 'r', 'b', 'n'].includes(promotionPiece)) return false;
    }

    return true;
  }
}
