import type { Memory, MemoryType, MemoryStatus } from '../../shared/types';

/**
 * Client-side in-memory cache for Memory objects.
 *
 * Usage:
 *   const store = new MemoryStore();
 *   store.setMemories(fetchedMemories);
 *   const active = store.getActive();
 */
export class MemoryStore {
  private memories: Memory[] = [];

  // ── Bulk operations ──

  /**
   * Replace all cached memories with a new set.
   */
  setMemories(mems: Memory[]): void {
    this.memories = [...mems];
  }

  /**
   * Add a single memory to the cache. If a memory with the same id already
   * exists it is replaced; otherwise it is appended.
   */
  upsert(memory: Memory): void {
    const idx = this.memories.findIndex((m) => m.id === memory.id);
    if (idx >= 0) {
      this.memories[idx] = memory;
    } else {
      this.memories.push(memory);
    }
  }

  /**
   * Remove a memory by id. Returns true if a memory was removed.
   */
  remove(id: string): boolean {
    const idx = this.memories.findIndex((m) => m.id === id);
    if (idx >= 0) {
      this.memories.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove all memories for a given project.
   */
  removeByProject(projectId: string): number {
    const before = this.memories.length;
    this.memories = this.memories.filter((m) => m.projectId !== projectId);
    return before - this.memories.length;
  }

  /**
   * Clear the entire store.
   */
  clear(): void {
    this.memories = [];
  }

  // ── Accessors ──

  /**
   * Return all cached memories.
   */
  getAll(): Memory[] {
    return [...this.memories];
  }

  /**
   * Look up a single memory by its id.
   */
  getById(id: string): Memory | undefined {
    return this.memories.find((m) => m.id === id);
  }

  /**
   * Return all memories belonging to a specific project.
   */
  getByProject(projectId: string): Memory[] {
    return this.memories.filter((m) => m.projectId === projectId);
  }

  /**
   * Return all memories of a given type.
   */
  getByType(type: MemoryType): Memory[] {
    return this.memories.filter((m) => m.type === type);
  }

  /**
   * Return memories scoped to a specific provider.
   */
  getByProvider(providerScope: string): Memory[] {
    return this.memories.filter((m) => m.providerScope === providerScope);
  }

  /**
   * Return memories matching a given status.
   */
  getByStatus(status: MemoryStatus): Memory[] {
    return this.memories.filter((m) => m.status === status);
  }

  /**
   * Full-text search across title, content, and tags.
   * The query is split into words and a memory matches if *all* words appear
   * somewhere in the searchable text (case-insensitive).
   */
  search(query: string): Memory[] {
    if (!query || query.trim().length === 0) return this.getAll();

    const words = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) return this.getAll();

    return this.memories.filter((m) => {
      const searchable = [m.title, m.content, ...m.tags]
        .join(' ')
        .toLowerCase();
      return words.every((w) => searchable.includes(w));
    });
  }

  /**
   * Return the top N memories sorted by importance (descending).
   */
  getTopByImportance(limit: number): Memory[] {
    return [...this.memories]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * Return all memories with status 'active'.
   */
  getActive(): Memory[] {
    return this.memories.filter((m) => m.status === 'active');
  }

  /**
   * Return all memories with status 'pending'.
   */
  getPending(): Memory[] {
    return this.memories.filter((m) => m.status === 'pending');
  }

  /**
   * Return all memories with status 'archived'.
   */
  getArchived(): Memory[] {
    return this.memories.filter((m) => m.status === 'archived');
  }

  // ── Stats ──

  /**
   * Return the total number of cached memories.
   */
  get count(): number {
    return this.memories.length;
  }

  /**
   * Return counts grouped by type.
   */
  countByType(): Record<MemoryType, number> {
    const counts: Record<string, number> = {};
    for (const m of this.memories) {
      counts[m.type] = (counts[m.type] ?? 0) + 1;
    }
    return counts as Record<MemoryType, number>;
  }

  /**
   * Return counts grouped by status.
   */
  countByStatus(): Record<MemoryStatus, number> {
    const counts: Record<string, number> = {};
    for (const m of this.memories) {
      counts[m.status] = (counts[m.status] ?? 0) + 1;
    }
    return counts as Record<MemoryStatus, number>;
  }
}
