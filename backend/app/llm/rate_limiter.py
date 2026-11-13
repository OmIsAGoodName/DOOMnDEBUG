import asyncio
import time

class TokenBucket:
    def __init__(self, rate: float = 5.0, capacity: float = 10.0):
        self.rate = rate # tokens per second
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self.last_update
                self.last_update = now
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)

                if self.tokens >= 1.0:
                    self.tokens -= 1.0
                    return
                # Wait for token replenishment
                needed = 1.0 - self.tokens
                wait_time = needed / self.rate
                await asyncio.sleep(max(0.05, wait_time))

# Global semaphore (default 2 concurrency) and token bucket
semaphore = asyncio.Semaphore(2)
rate_limiter = TokenBucket(rate=4.0, capacity=8.0)
