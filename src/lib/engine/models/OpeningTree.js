/**
 * OpeningTree.js
 * Parses a single opening's repertoire data into a traversable tree of MoveNode instances.
 */
import MoveNode from './MoveNode.js';

export default class OpeningTree {
  /**
   * @param {{ name: string, root: string, nodes: Object }} openingData
   */
  constructor(openingData) {
    if (!openingData || !openingData.nodes || !openingData.root) {
      throw new Error('OpeningTree: invalid opening data structure.');
    }

    this.name = openingData.name;
    this.rootId = openingData.root;

    /** @type {Map<string, MoveNode>} */
    this.nodes = new Map();

    // First pass: build all MoveNode instances
    for (const [id, rawNode] of Object.entries(openingData.nodes)) {
      this.nodes.set(id, new MoveNode(rawNode));
    }

    // Second pass: assign parentId by traversing child references
    for (const [id, node] of this.nodes) {
      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (child) {
          child.parentId = id;
        }
      }
    }
  }

  /**
   * Returns a MoveNode by its ID.
   * @param {string} id
   * @returns {MoveNode|undefined}
   */
  getNode(id) {
    return this.nodes.get(id);
  }

  /**
   * Returns the root MoveNode.
   * @returns {MoveNode}
   */
  getRoot() {
    return this.nodes.get(this.rootId);
  }

  /**
   * Returns all child MoveNode objects of the given node.
   * If currentNodeId is null, returns the root node.
   * @param {string|null} currentNodeId
   * @returns {MoveNode[]}
   */
  getNextExpectedMoves(currentNodeId) {
    if (currentNodeId === null) {
      const root = this.getRoot();
      return root ? [root] : [];
    }
    const node = this.nodes.get(currentNodeId);
    if (!node) return [];
    return node.children.map(childId => this.nodes.get(childId)).filter(Boolean);
  }

  /**
   * Given a parent node ID and a UCI string, returns the matching child MoveNode or null.
   * If fromNodeId is null, searches the root node's children.
   * @param {string} uci
   * @param {string|null} fromNodeId
   * @returns {MoveNode|null}
   */
  findNodeByUCI(uci, fromNodeId) {
    const parentId = fromNodeId ?? this.rootId;
    const parent = this.nodes.get(parentId);
    if (!parent) return null;

    // Special case: check if the parent itself matches (root lookup)
    if (parent.uci === uci) return parent;

    for (const childId of parent.children) {
      const child = this.nodes.get(childId);
      if (child && child.uci === uci) return child;
    }
    return null;
  }

  /**
   * Returns an ordered array of MoveNodes from the root to the given nodeId (inclusive).
   * @param {string} nodeId
   * @returns {MoveNode[]}
   */
  getPathToNode(nodeId) {
    const path = [];
    let current = this.nodes.get(nodeId);

    while (current) {
      path.unshift(current);
      if (!current.parentId) break;
      current = this.nodes.get(current.parentId);
    }

    return path;
  }

  /**
   * Returns summary statistics about the tree.
   * @returns {{ name: string, totalNodes: number, leafCount: number, rootId: string }}
   */
  toSummary() {
    let leafCount = 0;
    for (const node of this.nodes.values()) {
      if (node.isLeaf()) leafCount++;
    }

    return {
      name: this.name,
      totalNodes: this.nodes.size,
      leafCount,
      rootId: this.rootId
    };
  }
}
