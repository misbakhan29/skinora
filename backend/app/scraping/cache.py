import time
import threading

class SimpleCache:
    """
    Thread-safe in-memory cache with TTL.
    In a real production app, replace this with Redis.
    """
    def __init__(self, default_ttl=21600):  # 6 hours
        self._cache = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl

    def get(self, key):
        with self._lock:
            if key in self._cache:
                item = self._cache[key]
                if time.time() < item['expires_at']:
                    return item['value']
                else:
                    del self._cache[key]
            return None

    def set(self, key, value, ttl=None):
        if ttl is None:
            ttl = self.default_ttl
        with self._lock:
            self._cache[key] = {
                'value': value,
                'expires_at': time.time() + ttl
            }

# Global cache instance
scraper_cache = SimpleCache()
