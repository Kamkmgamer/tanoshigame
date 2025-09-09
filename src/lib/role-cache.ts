// Generic role-cache utility with pluggable loader.
// You can back the cache with any storage (Redis, etc.). For now it's in-memory.

export interface RoleCacheOptions<Id = string, Role = string> {
  /** Time-to-live for each entry in milliseconds (default: 5 minutes) */
  ttlMs?: number;
  /**
   * Function that fetches roles for a user id when the cache misses.
   * Should resolve to an array (or set) of roles/permissions.
   */
  loader: (id: Id) => Promise<Role[]>;
}

interface Entry<Role> {
  roles: Role[];
  expires: number; // unix ms when this entry expires
}

export function createRoleCache<Id = string, Role = string>(
  opts: RoleCacheOptions<Id, Role>,
) {
  const ttl = opts.ttlMs ?? 5 * 60 * 1000; // default 5 minutes
  const store = new Map<Id, Entry<Role>>();

  async function get(id: Id): Promise<Role[]> {
    const now = Date.now();
    const cached = store.get(id);
    if (cached && cached.expires > now) {
      return cached.roles;
    }

    const roles = await opts.loader(id);
    store.set(id, { roles, expires: now + ttl });
    return roles;
  }

  return { get } as const;
}
