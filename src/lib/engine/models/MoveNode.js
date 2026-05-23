/**
 * MoveNode.js
 * Represents a single move node in an opening repertoire graph.
 */
export default class MoveNode {
  /**
   * @param {Object} rawNode - Raw node object from repertoire.json
   * @param {string} rawNode.id
   * @param {string} rawNode.uci
   * @param {string} rawNode.san
   * @param {string} rawNode.commentary
   * @param {string[]} rawNode.children
   * @param {string|null} [parentId]
   */
  constructor(rawNode, parentId = null) {
    this.id = rawNode.id;
    this.uci = rawNode.uci;
    this.san = rawNode.san;
    this.commentary = rawNode.commentary;
    this.children = Array.isArray(rawNode.children) ? [...rawNode.children] : [];
    this.parentId = parentId;
  }

  /**
   * Returns true if this node has no children (end of line).
   * @returns {boolean}
   */
  isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Returns true if the given nodeId is a direct child.
   * @param {string} nodeId
   * @returns {boolean}
   */
  hasChild(nodeId) {
    return this.children.includes(nodeId);
  }

  /**
   * Returns a plain object representation of this node.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      uci: this.uci,
      san: this.san,
      commentary: this.commentary,
      children: [...this.children],
      parentId: this.parentId,
      isLeaf: this.isLeaf()
    };
  }
}
