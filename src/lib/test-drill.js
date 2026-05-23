import TrainingEngine from './trainingEngine.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log("=== STARTING HEADLESS DIAGNOSTIC TEST DRILL ===\n");

// --- TEST 1: Learn Mode ---
console.log("--- Test Case 1: King's Indian Defense in LEARN mode ---");
const kidEngine = new TrainingEngine("King's Indian Defense (Classical Variation)", "learn");
assert(kidEngine.currentIndex === 0, "Initial index should be 0");
assert(kidEngine.failed === false, "Initial failure flag should be false");

// Simulating correct first move: d4 (d2d4)
console.log("Simulating correct first move (1. d4 / d2d4)...");
const res1 = kidEngine.submitMove("d2d4");
console.log("Result:", JSON.stringify(res1, null, 2));

assert(res1.status === 'correct', "Expected move status to be 'correct'");
assert(res1.blackReply !== null, "Expected Black to have a reply");
assert(res1.blackReply.uci === 'g8f6', "Expected Black reply to be g8f6");
assert(res1.blackReply.san === 'Nf6', "Expected Black reply SAN to be Nf6");
assert(res1.blackReply.step === 2, "Expected Black reply step to be 2");
assert(kidEngine.currentIndex === 2, "Expected index to progress to 2 (after White and Black moves)");
assert(kidEngine.failed === false, "Failure flag should remain false");

// Simulating incorrect second move: e4 (e2e4) instead of c4 (c2c4)
console.log("\nSimulating incorrect second move (e2e4 instead of c2c4)...");
const res2 = kidEngine.submitMove("e2e4");
console.log("Result:", JSON.stringify(res2, null, 2));

assert(res2.status === 'incorrect', "Expected move status to be 'incorrect'");
assert(res2.highlightSquares && res2.highlightSquares[0] === 'c2' && res2.highlightSquares[1] === 'c4', "Expected highlight to be c2-c4");
assert(kidEngine.currentIndex === 2, "Expected index to remain at 2");
assert(kidEngine.failed === false, "Failure flag should remain false in learn mode");

// Simulating correct second move: c4 (c2c4)
console.log("\nSimulating correct second move (2. c4 / c2c4)...");
const res3 = kidEngine.submitMove("c2c4");
console.log("Result:", JSON.stringify(res3, null, 2));

assert(res3.status === 'correct', "Expected move status to be 'correct'");
assert(res3.blackReply.uci === 'g7g6', "Expected Black reply to be g7g6");
assert(kidEngine.currentIndex === 4, "Expected index to progress to 4");

console.log("\n✅ Learn mode tests passed successfully!\n");


// --- TEST 2: Practice Mode ---
console.log("--- Test Case 2: King's Indian Defense in PRACTICE mode ---");
const kidPractice = new TrainingEngine("King's Indian Defense (Classical Variation)", "practice");
assert(kidPractice.currentIndex === 0, "Initial index should be 0");

console.log("Simulating correct first move (d2d4)...");
const resP1 = kidPractice.submitMove("d2d4");
assert(resP1.status === 'correct', "Expected correct move");
assert(kidPractice.currentIndex === 2, "Expected index to progress to 2");
assert(kidPractice.failed === false, "Failed flag should be false");

console.log("Simulating incorrect second move (e2e4 instead of c2c4)...");
const resP2 = kidPractice.submitMove("e2e4");
console.log("Result:", JSON.stringify(resP2, null, 2));

assert(resP2.status === 'failed', "Expected status 'failed'");
assert(kidPractice.currentIndex === 0, "Practice mode should reset index to 0");
assert(kidPractice.failed === true, "Practice mode should set failed = true");

console.log("\nSimulating move in failed state...");
const resP3 = kidPractice.submitMove("d2d4");
console.log("Result:", JSON.stringify(resP3, null, 2));
assert(resP3.status === 'failed', "Expected status 'failed' due to failed state");

console.log("\nResetting practice engine...");
kidPractice.reset();
assert(kidPractice.currentIndex === 0, "Index should reset to 0");
assert(kidPractice.failed === false, "Failed flag should reset to false");

console.log("Simulating correct first move after reset (d2d4)...");
const resP4 = kidPractice.submitMove("d2d4");
assert(resP4.status === 'correct', "Expected correct move after reset");
assert(kidPractice.currentIndex === 2, "Expected index to progress to 2");

console.log("\n✅ Practice mode tests passed successfully!\n");

// --- TEST 3: Caro-Kann Defense ---
console.log("--- Test Case 3: Caro-Kann Defense in LEARN mode ---");
const ckEngine = new TrainingEngine("Caro-Kann Defense", "learn");
assert(ckEngine.currentIndex === 0, "Initial index should be 0");

console.log("Simulating correct first move (e2e4)...");
const resCK1 = ckEngine.submitMove("e2e4");
assert(resCK1.status === 'correct', "Expected correct move");
assert(resCK1.blackReply.uci === 'c7c6', "Expected Black reply c7c6");
assert(ckEngine.currentIndex === 2, "Expected index to progress to 2");

console.log("\n✅ Caro-Kann tests passed successfully!\n");

console.log("=== ALL DIAGNOSTIC TESTS PASSED SUCCESSFULLY ===");
