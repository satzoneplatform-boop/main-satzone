import { randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Storage layer for student results.
 *
 * The rest of the app only ever talks to a `ResultsStore` (the small async
 * interface implemented below). Swapping the JSON files for Supabase/Postgres
 * later means writing a new class with the same methods and changing the one
 * `createStore()` call in server/index.js — routes, validation, and the whole
 * frontend stay untouched.
 *
 * A store deals in *records*: plain objects that already passed validation.
 * `improvement` for math records is derived on read (see toMathView) so the
 * stored file never holds a value that can drift out of sync with before/after.
 *
 * @typedef {'university' | 'math'} Category
 */

const CATEGORIES = /** @type {const} */ (['university', 'math']);

/**
 * Minimal async mutex: chains operations onto a single promise so concurrent
 * writes to the same file can't interleave and corrupt it. One chain per file.
 */
class Mutex {
  constructor() {
    /** @type {Promise<unknown>} */
    this.tail = Promise.resolve();
  }
  /** @template T @param {() => Promise<T>} fn @returns {Promise<T>} */
  run(fn) {
    const result = this.tail.then(fn, fn);
    // Keep the chain alive regardless of success/failure, but don't leak errors.
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

/** Shape the persisted math record into the API view (adds derived improvement). */
function toMathView(record) {
  return { ...record, improvement: record.mathAfter - record.mathBefore };
}

/**
 * JSON-file-backed implementation of ResultsStore.
 * One file per category; each file holds `{ results: Record[] }`.
 */
export class JsonResultsStore {
  /** @param {{ dataDir: string }} opts */
  constructor({ dataDir }) {
    this.dataDir = dataDir;
    /** @type {Record<Category, string>} */
    this.files = {
      university: path.join(dataDir, 'university-results.json'),
      math: path.join(dataDir, 'math-results.json'),
    };
    /** @type {Record<Category, Mutex>} */
    this.locks = { university: new Mutex(), math: new Mutex() };
  }

  /** @param {Category} category */
  assertCategory(category) {
    if (!CATEGORIES.includes(category)) {
      const err = new Error(`Unknown category: ${category}`);
      err.status = 400;
      throw err;
    }
  }

  /** Read the raw record array for a category (seeds an empty file if missing). */
  async #readAll(category) {
    const file = this.files[category];
    try {
      const raw = await readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.results) ? parsed.results : [];
    } catch (err) {
      if (err.code === 'ENOENT') {
        await this.#writeAll(category, []);
        return [];
      }
      throw err;
    }
  }

  /** Atomically persist the record array: write a temp file, then rename over. */
  async #writeAll(category, results) {
    await mkdir(this.dataDir, { recursive: true });
    const file = this.files[category];
    const tmp = `${file}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify({ results }, null, 2), 'utf8');
    await rename(tmp, file);
  }

  /** Present a stored record as its API view. */
  #view(category, record) {
    return category === 'math' ? toMathView(record) : record;
  }

  /**
   * @param {Category} category
   * @param {{ publishedOnly?: boolean }} [opts]
   */
  async list(category, { publishedOnly = false } = {}) {
    this.assertCategory(category);
    const all = await this.#readAll(category);
    const filtered = publishedOnly ? all.filter((r) => r.published) : all;
    filtered.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return filtered.map((r) => this.#view(category, r));
  }

  /** @param {Category} category @param {string} id */
  async get(category, id) {
    this.assertCategory(category);
    const all = await this.#readAll(category);
    const record = all.find((r) => r.id === id);
    return record ? this.#view(category, record) : null;
  }

  /** @param {Category} category @param {object} data validated fields */
  async create(category, data) {
    this.assertCategory(category);
    return this.locks[category].run(async () => {
      const all = await this.#readAll(category);
      const now = new Date().toISOString();
      const record = {
        id: randomUUID(),
        ...data,
        sortOrder: all.length,
        createdAt: now,
        updatedAt: now,
      };
      all.push(record);
      await this.#writeAll(category, all);
      return this.#view(category, record);
    });
  }

  /** @param {Category} category @param {string} id @param {object} data */
  async update(category, id, data) {
    this.assertCategory(category);
    return this.locks[category].run(async () => {
      const all = await this.#readAll(category);
      const idx = all.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...data, id, updatedAt: new Date().toISOString() };
      await this.#writeAll(category, all);
      return this.#view(category, all[idx]);
    });
  }

  /** @param {Category} category @param {string} id */
  async remove(category, id) {
    this.assertCategory(category);
    return this.locks[category].run(async () => {
      const all = await this.#readAll(category);
      const next = all.filter((r) => r.id !== id);
      if (next.length === all.length) return false;
      await this.#writeAll(category, next);
      return true;
    });
  }

  /** @param {Category} category @param {string} id @param {boolean} published */
  async setPublished(category, id, published) {
    return this.update(category, id, { published });
  }
}

export { CATEGORIES };
