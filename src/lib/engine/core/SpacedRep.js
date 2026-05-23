/**
 * @fileoverview SpacedRep - SuperMemo SM-2 spaced repetition algorithm implementation.
 *
 * SM-2 Algorithm Summary:
 *  - User rates recall quality 0–5 (0 = complete blackout, 5 = perfect recall)
 *  - EFactor (ease factor) starts at 2.5, minimum 1.3
 *  - Intervals: 1 day → 6 days → previous interval × EFactor
 *  - If rating < 3, reset repetitions to 0 and interval to 1
 */

export default class SpacedRep {
  /**
   * @param {{ interval?: number, repetitions?: number, efactor?: number }} [options]
   *   Optional initial state to resume a session.
   */
  constructor(options = {}) {
    this.interval = options.interval ?? 1;
    this.repetitions = options.repetitions ?? 0;
    this.efactor = options.efactor ?? 2.5;

    // dueDate defaults to today
    this.dueDate = new Date();
    this.dueDate.setHours(0, 0, 0, 0);

    /** @type {Array<{ rating: number, date: Date, interval: number, efactor: number, wasSuccessful: boolean }>} */
    this.history = [];
  }

  /**
   * Applies the SM-2 algorithm for a given recall rating.
   *
   * @param {number} rating - Recall quality rating from 0 (blackout) to 5 (perfect).
   * @returns {{ newInterval: number, newEfactor: number, nextDueDate: Date, wasSuccessful: boolean }}
   */
  review(rating) {
    if (rating < 0 || rating > 5) {
      throw new RangeError(`Rating must be between 0 and 5, got ${rating}`);
    }

    const wasSuccessful = rating >= 3;
    let newInterval;
    let newRepetitions;

    if (wasSuccessful) {
      newInterval = SpacedRep.calcNextInterval(this.repetitions, this.efactor, this.interval);
      newRepetitions = this.repetitions + 1;
    } else {
      newInterval = 1;
      newRepetitions = 0;
    }

    const newEfactor = SpacedRep.calcNewEFactor(this.efactor, rating);

    const nextDueDate = new Date();
    nextDueDate.setHours(0, 0, 0, 0);
    nextDueDate.setDate(nextDueDate.getDate() + newInterval);

    // Log the review before updating state
    this.history.push({
      rating,
      date: new Date(),
      interval: newInterval,
      efactor: newEfactor,
      wasSuccessful
    });

    // Update state
    this.interval = newInterval;
    this.repetitions = newRepetitions;
    this.efactor = newEfactor;
    this.dueDate = nextDueDate;

    return { newInterval, newEfactor, nextDueDate, wasSuccessful };
  }

  /**
   * Returns true if today is on or after the due date.
   *
   * @returns {boolean}
   */
  isDue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= this.dueDate;
  }

  /**
   * Returns the current state of this spaced repetition instance.
   *
   * @returns {{ interval: number, repetitions: number, efactor: number, dueDate: Date, reviewCount: number }}
   */
  getState() {
    return {
      interval: this.interval,
      repetitions: this.repetitions,
      efactor: this.efactor,
      dueDate: this.dueDate,
      reviewCount: this.history.length
    };
  }

  /**
   * Calculates the next interval in days based on the SM-2 algorithm.
   *
   * @param {number} repetitions - Number of successful repetitions so far.
   * @param {number} efactor - Current ease factor.
   * @param {number} currentInterval - Current interval in days.
   * @returns {number} Next interval in days.
   */
  static calcNextInterval(repetitions, efactor, currentInterval) {
    if (repetitions === 0) return 1;
    if (repetitions === 1) return 6;
    return Math.round(currentInterval * efactor);
  }

  /**
   * Calculates the new ease factor based on rating.
   * EFactor = EFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
   * Clamped to a minimum of 1.3.
   *
   * @param {number} efactor - Current ease factor.
   * @param {number} rating - Recall quality rating (0–5).
   * @returns {number} New ease factor.
   */
  static calcNewEFactor(efactor, rating) {
    const newEF = efactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    return Math.max(1.3, Math.round(newEF * 1000) / 1000);
  }
}
