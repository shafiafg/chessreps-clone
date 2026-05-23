/**
 * debug-harness.js
 * Comprehensive diagnostic test runner for the Chess Engine Logic Layer.
 * Run with: node src/lib/engine/debug-harness.js
 */

import OpeningTree from './models/OpeningTree.js';
import MoveNode from './models/MoveNode.js';
import MoveValidator from './core/MoveValidator.js';
import SpacedRep from './core/SpacedRep.js';
import SessionState from './core/SessionState.js';
import EngineFacade from './services/EngineFacade.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repertoire = JSON.parse(readFileSync(path.resolve(__dirname, './data/repertoire.json'), 'utf8'));

// ─── Assertion Tracker ───────────────────────────────────────────────────────
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, label) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ PASS: ${label}`);
  } else {
    failedAssertions++;
    console.error(`  ❌ FAIL: ${label}`);
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SECTION: ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

// ─── Section 1: OpeningTree Traversal ────────────────────────────────────────
section('1 — OpeningTree Traversal');

const kidData = repertoire['kings-indian-defense'];
const kidTree = new OpeningTree(kidData);

const root = kidTree.getRoot();
assert(root !== undefined, 'Root node exists');
assert(root.uci === 'd2d4', `Root UCI is 'd2d4' (got '${root.uci}')`);
assert(root.id === 'kid-1-d4', `Root ID is 'kid-1-d4' (got '${root.id}')`);
assert(root instanceof MoveNode, 'Root is a MoveNode instance');

const nextMoves = kidTree.getNextExpectedMoves(root.id);
assert(nextMoves.length >= 1, `getNextExpectedMoves returns >= 1 node (got ${nextMoves.length})`);
assert(nextMoves[0].uci === 'g8f6', `First child is 'g8f6' (got '${nextMoves[0].uci}')`);

const foundRoot = kidTree.findNodeByUCI('d2d4', null);
assert(foundRoot !== null, 'findNodeByUCI finds root by UCI');
assert(foundRoot.id === root.id, 'findNodeByUCI returns correct root node');

const summary = kidTree.toSummary();
console.log('\n  Tree Summary:', JSON.stringify(summary, null, 2));
assert(typeof summary.totalNodes === 'number' && summary.totalNodes > 0, `Total nodes > 0 (got ${summary.totalNodes})`);
assert(typeof summary.leafCount === 'number' && summary.leafCount > 0, `Leaf count > 0 (got ${summary.leafCount})`);
assert(summary.rootId === 'kid-1-d4', `Summary rootId is correct`);

const branchNode = kidTree.getNode('kid-10-oo');
assert(branchNode !== undefined, 'Branch node kid-10-oo exists');
const branchChildren = kidTree.getNextExpectedMoves('kid-10-oo');
assert(branchChildren.length === 2, `Branch node has 2 children (got ${branchChildren.length})`);

const pathToLeaf = kidTree.getPathToNode('kid-12a-e5');
assert(Array.isArray(pathToLeaf) && pathToLeaf.length > 0, `getPathToNode returns non-empty path (length ${pathToLeaf.length})`);
assert(pathToLeaf[0].id === 'kid-1-d4', 'Path starts at root');
assert(pathToLeaf[pathToLeaf.length - 1].id === 'kid-12a-e5', 'Path ends at target node');

// ─── Section 2: MoveValidator ────────────────────────────────────────────────
section('2 — MoveValidator');

const validator = new MoveValidator(kidTree);

const parsed1 = validator.parseUCI('d2d4');
console.log('\n  parseUCI("d2d4"):', parsed1);
assert(parsed1.from === 'd2', `parseUCI from='d2' (got '${parsed1.from}')`);
assert(parsed1.to === 'd4', `parseUCI to='d4' (got '${parsed1.to}')`);
assert(parsed1.promotion === null, `parseUCI promotion=null (got '${parsed1.promotion}')`);

const parsed2 = validator.parseUCI('e7e8q');
console.log('  parseUCI("e7e8q"):', parsed2);
assert(parsed2.from === 'e7', `parseUCI promotion from='e7'`);
assert(parsed2.to === 'e8', `parseUCI promotion to='e8'`);
assert(parsed2.promotion === 'q', `parseUCI promotion='q' (got '${parsed2.promotion}')`);

assert(validator.isValidUCIFormat('d2d4') === true, `isValidUCIFormat('d2d4') = true`);
assert(validator.isValidUCIFormat('e7e8q') === true, `isValidUCIFormat('e7e8q') = true`);
assert(validator.isValidUCIFormat('zzz9') === false, `isValidUCIFormat('zzz9') = false`);
assert(validator.isValidUCIFormat('d2d') === false, `isValidUCIFormat('d2d') = false (too short)`);
assert(validator.isValidUCIFormat('') === false, `isValidUCIFormat('') = false (empty)`);

// validate: from root, the next expected move is g8f6 (Black's reply)
// Root represents White's d2d4 having been played; its child is g8f6
const validResult = validator.validate('g8f6', root.id);
console.log('\n  validate("g8f6", rootId) [correct child]:', validResult);
assert(validResult.valid === true, `validate correct child move returns valid=true (got valid=${validResult.valid})`);
assert(validResult.matchedNode?.uci === 'g8f6', `matchedNode.uci is 'g8f6' (got '${validResult.matchedNode?.uci}')`);

const invalidResult = validator.validate('e2e4', root.id);
console.log('  validate("e2e4", rootId) [wrong]:', invalidResult);
assert(invalidResult.valid === false, `validate wrong move returns valid=false (got valid=${invalidResult.valid})`);
assert(Array.isArray(invalidResult.expectedMoves), `expectedMoves is an array`);
assert(typeof invalidResult.hint === 'string', `hint is a string`);

// validate the root's own UCI from a null/undefined context via findNodeByUCI
const rootByUCI = kidTree.findNodeByUCI('d2d4', null);
assert(rootByUCI?.uci === 'd2d4', `findNodeByUCI('d2d4', null) finds root (got '${rootByUCI?.uci}')`);


// ─── Section 3: SpacedRep SM-2 ───────────────────────────────────────────────
section('3 — SpacedRep SM-2 Algorithm');

const sr = new SpacedRep();
assert(sr.interval === 1, `Initial interval = 1`);
assert(sr.efactor === 2.5, `Initial EFactor = 2.5`);
assert(sr.repetitions === 0, `Initial repetitions = 0`);

const review1 = sr.review(5);
console.log('\n  review(5):', review1);
assert(review1.wasSuccessful === true, `review(5) wasSuccessful=true`);
assert(review1.newInterval >= 1, `review(5) newInterval >= 1 (got ${review1.newInterval})`);

const review2 = sr.review(5);
console.log('  review(5) again:', review2);
assert(review2.newInterval > review1.newInterval, `Second review interval > first (${review2.newInterval} > ${review1.newInterval})`);

const review3 = sr.review(1);
console.log('  review(1) (fail):', review3);
assert(review3.wasSuccessful === false, `review(1) wasSuccessful=false`);
assert(review3.newInterval === 1, `review(1) resets interval to 1 (got ${review3.newInterval})`);

const ef = SpacedRep.calcNewEFactor(2.5, 3);
console.log(`\n  calcNewEFactor(2.5, 3) =`, ef);
assert(typeof ef === 'number', `calcNewEFactor returns a number`);

const nextInterval = SpacedRep.calcNextInterval(2, 2.5, 6);
console.log(`  calcNextInterval(2, 2.5, 6) =`, nextInterval);
assert(nextInterval === 15, `calcNextInterval(2, 2.5, 6) = 15 (got ${nextInterval})`);

assert(typeof sr.isDue() === 'boolean', `isDue() returns boolean`);
assert(sr.history.length === 3, `history has 3 entries (got ${sr.history.length})`);

const state = sr.getState();
assert(typeof state.efactor === 'number', `getState().efactor is a number`);
assert(state.reviewCount === 3, `getState().reviewCount = 3 (got ${state.reviewCount})`);

// ─── Section 4: SessionState ─────────────────────────────────────────────────
section('4 — SessionState');

const learnSession = new SessionState(kidTree, 'learn');
assert(learnSession.currentNodeId === null, `Learn session starts at null`);
assert(learnSession.locked === false, `Learn session not locked`);

const advanceSnapshot = learnSession.advance(root);
console.log('\n  advance(root) snapshot:', advanceSnapshot);
assert(advanceSnapshot.moveCount === 1, `moveCount = 1 after one advance`);
assert(learnSession.currentNodeId === root.id, `currentNodeId updated to root.id`);

const learnFail = learnSession.recordFailure('e2e4');
console.log('  recordFailure("e2e4") learn mode:', learnFail);
assert(learnFail.failCount === 1, `failCount = 1 after failure (got ${learnFail.failCount})`);
assert(learnFail.locked === false, `Locked = false in learn mode`);
assert(typeof learnFail.hint === 'string', `Hint returned in learn mode`);

const practiceSession = new SessionState(kidTree, 'practice');
const practiceFail = practiceSession.recordFailure('e2e4');
console.log('\n  recordFailure("e2e4") practice mode:', practiceFail);
assert(practiceFail.locked === true, `Practice mode sets locked=true`);
assert(practiceSession.currentNodeId === null, `Practice reset to null`);

practiceSession.reset();
const resetSnap = practiceSession.getSnapshot();
assert(resetSnap.locked === false, `After reset() locked=false`);
assert(resetSnap.currentNodeId === null, `After reset() currentNodeId=null`);
assert(resetSnap.failCount === 0, `After reset() failCount=0`);

// ─── Section 5: EngineFacade Full Pipeline ────────────────────────────────────
section('5 — EngineFacade Full Pipeline');

// Learn mode
const learnEngine = new EngineFacade('kings-indian-defense', 'learn');
const move1 = learnEngine.submitMove('d2d4');
console.log('\n  Learn: submitMove("d2d4"):', JSON.stringify(move1, null, 2));
assert(move1.status === 'correct', `Correct move returns status='correct' (got '${move1.status}')`);
assert(move1.san === 'd4', `SAN is 'd4' (got '${move1.san}')`);
assert(move1.blackReply !== null, `blackReply is not null`);
assert(move1.blackReply?.uci === 'g8f6', `Black replies g8f6 (got '${move1.blackReply?.uci}')`);

// Wrong move in learn mode
const move2 = learnEngine.submitMove('e2e4');
console.log('\n  Learn: submitMove("e2e4") [wrong]:', JSON.stringify(move2, null, 2));
assert(move2.status === 'incorrect', `Wrong move in learn mode = status='incorrect' (got '${move2.status}')`);
assert(typeof move2.hint === 'string', `Hint provided for wrong move`);
assert(Array.isArray(move2.highlightSquares), `highlightSquares is an array`);

// Practice mode full pipeline
const practiceEngine = new EngineFacade('kings-indian-defense', 'practice');
const pm1 = practiceEngine.submitMove('d2d4');
assert(pm1.status === 'correct', `Practice: correct first move (got '${pm1.status}')`);

const pm2 = practiceEngine.submitMove('e2e4'); // wrong
console.log('\n  Practice: submitMove("e2e4") [wrong]:', JSON.stringify(pm2, null, 2));
assert(pm2.status === 'failed', `Practice wrong move = status='failed' (got '${pm2.status}')`);

const pm3 = practiceEngine.submitMove('d2d4'); // while locked
console.log('  Practice: submitMove while locked:', pm3);
assert(pm3.status === 'locked', `Locked session returns status='locked'`);

// SM-2 review via facade
const reviewResult = practiceEngine.reviewPerformance(4);
console.log('\n  reviewPerformance(4):', reviewResult);
assert(typeof reviewResult.newInterval === 'number', `reviewPerformance returns newInterval`);
assert(reviewResult.wasSuccessful === true, `Rating 4 is successful`);

// getStatus
const status = practiceEngine.getStatus();
console.log('\n  getStatus():', JSON.stringify(status, null, 2));
assert(typeof status.opening === 'string', `status.opening is a string`);
assert(typeof status.spacedRep === 'object', `status.spacedRep is an object`);

// ─── Section 6: Caro-Kann Branching ──────────────────────────────────────────
section('6 — Caro-Kann Branching');

const ckEngine = new EngineFacade('caro-kann-defense', 'learn');
const ck1 = ckEngine.submitMove('e2e4');
console.log('\n  CK: submitMove("e2e4"):', JSON.stringify(ck1, null, 2));
assert(ck1.status === 'correct', `CK first move correct`);
assert(ck1.blackReply.uci === 'c7c6', `CK Black replies c7c6 (got '${ck1.blackReply?.uci}')`);

// Navigate to the Nxe4 branch point (ck-7-nxe4)
ckEngine.submitMove('d2d4');  // White d4
ckEngine.submitMove('b1c3');  // White Nc3 — auto Black dxe4
ckEngine.submitMove('c3e4');  // White Nxe4 — this is the branch point

const availableAfterNxe4 = ckEngine.getAvailableMoves();
console.log('\n  getAvailableMoves() at Nxe4 branch:', availableAfterNxe4.map(n => `${n.uci} (${n.san})`));
assert(availableAfterNxe4.length >= 2, `Branch at Nxe4 has >= 2 children (got ${availableAfterNxe4.length})`);

const childUCIs = availableAfterNxe4.map(n => n.uci);
assert(childUCIs.includes('c8f5'), `Branch includes Bf5 (c8f5)`);
assert(childUCIs.includes('b8d7'), `Branch includes Nd7 (b8d7)`);

// ─── Final Summary ────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`  DIAGNOSTIC SUMMARY`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Total assertions : ${totalAssertions}`);
console.log(`  ✅ Passed        : ${passedAssertions}`);
console.log(`  ❌ Failed        : ${failedAssertions}`);
console.log(`${'═'.repeat(60)}\n`);

if (failedAssertions > 0) {
  console.error(`\n🚨 ${failedAssertions} assertion(s) failed. Engine has defects.\n`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${totalAssertions} ASSERTIONS PASSED. Engine brain is clean.\n`);
  process.exit(0);
}
