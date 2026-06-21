type CacheEntry<T> = {
  value: T;
  updatedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const setCached = <T>(key: string, value: T) => {
  cache.set(key, {
    value,
    updatedAt: Date.now(),
  });
};

export const getCached = <T>(key: string, maxAgeMs = 5 * 60 * 1000) => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) return null;

  const isFresh = Date.now() - entry.updatedAt <= maxAgeMs;

  if (!isFresh) return null;

  return entry.value;
};

export const removeCached = (key: string) => {
  cache.delete(key);
};

export const invalidateCachedByPrefix = (prefix: string) => {
  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  });
};

export const invalidateSocialCaches = (usuarioId?: string | null) => {
  if (usuarioId) {
    removeCached(`conexiones:usuario:${usuarioId}`);
    removeCached(`solicitudes-pendientes:usuario:${usuarioId}`);
    removeCached(`perfil-resumen:${usuarioId}`);
    removeCached(`eventos:recomendados:${usuarioId}`);
  }

  invalidateCachedByPrefix("publicaciones:evento:");
  invalidateCachedByPrefix("publicacion:");
  invalidateCachedByPrefix("comentarios:publicacion:");
  invalidateCachedByPrefix("asistencias:evento:");
};

export const invalidateEventCaches = (eventoId?: string | null, usuarioId?: string | null) => {
  if (eventoId) {
    removeCached(`evento:${eventoId}`);
    removeCached(`publicaciones:evento:${eventoId}`);
    removeCached(`asistencias:evento:${eventoId}`);
  }

  if (usuarioId) {
    removeCached(`perfil-resumen:${usuarioId}`);
    removeCached(`eventos:recomendados:${usuarioId}`);
  }
};
